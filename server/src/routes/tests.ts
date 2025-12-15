import express, { Response } from 'express';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 提交测试结果
router.post('/submit', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { testType, answers, questionIds } = req.body;
    const userId = req.userId!;

    if (!testType || !answers || !questionIds) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    // 获取题目和正确答案
    const placeholders = questionIds.map(() => '?').join(',');
    const [questions] = await cscaPool.query(
      `SELECT id, correct_answer FROM questions WHERE id IN (${placeholders})`,
      questionIds
    );

    const questionMap = new Map(
      (questions as any[]).map(q => [q.id, q.correct_answer])
    );

    // 计算分数
    let score = 0;
    const totalQuestions = questionIds.length;

    questionIds.forEach((qId: number, index: number) => {
      if (questionMap.get(qId) === answers[index]) {
        score++;
      }
    });

    // 保存测试结果
    await cscaPool.query(
      `INSERT INTO test_results (user_id, test_type, score, total_questions, answers) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, testType, score, totalQuestions, JSON.stringify(answers)]
    );

    res.json({
      success: true,
      data: {
        score,
        totalQuestions,
        percentage: Math.round((score / totalQuestions) * 100)
      }
    });
  } catch (error) {
    console.error('提交测试错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取用户的测试历史
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { testType } = req.query;

    let query = 'SELECT * FROM test_results WHERE user_id = ?';
    const params: any[] = [userId];

    if (testType) {
      query += ' AND test_type = ?';
      params.push(testType);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';

    const [results] = await cscaPool.query(query, params);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('获取测试历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;


