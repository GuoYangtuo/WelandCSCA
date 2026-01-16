import express, { Response } from 'express';
import { randomBytes } from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { cscaPool, pool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';

// 配置文档上传存储
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${ext}`);
  }
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB限制
  fileFilter: (req, file, cb) => {
    // 允许的文件类型：PDF、Word、PPT等
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 配置题目图片上传存储
const questionImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/question-images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `question-${uniqueSuffix}${ext}`);
  }
});

const questionImageUpload = multer({
  storage: questionImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
  fileFilter: (req, file, cb) => {
    // 只允许图片类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片格式 (JPEG, PNG, GIF, WebP)'));
    }
  }
});

const router = express.Router();

// ==================== 题目管理 ====================

// 上传题目图片
router.post('/questions/upload-image', authenticate, adminAuth, questionImageUpload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }

    const imageUrl = `/uploads/question-images/${req.file.filename}`;

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        imageUrl
      }
    });
  } catch (error) {
    console.error('上传图片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除题目图片
router.delete('/questions/image/:filename', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/question-images', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error) {
    console.error('删除图片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取所有题目（带分页）
router.get('/questions', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const knowledge_point = req.query.knowledge_point as string;

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

    if (category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(category);
      countParams.push(category);
    }

    if (difficulty) {
      query += ' AND difficulty = ?';
      countQuery += ' AND difficulty = ?';
      params.push(difficulty);
      countParams.push(difficulty);
    }
    
    if (knowledge_point) {
      query += ' AND knowledge_point = ?';
      countQuery += ' AND knowledge_point = ?';
      params.push(knowledge_point);
      countParams.push(knowledge_point);
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
    const { question_text, options, correct_answer, explanation, category, difficulty, knowledge_point, source, image_url } = req.body;

    if (!question_text || !options || correct_answer === undefined) {
      return res.status(400).json({ message: '缺少必要参数' });
    }

    const [result] = await cscaPool.query(
      `INSERT INTO questions (question_text, options, correct_answer, explanation, category, difficulty, knowledge_point, source, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [question_text, JSON.stringify(options), correct_answer, explanation || null, category || null, difficulty || 'medium', knowledge_point || null, source || null, image_url || null]
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
    const { question_text, options, correct_answer, explanation, category, difficulty, knowledge_point, source, image_url } = req.body;

    const [result] = await cscaPool.query(
      `UPDATE questions SET question_text = ?, options = ?, correct_answer = ?, 
       explanation = ?, category = ?, difficulty = ?, knowledge_point = ?, source = ?, image_url = ? WHERE id = ?`,
      [question_text, JSON.stringify(options), correct_answer, explanation, category, difficulty, knowledge_point || null, source || null, image_url || null, id]
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
      q.difficulty || 'medium',
      q.knowledge_point || null,
      q.source || null,
      q.image_url || null
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const flatValues = values.flat();

    await cscaPool.query(
      `INSERT INTO questions (question_text, options, correct_answer, explanation, category, difficulty, knowledge_point, source, image_url) 
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

// 上传课时文档
router.post('/lessons/upload-document', authenticate, adminAuth, documentUpload.single('document'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的文件' });
    }

    const documentUrl = `/uploads/documents/${req.file.filename}`;
    // 修复中文文件名乱码问题：multer 的 originalname 使用 Latin1 编码，需转换为 UTF-8
    const documentName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

    res.json({
      success: true,
      message: '文档上传成功',
      data: {
        documentUrl,
        documentName
      }
    });
  } catch (error) {
    console.error('上传文档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除课时文档
router.delete('/lessons/document/:filename', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/documents', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: '文档删除成功'
    });
  } catch (error) {
    console.error('删除文档错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 添加课时
router.post('/lessons', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { chapter_id, title, content, order_index, document_url, document_name } = req.body;

    if (!chapter_id || !title || !content) {
      return res.status(400).json({ message: '请提供完整的课时信息' });
    }

    const [result] = await cscaPool.query(
      'INSERT INTO lessons (chapter_id, title, content, document_url, document_name, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [chapter_id, title, content, document_url || null, document_name || null, order_index || 0]
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
    const { chapter_id, title, content, order_index, document_url, document_name } = req.body;

    const [result] = await cscaPool.query(
      'UPDATE lessons SET chapter_id = ?, title = ?, content = ?, document_url = ?, document_name = ?, order_index = ? WHERE id = ?',
      [chapter_id, title, content, document_url || null, document_name || null, order_index, id]
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

// ==================== 邀请码管理 ====================

// 生成邀请码
router.post('/invitation-codes', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { description } = req.body;
    
    // 生成8位随机邀请码（大写字母+数字）
    const code = randomBytes(4).toString('hex').toUpperCase();
    
    await cscaPool.query(
      'INSERT INTO invitation_codes (code, description) VALUES (?, ?)',
      [code, description || null]
    );

    res.json({
      success: true,
      message: '邀请码生成成功',
      data: { code }
    });
  } catch (error) {
    console.error('生成邀请码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 获取邀请码列表
router.get('/invitation-codes', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const showUsed = req.query.showUsed === 'true';
    
    let query = `
      SELECT ic.*, u.username as used_by_username 
      FROM invitation_codes ic 
      LEFT JOIN weland.users u ON ic.used_by = u.id 
    `;
    
    if (!showUsed) {
      query += ' WHERE ic.is_used = FALSE';
    }
    
    query += ' ORDER BY ic.created_at DESC';
    
    const [codes] = await cscaPool.query(query);

    res.json({
      success: true,
      data: codes
    });
  } catch (error) {
    console.error('获取邀请码列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除邀请码（只能删除未使用的）
router.delete('/invitation-codes/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 检查邀请码是否已使用
    const [existing] = await cscaPool.query(
      'SELECT is_used FROM invitation_codes WHERE id = ?',
      [id]
    );

    if ((existing as any[]).length === 0) {
      return res.status(404).json({ message: '邀请码不存在' });
    }

    if ((existing as any[])[0].is_used) {
      return res.status(400).json({ message: '已使用的邀请码不能删除' });
    }

    await cscaPool.query('DELETE FROM invitation_codes WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '邀请码删除成功'
    });
  } catch (error) {
    console.error('删除邀请码错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 卡包/卡片管理 ====================
// 获取所有卡片类型
router.get('/card-types', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
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

// 获取某用户的卡片列表
router.get('/users/:userId/cards', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const [cards] = await cscaPool.query(
      `SELECT uc.*, ct.code as card_code, ct.name as card_name 
       FROM user_cards uc 
       LEFT JOIN card_types ct ON uc.card_type_id = ct.id
       WHERE uc.user_id = ? ORDER BY uc.created_at DESC`,
      [userId]
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

// 管理员为用户添加卡片（若已有则合并数量）
router.post('/users/:userId/cards', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { card_code, card_type_id, quantity, expires_at } = req.body;

    if (!card_code && !card_type_id) {
      return res.status(400).json({ message: '请提供 card_code 或 card_type_id' });
    }

    // 解析卡类型 ID
    let resolvedCardTypeId = card_type_id;
    if (!resolvedCardTypeId) {
      const [rows] = await cscaPool.query('SELECT id FROM card_types WHERE code = ? LIMIT 1', [card_code]);
      if ((rows as any[]).length === 0) {
        return res.status(400).json({ message: '卡片类型不存在' });
      }
      resolvedCardTypeId = (rows as any[])[0].id;
    }

    const qty = parseInt(quantity) || 1;

    // 检查用户是否已有该卡片
    const [existing] = await cscaPool.query('SELECT * FROM user_cards WHERE user_id = ? AND card_type_id = ? LIMIT 1', [userId, resolvedCardTypeId]);
    if ((existing as any[]).length > 0) {
      const existingRow = (existing as any[])[0];
      const newQty = (existingRow.quantity || 0) + qty;
      await cscaPool.query('UPDATE user_cards SET quantity = ?, expires_at = ? WHERE id = ?', [newQty, expires_at || existingRow.expires_at, existingRow.id]);
      return res.json({ success: true, message: '用户卡片数量已更新' });
    }

    const [result] = await cscaPool.query(
      'INSERT INTO user_cards (user_id, card_type_id, quantity, expires_at) VALUES (?, ?, ?, ?)',
      [userId, resolvedCardTypeId, qty, expires_at || null]
    );

    res.json({
      success: true,
      message: '卡片已添加到用户',
      data: { id: (result as any).insertId }
    });
  } catch (error) {
    console.error('为用户添加卡片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 更新用户卡片（数量或过期时间）
router.put('/users/:userId/cards/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, expires_at } = req.body;

    const [result] = await cscaPool.query('UPDATE user_cards SET quantity = ?, expires_at = ? WHERE id = ?', [quantity, expires_at || null, id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '用户卡片不存在' });
    }

    res.json({ success: true, message: '用户卡片更新成功' });
  } catch (error) {
    console.error('更新用户卡片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 删除用户卡片
router.delete('/users/:userId/cards/:id', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [result] = await cscaPool.query('DELETE FROM user_cards WHERE id = ?', [id]);

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '用户卡片不存在' });
    }

    res.json({ success: true, message: '用户卡片已删除' });
  } catch (error) {
    console.error('删除用户卡片错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// ==================== 订单管理 ====================

// 获取所有订单（管理员）
router.get('/orders', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    
    let query = `
      SELECT o.*, u.username, u.email
      FROM card_orders o
      LEFT JOIN weland.users u ON o.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.created_at DESC';
    
    const [orders] = await cscaPool.query(query, params);
    
    // 解析 order_items JSON
    const parsedOrders = (orders as any[]).map(order => ({
      ...order,
      order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items
    }));
    
    res.json({
      success: true,
      data: parsedOrders
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 审核订单（通过）
router.post('/orders/:id/approve', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  const connection = await cscaPool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // 获取订单信息
    const [orders] = await connection.query(
      'SELECT * FROM card_orders WHERE id = ? AND status = ? FOR UPDATE',
      [id, 'pending']
    );
    
    if ((orders as any[]).length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '订单不存在或已处理' });
    }
    
    const order = (orders as any[])[0];
    const orderItems = typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items;
    
    // 为用户添加卡片
    for (const item of orderItems) {
      // 检查用户是否已有该类型卡片
      const [existing] = await connection.query(
        'SELECT * FROM user_cards WHERE user_id = ? AND card_type_id = ? LIMIT 1',
        [order.user_id, item.card_type_id]
      );
      
      if ((existing as any[]).length > 0) {
        // 已有卡片，增加数量
        const existingCard = (existing as any[])[0];
        await connection.query(
          'UPDATE user_cards SET quantity = quantity + ? WHERE id = ?',
          [item.quantity, existingCard.id]
        );
      } else {
        // 新增卡片记录
        await connection.query(
          'INSERT INTO user_cards (user_id, card_type_id, quantity) VALUES (?, ?, ?)',
          [order.user_id, item.card_type_id, item.quantity]
        );
      }
    }
    
    // 更新订单状态
    await connection.query(
      'UPDATE card_orders SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?',
      ['approved', req.userId, id]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      message: '订单审核通过，卡片已发放'
    });
  } catch (error) {
    await connection.rollback();
    console.error('审核订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  } finally {
    connection.release();
  }
});

// 拒绝订单
router.post('/orders/:id/reject', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const [result] = await cscaPool.query(
      'UPDATE card_orders SET status = ?, reject_reason = ?, approved_by = ?, approved_at = NOW() WHERE id = ? AND status = ?',
      ['rejected', reason || '管理员拒绝', req.userId, id, 'pending']
    );
    
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: '订单不存在或已处理' });
    }
    
    res.json({
      success: true,
      message: '订单已拒绝'
    });
  } catch (error) {
    console.error('拒绝订单错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;

