import express, { Response } from 'express';
import { randomBytes } from 'crypto';
import { cscaPool, pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * 获取当前周编号（基于ISO周编号，每周一为新的一周）
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  // 计算周编号，加上年份以确保跨年唯一
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return now.getFullYear() * 100 + weekNum; // 例如：202603 表示2026年第3周
}

/**
 * 生成六位机构码（大写字母+数字）
 */
function generateInstitutionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomData = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomData[i] % chars.length];
  }
  return code;
}

/**
 * 检查用户是否为机构用户
 */
async function checkIsInstitution(userId: string): Promise<boolean> {
  const [users] = await pool.query(
    'SELECT user_type FROM users WHERE id = ?',
    [userId]
  );
  return (users as any[]).length > 0 && (users as any[])[0].user_type === 'institution';
}

/**
 * 获取或更新机构码
 * 如果当前周编号与存储的不同，则生成新码
 */
async function getOrUpdateInstitutionCode(institutionId: string): Promise<string> {
  const currentWeek = getCurrentWeekNumber();
  
  // 查询现有机构码
  const [existing] = await cscaPool.query(
    'SELECT * FROM institution_codes WHERE institution_id = ?',
    [institutionId]
  );

  if ((existing as any[]).length > 0) {
    const record = (existing as any[])[0];
    // 如果周编号相同，返回现有码
    if (record.week_number === currentWeek) {
      return record.code;
    }
    // 周编号不同，更新码
    const newCode = generateInstitutionCode();
    await cscaPool.query(
      'UPDATE institution_codes SET code = ?, week_number = ?, updated_at = NOW() WHERE institution_id = ?',
      [newCode, currentWeek, institutionId]
    );
    return newCode;
  }

  // 不存在记录，创建新的
  const newCode = generateInstitutionCode();
  await cscaPool.query(
    'INSERT INTO institution_codes (institution_id, code, week_number) VALUES (?, ?, ?)',
    [institutionId, newCode, currentWeek]
  );
  return newCode;
}

// ==================== 机构管理接口 ====================

/**
 * 获取当前机构的机构码
 * GET /api/institution/code
 */
