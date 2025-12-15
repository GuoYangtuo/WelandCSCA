import express, { Response } from 'express';
import { cscaPool, pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

const router = express.Router();

// ==================== 题目管理 ====================

// 获取所有题目（带分页）
router.get('/questions', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let query = 'SELECT * FROM questions WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM questions WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      query += ' AND question_text LIKE ?';
      countQuery += ' AND question_text LIKE ?';
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [questions] = await cscaPool.query(query, params);
    const [countResult] = await cscaPool.query(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取题目列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加新题目
router.post('/questions', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { question_text, options, correct_answer, explanation, category, difficulty } = req.body;

    if (!question_text || !options || correct_answer === undefined) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    const [result] = await cscaPool.query(
      `INSERT INTO questions (question_text, options, correct_answer, explanation, category, difficulty) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [question_text, JSON.stringify(options), correct_answer, explanation || null, category || null, difficulty || 'medium']
    );

    res.json({
      success: true,
      message: '题目添加成功',
      data: { id: (result as any).insertId }
    });
  } catch (error) {
    console.error('添加题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新题目
router.put('/questions/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { question_text, options, correct_answer, explanation, category, difficulty } = req.body;

    const [result] = await cscaPool.query(
      `UPDATE questions SET question_text = ?, options = ?, correct_answer = ?, 
       explanation = ?, category = ?, difficulty = ? WHERE id = ?`,
      [question_text, JSON.stringify(options), correct_answer, explanation, category, difficulty, id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '题目不存在' });
    }

    res.json({
      success: true,
      message: '题目更新成功'
    });
  } catch (error) {
    console.error('更新题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除题目
router.delete('/questions/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await cscaPool.query('DELETE FROM questions WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '题目不存在' });
    }

    res.json({
      success: true,
      message: '题目删除成功'
    });
  } catch (error) {
    console.error('删除题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 批量添加题目
router.post('/questions/batch', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: '请提供题目数组' });
    }

    const values = questions.map(q => [
      q.question_text,
      JSON.stringify(q.options),
      q.correct_answer,
      q.explanation || null,
      q.category || null,
      q.difficulty || 'medium'
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await cscaPool.query(
      `INSERT INTO questions (question_text, options, correct_answer, explanation, category, difficulty) 
       VALUES ${placeholders}`,
      flatValues
    );

    res.json({
      success: true,
      message: `成功添加 ${questions.length} 道题目`
    });
  } catch (error) {
    console.error('批量添加题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 考试记录管理 ====================

// 获取所有考试记录（带分页）
router.get('/test-results', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const testType = req.query.testType as string;
    const userId = req.query.userId as string;

    let query = `
      SELECT tr.*, u.username, u.email 
      FROM test_results tr 
      LEFT JOIN weland.users u ON tr.user_id = u.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM test_results WHERE 1=1';
    const params: any[] = [];
    const countParams: any[] = [];

    if (testType) {
      query += ' AND tr.test_type = ?';
      countQuery += ' AND test_type = ?';
      params.push(testType);
      countParams.push(testType);
    }

    if (userId) {
      query += ' AND tr.user_id = ?';
      countQuery += ' AND user_id = ?';
      params.push(userId);
      countParams.push(userId);
    }

    query += ' ORDER BY tr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [results] = await cscaPool.query(query, params);
    const [countResult] = await cscaPool.query(countQuery, countParams);
    const total = (countResult as any[])[0].total;

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取考试记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除考试记录
router.delete('/test-results/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await cscaPool.query('DELETE FROM test_results WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '考试记录不存在' });
    }

    res.json({
      success: true,
      message: '考试记录删除成功'
    });
  } catch (error) {
    console.error('删除考试记录错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 章节管理 ====================

// 获取所有章节
router.get('/chapters', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [chapters] = await cscaPool.query(
      'SELECT * FROM chapters ORDER BY order_index'
    );

    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    console.error('获取章节列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加章节
router.post('/chapters', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, order_index } = req.body;

    if (!title) {
      return res.status(400).json({ message: '请提供章节标题' });
    }

    const [result] = await cscaPool.query(
      'INSERT INTO chapters (title, description, order_index) VALUES (?, ?, ?)',
      [title, description || null, order_index || 0]
    );

    res.json({
      success: true,
      message: '章节添加成功',
      data: { id: (result as any).insertId }
    });
  } catch (error) {
    console.error('添加章节错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新章节
router.put('/chapters/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, order_index } = req.body;

    const [result] = await cscaPool.query(
      'UPDATE chapters SET title = ?, description = ?, order_index = ? WHERE id = ?',
      [title, description, order_index, id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '章节不存在' });
    }

    res.json({
      success: true,
      message: '章节更新成功'
    });
  } catch (error) {
    console.error('更新章节错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除章节
router.delete('/chapters/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await cscaPool.query('DELETE FROM chapters WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '章节不存在' });
    }

    res.json({
      success: true,
      message: '章节删除成功'
    });
  } catch (error) {
    console.error('删除章节错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 课时管理 ====================

// 获取所有课时
router.get('/lessons', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const chapterId = req.query.chapterId as string;

    let query = `
      SELECT l.*, c.title as chapter_title 
      FROM lessons l 
      LEFT JOIN chapters c ON l.chapter_id = c.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (chapterId) {
      query += ' AND l.chapter_id = ?';
      params.push(chapterId);
    }

    query += ' ORDER BY l.chapter_id, l.order_index';

    const [lessons] = await cscaPool.query(query, params);

    res.json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('获取课时列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加课时
router.post('/lessons', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { chapter_id, title, content, order_index } = req.body;

    if (!chapter_id || !title || !content) {
      return res.status(400).json({ message: '请提供完整的课时信息' });
    }

    const [result] = await cscaPool.query(
      'INSERT INTO lessons (chapter_id, title, content, order_index) VALUES (?, ?, ?, ?)',
      [chapter_id, title, content, order_index || 0]
    );

    res.json({
      success: true,
      message: '课时添加成功',
      data: { id: (result as any).insertId }
    });
  } catch (error) {
    console.error('添加课时错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新课时
router.put('/lessons/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { chapter_id, title, content, order_index } = req.body;

    const [result] = await cscaPool.query(
      'UPDATE lessons SET chapter_id = ?, title = ?, content = ?, order_index = ? WHERE id = ?',
      [chapter_id, title, content, order_index, id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '课时不存在' });
    }

    res.json({
      success: true,
      message: '课时更新成功'
    });
  } catch (error) {
    console.error('更新课时错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除课时
router.delete('/lessons/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const [result] = await cscaPool.query('DELETE FROM lessons WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '课时不存在' });
    }

    res.json({
      success: true,
      message: '课时删除成功'
    });
  } catch (error) {
    console.error('删除课时错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 用户列表 ====================

// 获取所有用户（用于筛选）
router.get('/users', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, created_at FROM users ORDER BY created_at DESC'
    );

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 检查当前用户是否为管理员
router.get('/check', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    isAdmin: true
  });
});

export default router;

