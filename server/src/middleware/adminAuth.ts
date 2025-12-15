import { Response, NextFunction } from 'express';
import { pool } from '../config/database';
import { AuthRequest } from './auth';

// 管理员认证中间件 - 仅允许用户名为admin的用户访问
export const adminAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: '未认证' });
    }

    // 查询用户信息
    const [users] = await pool.query(
      'SELECT username FROM users WHERE id = ?',
      [userId]
    );

    if ((users as any[]).length === 0) {
      return res.status(401).json({ message: '用户不存在' });
    }

    const user = (users as any[])[0];

    // 检查是否为admin用户
    if (user.username !== 'admin') {
      return res.status(403).json({ message: '无权限访问，仅管理员可用' });
    }

    next();
  } catch (error) {
    console.error('管理员认证错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

