import express, { Response } from 'express';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取模拟测试配置
router.get('/config', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [configs] = await cscaPool.query(
      'SELECT * FROM mock_test_configs WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1'
    );

    if ((configs as any[]).length === 0) {
      return res.status(404).json({ message: '未找到可用的模拟测试配置' });
    }

    const config = (configs as any[])[0];
    // MySQL JSON 字段可能已经解析为对象，也可能还是字符串
    const questionIds = typeof config.question_ids === 'string' 
      ? JSON.parse(config.question_ids) 
      : config.question_ids;

    // 获取题目详情
    const placeholders = questionIds.map(() => '?').join(',');
    const [questions] = await cscaPool.query(
      `SELECT id, question_text, options, category, difficulty FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );

    res.json({
      success: true,
      data: {
        id: config.id,
        name: config.name,
        durationMinutes: config.duration_minutes,
        totalQuestions: config.total_questions,
        questions: questions
      }
    });
  } catch (error) {
    console.error('获取模拟测试配置错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;


