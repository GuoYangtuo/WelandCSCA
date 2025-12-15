import express, { Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `question-${uniqueSuffix}${ext}`);
  }
});

// 文件过滤器 - 只允许图片
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // 最多10个文件
  }
});

// 图片上传接口
router.post('/upload-images', authenticate, adminAuth, upload.array('images', 10), async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: '请上传图片文件' });
    }

    // 获取服务器基础URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.SERVER_URL || `${protocol}://${host}`;

    // 返回图片URL列表
    const imageUrls = files.map(file => `${baseUrl}/uploads/${file.filename}`);

    res.json({
      success: true,
      data: {
        urls: imageUrls,
        count: imageUrls.length
      }
    });

  } catch (error: any) {
    console.error('图片上传错误:', error);
    res.status(500).json({ message: error.message || '图片上传失败' });
  }
});

// Dify工作流代理接口 - 调用OCR识别题目
router.post('/parse-questions', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: '请提供图片URL数组' });
    }

    if (imageUrls.length > 10) {
      return res.status(400).json({ message: '最多支持10张图片' });
    }

    const difyApiKey = process.env.DIFY_API_KEY;
    if (!difyApiKey) {
      return res.status(500).json({ message: 'Dify API Key 未配置' });
    }

    // 构建Dify请求体
    const imagesUploaded = imageUrls.map((url: string) => ({
      transfer_method: 'remote_url',
      url: url,
      type: 'image'
    }));

    console.log('调用Dify工作流，图片URLs:', imageUrls);

    const difyResponse = await fetch('https://api.dify.ai/v1/workflows/run', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          imagesUploaded
        },
        response_mode: 'blocking',
        user: `user-${req.userId || 'anonymous'}`
      })
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API 错误:', errorText);
      return res.status(500).json({ message: 'Dify API 调用失败' });
    }

    const difyData: any = await difyResponse.json();

    if (difyData.data?.status !== 'succeeded') {
      console.error('Dify 工作流失败:', difyData);
      return res.status(500).json({ message: 'Dify 工作流执行失败' });
    }

    // 解析输出
    let output = difyData.data?.outputs?.output;
    
    // 如果output是字符串，尝试解析为JSON
    if (typeof output === 'string') {
      try {
        output = JSON.parse(output);
      } catch (e) {
        console.error('解析output字符串失败:', e);
      }
    }
    
    if (!output || !Array.isArray(output)) {
      return res.status(500).json({ message: '解析结果格式错误' });
    }

    // 标准化题目数据格式
    const questions = output.map((item: any) => ({
      question_text: item.question_text || '',
      options: item.options || ['', '', '', ''],
      correct_answer: item.correct_option ?? item.correct_answer ?? 0,
      explanation: item.explanation || '',
      category: item.category || '',
      difficulty: item.difficulty || 'medium'
    }));

    res.json({
      success: true,
      data: {
        questions,
        metadata: {
          workflow_run_id: difyData.workflow_run_id,
          elapsed_time: difyData.data?.elapsed_time,
          total_tokens: difyData.data?.total_tokens
        }
      }
    });

  } catch (error) {
    console.error('解析题目错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 清理上传的图片（可选，用于解析完成后清理）
router.post('/cleanup-images', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { filenames } = req.body;
    
    if (!filenames || !Array.isArray(filenames)) {
      return res.status(400).json({ message: '请提供文件名数组' });
    }

    let deletedCount = 0;
    for (const filename of filenames) {
      const filePath = path.join(uploadDir, path.basename(filename));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    res.json({
      success: true,
      message: `已删除 ${deletedCount} 个文件`
    });
  } catch (error) {
    console.error('清理文件错误:', error);
    res.status(500).json({ message: '清理文件失败' });
  }
});

export default router;
