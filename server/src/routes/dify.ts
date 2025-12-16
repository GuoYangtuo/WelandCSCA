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

// 调用阿里云 Dashscope API 解析图片中的题目
async function callDashscopeApi(imageUrls: string[], apiKey: string): Promise<any> {
  // 构建消息内容：多张图片 + 提示词
  const content: any[] = imageUrls.map(url => ({
    type: 'image_url',
    image_url: { url }
  }));
  
  content.push({
    type: 'text',
    text: `你是一名数据结构化专家，根据用户输入的图片内容，提取其中的题目为结构化的json格式数据，如有需要，使用$...$包裹latex公式。

请严格按照以下JSON格式输出：
{
  "questions": [
    {
      "question_text": "题目文本",
      "options": ["选项A", "选项B", "选项C", "选项D"]
    }
  ]
}

注意：
1. 只提取题目内容和选项，不需要判断正确答案
2. 如果图片中有多道题目，请全部提取
3. 只输出JSON，不要有其他文字
4. 如有公式请使用LaTeX格式，用$...$包裹`
  });

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen-vl-plus',
      messages: [
        {
          role: 'user',
          content
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dashscope API 错误: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// 从API响应中提取并解析JSON
function extractJsonFromResponse(responseData: any): any {
  const content = responseData?.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('API 响应中没有内容');
  }

  // 尝试从内容中提取JSON
  let jsonStr = content;
  
  // 如果内容包含 ```json 代码块，提取其中的JSON
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // 尝试查找 { 开始的JSON
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = content.slice(jsonStart, jsonEnd + 1);
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`JSON 解析失败: ${e}. 原始内容: ${content}`);
  }
}

// 带重试机制的API调用
async function callDashscopeWithRetry(
  imageUrls: string[], 
  apiKey: string, 
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<{ questions: any[], metadata: any }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`调用 Dashscope API，第 ${attempt} 次尝试，图片URLs:`, imageUrls);
      
      const responseData = await callDashscopeApi(["http://csca.weland.group/uploads/question-1765848116684-136096574.jpg"], apiKey);
      const parsedResult = extractJsonFromResponse(responseData);
      
      // 验证结果格式
      if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
        throw new Error('返回结果缺少 questions 数组');
      }

      return {
        questions: parsedResult.questions,
        metadata: {
          model: responseData.model,
          usage: responseData.usage,
          attempt
        }
      };
    } catch (error: any) {
      lastError = error;
      console.error(`第 ${attempt} 次尝试失败:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`等待 ${retryDelay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // 指数退避
      }
    }
  }

  throw lastError || new Error('所有重试均失败');
}

// 阿里云 Dashscope API 接口 - 调用OCR识别题目
router.post('/parse-questions', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { imageUrls } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: '请提供图片URL数组' });
    }

    if (imageUrls.length > 10) {
      return res.status(400).json({ message: '最多支持10张图片' });
    }

    const dashscopeApiKey = process.env.DASHSCOPE_API_KEY;
    if (!dashscopeApiKey) {
      return res.status(500).json({ message: 'Dashscope API Key 未配置，请在环境变量中设置 DASHSCOPE_API_KEY' });
    }

    // 调用带重试机制的API
    const result = await callDashscopeWithRetry(imageUrls, dashscopeApiKey, 3, 1000);

    // 标准化题目数据格式（只返回题目和选项，不包含答案）
    const questions = result.questions.map((item: any) => ({
      question_text: item.question_text || '',
      options: item.options || ['', '', '', '']
    }));

    res.json({
      success: true,
      data: {
        questions,
        metadata: result.metadata
      }
    });

  } catch (error: any) {
    console.error('解析题目错误:', error);
    res.status(500).json({ 
      message: error.message || '服务器错误',
      details: '题目解析失败，请检查图片是否清晰或稍后重试'
    });
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

// 调用 DeepSeek API 解析单个题目的详细信息
async function callDeepSeekApi(question: { question_text: string; options: string[] }, apiKey: string): Promise<any> {
  const prompt = `你是一位专业的考试题目解析专家。请分析以下选择题，并给出详细解析。

题目：${question.question_text}

选项：
A. ${question.options[0]}
B. ${question.options[1]}
C. ${question.options[2]}
D. ${question.options[3]}

请严格按照以下JSON格式返回结果（如有需要，使用$...$包裹LaTeX公式）：
{
  "correct_answer": 0,
  "explanation": "详细的解题过程和解析说明",
  "knowledge_points": ["知识点1", "知识点2"],
  "difficulty": "easy"
}

注意：
1. correct_answer 是正确答案的索引（0=A, 1=B, 2=C, 3=D）
2. explanation 请给出详细的解题思路和推导过程，支持LaTeX公式
3. knowledge_points 是这道题考察的知识点列表
4. difficulty 只能是 "easy"、"medium" 或 "hard" 之一
5. 只输出JSON，不要有其他文字
6. 题目只涉及中学简单知识，只输出一种简单解法或解释，禁止提到高等数学或大学知识
7. 尽可能言简意赅，不要长篇大论或反复怀疑验算`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API 错误: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// 从DeepSeek响应中提取JSON
function extractJsonFromDeepSeekResponse(responseData: any): any {
  const content = responseData?.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('DeepSeek API 响应中没有内容');
  }

  let jsonStr = content;
  
  // 如果内容包含 ```json 代码块，提取其中的JSON
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  } else {
    // 尝试查找 { 开始的JSON
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = content.slice(jsonStart, jsonEnd + 1);
    }
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`JSON 解析失败: ${e}. 原始内容: ${content}`);
  }
}

// DeepSeek API接口 - 解析单个题目的详细信息
router.post('/analyze-question', authenticate, adminAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || !question.question_text || !question.options) {
      return res.status(400).json({ message: '请提供完整的题目信息（question_text和options）' });
    }

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return res.status(500).json({ message: 'DeepSeek API Key 未配置，请在环境变量中设置 DEEPSEEK_API_KEY' });
    }

    // 调用DeepSeek API
    let lastError: Error | null = null;
    const maxRetries = 3;
    let retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`调用 DeepSeek API 解析题目，第 ${attempt} 次尝试`);
        
        const responseData = await callDeepSeekApi(question, deepseekApiKey);
        const parsedResult = extractJsonFromDeepSeekResponse(responseData);
        
        // 验证并标准化结果
        const result = {
          correct_answer: parsedResult.correct_answer ?? 0,
          explanation: parsedResult.explanation || '暂无解析',
          knowledge_points: Array.isArray(parsedResult.knowledge_points) ? parsedResult.knowledge_points : [],
          difficulty: ['easy', 'medium', 'hard'].includes(parsedResult.difficulty) ? parsedResult.difficulty : 'medium'
        };

        return res.json({
          success: true,
          data: result
        });
      } catch (error: any) {
        lastError = error;
        console.error(`第 ${attempt} 次尝试失败:`, error.message);
        
        if (attempt < maxRetries) {
          console.log(`等待 ${retryDelay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2;
        }
      }
    }

    throw lastError || new Error('所有重试均失败');

  } catch (error: any) {
    console.error('DeepSeek解析题目错误:', error);
    res.status(500).json({ 
      message: error.message || '服务器错误',
      details: '题目解析失败，请稍后重试'
    });
  }
});

export default router;
