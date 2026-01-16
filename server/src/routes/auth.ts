import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { pool, cscaPool } from '../config/database';

const router = express.Router();

/**
 * 获取当前周编号（与 institution.ts 保持一致）
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return now.getFullYear() * 100 + weekNum;
}

/**
 * 检查邀请码是否为有效的机构码
 * 返回机构ID（如果有效），否则返回 null
 */
async function checkInstitutionCode(code: string): Promise<string | null> {
  if (!code || code.length !== 6) return null;
  
  const currentWeek = getCurrentWeekNumber();
  const [codes] = await cscaPool.query(
    'SELECT institution_id FROM institution_codes WHERE code = ? AND week_number = ?',
    [code.toUpperCase(), currentWeek]
  );
  
  if ((codes as any[]).length === 0) return null;
  
  const institutionId = (codes as any[])[0].institution_id;
  
  // 验证机构用户是否存在
  const [institutions] = await pool.query(
    'SELECT id FROM users WHERE id = ? AND user_type = ?',
    [institutionId, 'institution']
  );
  
  if ((institutions as any[]).length === 0) return null;
  
  return institutionId;
}

// 验证邀请码（机构注册前调用）
router.post('/verify-invite-code', async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ valid: false, message: '请提供邀请码' });
    }

    // 检查邀请码是否存在且未使用
    const [codes] = await cscaPool.query(
      'SELECT * FROM invitation_codes WHERE code = ? AND is_used = FALSE',
      [inviteCode]
    );

    if ((codes as any[]).length === 0) {
      return res.status(400).json({ valid: false, message: '邀请码无效或已被使用' });
    }

    res.json({ valid: true, message: '邀请码有效' });
  } catch (error) {
    console.error('验证邀请码错误:', error);
    res.status(500).json({ valid: false, message: '服务器错误' });
  }
});

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, nationality, source, inviteCode, userType } = req.body;

    // 根据用户类型进行不同的验证
    const isInstitution = userType === 'institution';
    
    if (isInstitution) {
      // 机构注册：必须有用户名、邮箱、密码、邀请码
      if (!username || !email || !password || !inviteCode) {
        return res.status(400).json({ message: '机构注册需要填写用户名、邮箱、密码和邀请码' });
      }

      // 验证邀请码是否有效
      const [codes] = await cscaPool.query(
        'SELECT * FROM invitation_codes WHERE code = ? AND is_used = FALSE',
        [inviteCode]
      );

      if ((codes as any[]).length === 0) {
        return res.status(400).json({ message: '邀请码无效或已被使用' });
      }
    } else {
      // 学生注册：必须有用户名、邮箱、密码、国籍、来源
      if (!username || !email || !password || !nationality || !source) {
        return res.status(400).json({ message: '请填写所有必填字段' });
      }
    }

    // 检查用户是否已存在
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if ((existingUsers as any[]).length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 生成 UUID 作为用户 ID
    const userId = randomUUID();

    // 确定用户类型：机构为 'institution'，默认为 'student'
    const finalUserType = isInstitution ? 'institution' : 'student';

    // 插入新用户（包含新字段和用户类型）
    const [result] = await pool.query(
      'INSERT INTO users (id, username, email, password, nationality, source, invite_code, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, username, email, hashedPassword, nationality || '', source || '', inviteCode || '', finalUserType]
    );

    // 如果是机构注册，标记邀请码为已使用
    if (isInstitution && inviteCode) {
      await cscaPool.query(
        'UPDATE invitation_codes SET is_used = TRUE, used_by = ?, used_at = NOW() WHERE code = ?',
        [userId, inviteCode]
      );
    }

    // 如果是学生注册且提供了邀请码，检查是否为机构码
    if (!isInstitution && inviteCode) {
      const institutionId = await checkInstitutionCode(inviteCode);
      if (institutionId) {
        // 绑定学生到机构
        await cscaPool.query(
          'INSERT INTO student_institution_bindings (student_id, institution_id) VALUES (?, ?)',
          [userId, institutionId]
        );
      }
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId, username, email, userType: finalUserType },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: { id: userId, username, email, userType: finalUserType }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  console.log('login', req.body);
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: '请提供用户名和密码' });
    }

    // 查找用户
    const [users] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if ((users as any[]).length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = (users as any[])[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 检查学生是否绑定了机构
    let institutionId: string | null = null;
    if (user.user_type === 'student') {
      const [bindings] = await cscaPool.query(
        'SELECT institution_id FROM student_institution_bindings WHERE student_id = ?',
        [user.id]
      );
      if ((bindings as any[]).length > 0) {
        institutionId = (bindings as any[])[0].institution_id;
      }
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.user_type,
        institutionId: institutionId
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