router.get('/code', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查是否为机构用户
    const isInstitution = await checkIsInstitution(userId);
    if (!isInstitution) {
      return res.status(403).json({ message: '只有机构用户可以访问此接口' });
    }

    // 获取或更新机构码
    const code = await getOrUpdateInstitutionCode(userId);
    
    // 获取下次更新时间（下周一0点）
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    res.json({
      success: true,
      data: {
        code,
        nextUpdateTime: nextMonday.toISOString()
      }
    });
  } catch (error) {
    console.error('获取机构码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 获取绑定到当前机构的学生列表
 * GET /api/institution/students
 */
router.get('/students', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查是否为机构用户
    const isInstitution = await checkIsInstitution(userId);
    if (!isInstitution) {
      return res.status(403).json({ message: '只有机构用户可以访问此接口' });
    }

    // 分页参数
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    // 构建查询
    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.nationality,
        u.created_at as user_created_at,
        sib.bound_at
      FROM student_institution_bindings sib
      INNER JOIN weland.users u ON sib.student_id = u.id
      WHERE sib.institution_id = ?
    `;
    let countQuery = `
      SELECT COUNT(*) as total
      FROM student_institution_bindings sib
      INNER JOIN weland.users u ON sib.student_id = u.id
      WHERE sib.institution_id = ?
    `;
    const params: any[] = [userId];
    const countParams: any[] = [userId];

    if (search) {
      query += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      countQuery += ' AND (u.username LIKE ? OR u.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY sib.bound_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [students] = await cscaPool.query(query, params);
    const [countResult] = await cscaPool.query(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取学生列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 获取机构仪表盘统计数据
 * GET /api/institution/stats
 */
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查是否为机构用户
    const isInstitution = await checkIsInstitution(userId);
    if (!isInstitution) {
      return res.status(403).json({ message: '只有机构用户可以访问此接口' });
    }

    // 获取绑定学生总数
    const [totalResult] = await cscaPool.query(
      'SELECT COUNT(*) as total FROM student_institution_bindings WHERE institution_id = ?',
      [userId]
    );
    const totalStudents = (totalResult as any[])[0].total;

    // 获取本周新增学生数
    const [weekResult] = await cscaPool.query(
      `SELECT COUNT(*) as count FROM student_institution_bindings 
       WHERE institution_id = ? AND bound_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`,
      [userId]
    );
    const newStudentsThisWeek = (weekResult as any[])[0].count;

    // 获取本月新增学生数
    const [monthResult] = await cscaPool.query(
      `SELECT COUNT(*) as count FROM student_institution_bindings 
       WHERE institution_id = ? AND MONTH(bound_at) = MONTH(CURDATE()) AND YEAR(bound_at) = YEAR(CURDATE())`,
      [userId]
    );
    const newStudentsThisMonth = (monthResult as any[])[0].count;

    res.json({
      success: true,
      data: {
        totalStudents,
        newStudentsThisWeek,
        newStudentsThisMonth
      }
    });
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 检查当前用户是否为机构用户
 * GET /api/institution/check
 */
router.get('/check', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, isInstitution: false });
    }

    const isInstitution = await checkIsInstitution(userId);
    
    res.json({
      success: true,
      isInstitution
    });
  } catch (error) {
    console.error('检查机构用户错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 获取机构绑定学生的已审核购买记录
 * GET /api/institution/student-orders
 */
router.get('/student-orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查是否为机构用户
    const isInstitution = await checkIsInstitution(userId);
    if (!isInstitution) {
      return res.status(403).json({ message: '只有机构用户可以访问此接口' });
    }

    // 分页参数
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // 获取该机构绑定的学生的已审核购买记录
    const query = `
      SELECT 
        co.id as order_id,
        co.order_code,
        co.order_items,
        co.total_price,
        co.status,
        co.created_at as order_created_at,
        co.approved_at,
        u.id as student_id,
        u.username as student_username,
        u.email as student_email
      FROM card_orders co
      INNER JOIN student_institution_bindings sib ON co.user_id = sib.student_id
      INNER JOIN weland.users u ON co.user_id = u.id
      WHERE sib.institution_id = ? AND co.status = 'approved'
      ORDER BY co.approved_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM card_orders co
      INNER JOIN student_institution_bindings sib ON co.user_id = sib.student_id
      WHERE sib.institution_id = ? AND co.status = 'approved'
    `;

    const [orders] = await cscaPool.query(query, [userId, limit, offset]);
    const [countResult] = await cscaPool.query(countQuery, [userId]);
    const total = (countResult as any[])[0].total;

    // 解析 order_items JSON
    const parsedOrders = (orders as any[]).map(order => ({
      ...order,
      order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items
    }));

    res.json({
      success: true,
      data: {
        orders: parsedOrders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取学生购买记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 获取本季度佣金统计
 * GET /api/institution/commission
 * 每张卡返佣10元，只计算approved的订单
 */
router.get('/commission', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权' });
    }

    // 检查是否为机构用户
    const isInstitution = await checkIsInstitution(userId);
    if (!isInstitution) {
      return res.status(403).json({ message: '只有机构用户可以访问此接口' });
    }

    // 计算当前季度的开始和结束日期
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 季度: Q1(1-3月), Q2(4-6月), Q3(7-9月), Q4(10-12月)
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const quarterStart = new Date(currentYear, quarterStartMonth, 1);
    const quarterEnd = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59, 999);

    // 获取本季度绑定学生的已审核订单
    const [orders] = await cscaPool.query(`
      SELECT co.order_items
      FROM card_orders co
      INNER JOIN student_institution_bindings sib ON co.user_id = sib.student_id
      WHERE sib.institution_id = ? 
        AND co.status = 'approved'
        AND co.approved_at >= ?
        AND co.approved_at <= ?
    `, [userId, quarterStart, quarterEnd]);

    // 计算总卡数
    let totalCards = 0;
    (orders as any[]).forEach(order => {
      const items = typeof order.order_items === 'string' 
        ? JSON.parse(order.order_items) 
        : order.order_items;
      items.forEach((item: any) => {
        totalCards += item.quantity || 1;
      });
    });

    // 每张卡返佣10元
    const commissionPerCard = 10;
    const totalCommission = totalCards * commissionPerCard;

    // 获取历史总佣金（所有时间）
    const [allOrders] = await cscaPool.query(`
      SELECT co.order_items
      FROM card_orders co
      INNER JOIN student_institution_bindings sib ON co.user_id = sib.student_id
      WHERE sib.institution_id = ? AND co.status = 'approved'
    `, [userId]);

    let allTimeCards = 0;
    (allOrders as any[]).forEach(order => {
      const items = typeof order.order_items === 'string' 
        ? JSON.parse(order.order_items) 
        : order.order_items;
      items.forEach((item: any) => {
        allTimeCards += item.quantity || 1;
      });
    });
    const allTimeCommission = allTimeCards * commissionPerCard;

    // 获取季度信息
    const quarter = Math.floor(currentMonth / 3) + 1;

    res.json({
      success: true,
      data: {
        quarterInfo: {
          year: currentYear,
          quarter: quarter,
          startDate: quarterStart.toISOString(),
          endDate: quarterEnd.toISOString()
        },
        quarterStats: {
          totalCards: totalCards,
          commissionPerCard: commissionPerCard,
          totalCommission: totalCommission
        },
        allTimeStats: {
          totalCards: allTimeCards,
          totalCommission: allTimeCommission
        }
      }
    });
  } catch (error) {
    console.error('获取佣金统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 通过机构码验证并返回机构信息（供注册时使用）
 * POST /api/institution/verify-code
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.json({ valid: false, message: '请提供有效的六位机构码' });
    }

    const currentWeek = getCurrentWeekNumber();

    // 查找该机构码
    const [codes] = await cscaPool.query(
      'SELECT institution_id FROM institution_codes WHERE code = ? AND week_number = ?',
      [code.toUpperCase(), currentWeek]
    );

    if ((codes as any[]).length === 0) {
      return res.json({ valid: false, message: '机构码无效或已过期' });
    }

    const institutionId = (codes as any[])[0].institution_id;

    // 获取机构信息
    const [institutions] = await pool.query(
      'SELECT id, username FROM users WHERE id = ? AND user_type = ?',
      [institutionId, 'institution']
    );

    if ((institutions as any[]).length === 0) {
      return res.json({ valid: false, message: '机构不存在' });
    }

    const institution = (institutions as any[])[0];

    res.json({
      valid: true,
      institution: {
        id: institution.id,
        name: institution.username
      }
    });
  } catch (error) {
    console.error('验证机构码错误:', error);
    res.status(500).json({ valid: false, message: '服务器错误' });
  }
});

export default router;

