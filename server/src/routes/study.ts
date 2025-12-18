import express, { Response } from 'express';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 获取所有章节列表（包含课时）
router.get('/chapters', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // 获取所有章节
    const [chapters] = await cscaPool.query(
      'SELECT id, title, description, order_index FROM chapters ORDER BY order_index'
    );

    // 获取所有课时
    const [lessons] = await cscaPool.query(
      'SELECT id, chapter_id, title, order_index FROM lessons ORDER BY chapter_id, order_index'
    );

    // 将课时按章节分组
    const lessonsByChapter = new Map<number, any[]>();
    (lessons as any[]).forEach((lesson: any) => {
      if (!lessonsByChapter.has(lesson.chapter_id)) {
        lessonsByChapter.set(lesson.chapter_id, []);
      }
      lessonsByChapter.get(lesson.chapter_id)!.push({
        id: lesson.id,
        title: lesson.title,
        orderIndex: lesson.order_index
      });
    });

    // 组合章节和课时数据
    const result = (chapters as any[]).map((chapter: any) => ({
      id: chapter.id,
      title: chapter.title,
      description: chapter.description,
      orderIndex: chapter.order_index,
      lessons: lessonsByChapter.get(chapter.id) || []
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取章节列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取课时详情
router.get('/lessons/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const lessonId = parseInt(req.params.id);
    const userId = req.userId!;

    // 检查用户是否完成基础测试
    const [testResults] = await cscaPool.query(
      'SELECT * FROM test_results WHERE user_id = ? AND test_type = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'basic']
    );

    if ((testResults as any[]).length === 0) {
      return res.status(403).json({
        success: false,
        message: '请先完成基础测试才能查看课时内容',
        requiresBasicTest: true
      });
    }

    // 获取课时详情
    const [lessons] = await cscaPool.query(
      'SELECT id, chapter_id, title, content, document_url, document_name, order_index FROM lessons WHERE id = ?',
      [lessonId]
    );

    if ((lessons as any[]).length === 0) {
      return res.status(404).json({ message: '课时不存在' });
    }

    const lesson = (lessons as any[])[0];

    res.json({
      success: true,
      data: {
        id: lesson.id,
        chapterId: lesson.chapter_id,
        title: lesson.title,
        content: lesson.content,
        documentUrl: lesson.document_url,
        documentName: lesson.document_name,
        orderIndex: lesson.order_index
      }
    });
  } catch (error) {
    console.error('获取课时详情错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 检查用户是否完成基础测试
router.get('/basic-test-status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const [testResults] = await cscaPool.query(
      'SELECT id, score, total_questions, created_at FROM test_results WHERE user_id = ? AND test_type = ? ORDER BY created_at DESC LIMIT 1',
      [userId, 'basic']
    );

    if ((testResults as any[]).length === 0) {
      return res.json({
        success: true,
        data: {
          completed: false
        }
      });
    }

    const result = (testResults as any[])[0];
    const percentage = Math.round((result.score / result.total_questions) * 100);

    res.json({
      success: true,
      data: {
        completed: true,
        score: result.score,
        totalQuestions: result.total_questions,
        percentage: percentage,
        createdAt: result.created_at
      }
    });
  } catch (error) {
    console.error('检查基础测试状态错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;

