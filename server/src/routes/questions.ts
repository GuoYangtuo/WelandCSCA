import express, { Response } from 'express';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取所有题目（基础测试用）
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { category, difficulty, limit } = req.query;
    
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }

    query += ' ORDER BY RAND()';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit as string));
    } else {
      query += ' LIMIT 10';
    }

    const [questions] = await cscaPool.query(query, params);
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('获取题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取单个题目
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [questions] = await cscaPool.query(
      'SELECT * FROM questions WHERE id = ?',
      [id]
    );

    if ((questions as any[]).length === 0) {
      return res.status(404).json({ message: '题目不存在' });
    }

    res.json({
      success: true,
      data: (questions as any[])[0]
    });
  } catch (error) {
    console.error('获取题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;


