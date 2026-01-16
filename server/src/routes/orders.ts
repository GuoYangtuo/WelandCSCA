import express, { Response } from 'express';
import { randomBytes } from 'crypto';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 生成6位订单码
function generateOrderCode(): string {
  // 生成6位大写字母+数字的订单码
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字符
  let code = '';
  const randomBuffer = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[randomBuffer[i] % chars.length];
  }
  return code;
}

// 获取所有卡片类型（用于购买页面）
router.get('/card-types', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [types] = await cscaPool.query('SELECT * FROM card_types ORDER BY id');
    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('获取卡片类型错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户的卡片
router.get('/my-cards', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [cards] = await cscaPool.query(
      `SELECT uc.*, ct.code as card_code, ct.name as card_name 
       FROM user_cards uc 
       LEFT JOIN card_types ct ON uc.card_type_id = ct.id
       WHERE uc.user_id = ? ORDER BY uc.created_at DESC`,
      [req.userId]
    );
    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('获取用户卡片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 创建订单（用户确认付款后才调用此接口入库）
router.post('/create', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { items, total_price, order_code: clientOrderCode } = req.body;
    // items: [{ card_type_id, quantity, price, card_name }]
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: '请选择要购买的卡片' });
    }
    
    // 计算四科组合折扣（数学+物理+化学+中文）
    const mathQty = items.find((i: any) => i.card_name?.includes('数学'))?.quantity || 0;
    const physicsQty = items.find((i: any) => i.card_name?.includes('物理'))?.quantity || 0;
    const chemistryQty = items.find((i: any) => i.card_name?.includes('化学'))?.quantity || 0;
    const chineseQty = items.filter((i: any) => i.card_name?.includes('中文'))
                           .reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
    const comboCount = Math.min(mathQty, physicsQty, chemistryQty, chineseQty);
    
    // 计算预期的折扣价格
    const originalTotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const comboDiscount = comboCount > 0 ? (39.9 * 4 - 129.9) * comboCount : 0;
    const expectedTotal = originalTotal - comboDiscount;
    
    // 验证总价（允许一定误差）
    if (Math.abs(expectedTotal - total_price) > 0.1) {
      //return res.status(400).json({ message: '订单价格校验失败' });
    }
    
    // 如果前端传了订单码，先检查是否已存在（防止重复提交）
    let orderCode = clientOrderCode || '';
    if (orderCode) {
      const [existing] = await cscaPool.query(
        'SELECT id FROM card_orders WHERE order_code = ?',
        [orderCode]
      );
      if ((existing as any[]).length > 0) {
        // 订单码已存在，返回成功（幂等处理）
        return res.json({
          success: true,
          message: '订单已存在',
          data: {
            id: (existing as any[])[0].id,
            order_code: orderCode,
            total_price
          }
        });
      }
    } else {
      // 如果没有传订单码，则生成新的（兼容旧逻辑）
      let attempts = 0;
      while (attempts < 5) {
        orderCode = generateOrderCode();
        const [existing] = await cscaPool.query(
          'SELECT id FROM card_orders WHERE order_code = ?',
          [orderCode]
        );
        if ((existing as any[]).length === 0) {
          break;
        }
        attempts++;
      }
      
      if (attempts >= 5) {
        return res.status(500).json({ message: '订单码生成失败，请重试' });
      }
    }
    
    // 创建订单（用户点击"我已完成付款"后才会调用到这里）
    const [result] = await cscaPool.query(
      'INSERT INTO card_orders (order_code, user_id, order_items, total_price) VALUES (?, ?, ?, ?)',
      [orderCode, req.userId, JSON.stringify(items), total_price]
    );
    
    res.json({
      success: true,
      message: '订单已提交，等待核验',
      data: {
        id: (result as any).insertId,
        order_code: orderCode,
        total_price
      }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取当前用户的订单列表
router.get('/my-orders', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [orders] = await cscaPool.query(
      `SELECT * FROM card_orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId]
    );
    
    const parsedOrders = (orders as any[]).map(order => ({
      ...order,
      order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items
    }));
    
    res.json({
      success: true,
      data: parsedOrders
    });
  } catch (error) {
    console.error('获取用户订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 取消订单（仅限待处理状态）
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const [result] = await cscaPool.query(
      'UPDATE card_orders SET status = ? WHERE id = ? AND user_id = ? AND status = ?',
      ['cancelled', id, req.userId, 'pending']
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '订单不存在或无法取消' });
    }
    
    res.json({
      success: true,
      message: '订单已取消'
    });
  } catch (error) {
    console.error('取消订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;

