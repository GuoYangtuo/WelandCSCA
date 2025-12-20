import express, { Response, Request } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// 知识点配置：按科目分组，key为简称（存入数据库）
interface KnowledgePointConfig {
  key: string;      // 简称，存入数据库
  label: string;    // 详细描述
}

const KNOWLEDGE_POINTS: Record<string, KnowledgePointConfig[]> = {
  '数学': [
    { key: '集合', label: '集合（集合的定义、运算及表示方法）' },
    { key: '不等式', label: '不等式（不等式的基本性质与解法，一元二次不等式、分式不等式等）' },
    { key: '函数', label: '函数（函数的概念与性质，定义域、值域、单调性、奇偶性等）' },
    { key: '基本初等函数', label: '基本初等函数（幂函数、指数函数、对数函数、三角函数）' },
    { key: '数列', label: '数列（等差数列、等比数列的通项公式及求和）' },
    { key: '导数与微积分初步', label: '导数与微积分初步（导数的定义、几何意义及简单应用）' },
    { key: '平面解析几何', label: '平面解析几何（直线、圆、椭圆、双曲线、抛物线的方程与性质）' },
    { key: '向量与复数', label: '向量与复数（向量的运算、复数的四则运算）' },
    { key: '空间几何', label: '空间几何（空间直角坐标系、简单立体图形的性质）' },
    { key: '古典概型与概率计算', label: '古典概型与概率计算' },
    { key: '数据的数字特征', label: '数据的数字特征（均值、方差等）' },
    { key: '正态分布', label: '正态分布（正态分布的基本概念）' },
  ],
  '物理': [
    { key: '运动学', label: '运动学（位移、速度、加速度，匀变速直线运动，自由落体运动）' },
    { key: '牛顿运动定律', label: '牛顿运动定律及其应用' },
    { key: '动量与冲量', label: '动量与冲量，动量守恒定律' },
    { key: '功与能', label: '功与能，机械能守恒定律' },
    { key: '圆周运动与万有引力', label: '圆周运动与万有引力' },
    { key: '简谐振动与机械波', label: '简谐振动与机械波' },
    { key: '静电场', label: '静电场（库仑定律，电场强度，电势）' },
    { key: '直流电路', label: '直流电路（欧姆定律，串并联电路）' },
    { key: '磁场', label: '磁场（磁感应强度，安培力，洛伦兹力）' },
    { key: '电磁感应', label: '电磁感应（法拉第定律，楞次定律）' },
    { key: '分子动理论', label: '分子动理论' },
    { key: '理想气体状态方程', label: '理想气体状态方程' },
    { key: '热力学第一定律', label: '热力学第一定律' },
    { key: '几何光学', label: '几何光学（反射定律，折射定律）' },
    { key: '物理光学', label: '物理光学（干涉，衍射）' },
    { key: '光电效应', label: '光电效应' },
    { key: '原子结构', label: '原子结构' },
    { key: '核物理基础', label: '核物理基础' },
  ],
  '化学': [
    { key: '物质分类与状态变化', label: '物质分类与状态变化' },
    { key: '化学用语与方程式', label: '化学用语与方程式书写' },
    { key: '溶液浓度与pH计算', label: '溶液浓度与pH计算' },
    { key: '物质的量计算', label: '物质的量相关计算' },
    { key: '理想气体状态方程应用', label: '理想气体状态方程应用' },
    { key: '常见无机物性质', label: '常见无机物性质（单质、氧化物、酸、碱、盐）' },
    { key: '基础有机化合物', label: '基础有机化合物（烃类及衍生物）' },
    { key: '氧化还原反应', label: '氧化还原反应判断' },
    { key: '离子反应与检验', label: '离子反应与检验方法' },
    { key: '原子结构与元素周期律', label: '原子结构与元素周期律' },
    { key: '化学键与分子间作用力', label: '化学键与分子间作用力' },
    { key: '化学反应速率与平衡', label: '化学反应速率与平衡' },
    { key: '电解质溶液理论', label: '电解质溶液理论' },
    { key: '实验室安全与仪器', label: '实验室安全与仪器使用' },
    { key: '气体制备与检验', label: '常见气体制备与检验' },
    { key: '物质分离提纯', label: '物质分离提纯方法' },
    { key: '工业化工流程分析', label: '工业化工流程分析（如合成氨）' },
  ],
  '中文': [
    { key: '识解汉字', label: '识解汉字' },
    { key: '选词填空', label: '选词填空' },
    { key: '辨析词语', label: '辨析词语' },
    { key: '选词成段', label: '选词成段' },
    { key: '补全语句', label: '补全语句' },
    { key: '阅读理解', label: '阅读理解' },
  ],
};

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// PDF转图片临时目录
const pdfTempDir = path.join(uploadDir, 'pdf-temp');
if (!fs.existsSync(pdfTempDir)) {
  fs.mkdirSync(pdfTempDir, { recursive: true });
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
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WebP 格式的图片'));
  }
};

// 文件过滤器 - 只允许PDF
const pdfFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('只支持 PDF 格式的文件'));
  }
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // 最多10个文件
  }
});

// PDF上传配置
const pdfUpload = multer({
  storage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 // 每次只允许1个PDF
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

// 动态导入 ES Module 的辅助函数（绕过 TypeScript 编译转换）
const dynamicImport = new Function('modulePath', 'return import(modulePath)');

// PDF上传并转换为图片接口
router.post('/upload-pdf', authenticate, adminAuth, pdfUpload.single('pdf'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ message: '请上传PDF文件' });
    }

    // 动态导入 pdf-to-img (ES Module)
    const pdfToImg = await dynamicImport('pdf-to-img');
    const pdf = pdfToImg.pdf;
    
    const pdfPath = file.path;
    const imageUrls: string[] = [];
    const generatedFiles: string[] = [];

    // 获取服务器基础URL
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = process.env.SERVER_URL || `${protocol}://${host}`;

    console.log(`开始转换PDF: ${pdfPath}`);

    // 转换PDF为图片
    let pageIndex = 0;
    const document = await pdf(pdfPath, { scale: 2.0 }); // scale 2.0 获得更清晰的图片
    
    for await (const image of document) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const imageFilename = `pdf-page-${pageIndex + 1}-${uniqueSuffix}.png`;
      const imagePath = path.join(uploadDir, imageFilename);
      
      // 保存图片
      fs.writeFileSync(imagePath, image);
      
      const imageUrl = `${baseUrl}/uploads/${imageFilename}`;
      imageUrls.push(imageUrl);
      generatedFiles.push(imageFilename);
      
      console.log(`转换完成: 第 ${pageIndex + 1} 页 -> ${imageFilename}`);
      pageIndex++;
      
      // 限制最多转换10页
      if (pageIndex >= 10) {
        console.log('已达到最大页数限制(10页)，停止转换');
        break;
      }
    }

    // 删除原PDF文件
    fs.unlinkSync(pdfPath);

    if (imageUrls.length === 0) {
      return res.status(400).json({ message: 'PDF文件没有可转换的页面' });
    }

    console.log(`PDF转换完成，共 ${imageUrls.length} 页`);

    res.json({
      success: true,
      data: {
        urls: imageUrls,
        count: imageUrls.length,
        files: generatedFiles
      }
    });

  } catch (error: any) {
    console.error('PDF转换错误:', error);
    // 清理上传的PDF文件
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message || 'PDF转换失败' });
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
      "options": ["选项A", "选项B", "选项C", "选项D"],
      "category": "分类"
    }
  ]
}

注意：
1. 只提取题目内容和选项，不需要判断正确答案
2. 如果图片中有多道题目，请全部提取
3. 只输出JSON，不要有其他文字
4. 如有公式请使用LaTeX格式，用$...$包裹
5. 只提取选择题，图片中其它内容不用管，若没有选择题或没有题目，请输出空数组，不要输出多选题，配对匹配型选择题，填空或主观题！只要不是单选一律不管
6. category 必须是以下四个分类之一：中文、数学、物理、化学。根据题目内容判断所属学科分类
7. 注意输出结果中的反斜杠需要转义，如\n需写为\\n，\{需写为\\{`
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
      
      const responseData = await callDashscopeApi(imageUrls, apiKey);
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

// 从URL中提取文件名并删除本地文件
function cleanupImageFiles(imageUrls: string[]) {
  let deletedCount = 0;
  for (const url of imageUrls) {
    try {
      // 从URL中提取文件名 (例如: http://xxx/uploads/question-xxx.jpg -> question-xxx.jpg)
      const filename = path.basename(url);
      const filePath = path.join(uploadDir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`已删除图片: ${filename}`);
      }
    } catch (err) {
      console.error(`删除图片失败: ${url}`, err);
    }
  }
  return deletedCount;
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

    // 标准化题目数据格式（返回题目、选项和分类，不包含答案）
    const validCategories = ['中文', '数学', '物理', '化学'];
    const questions = result.questions.map((item: any) => ({
      question_text: item.question_text || '',
      options: item.options || ['', '', '', ''],
      category: validCategories.includes(item.category) ? item.category : ''
    }));

    // 识别成功后删除图片文件
    const deletedCount = cleanupImageFiles(imageUrls);
    console.log(`识别完成，已清理 ${deletedCount} 个图片文件`);

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
async function callDeepSeekApi(
  question: { question_text: string; options: string[] }, 
  apiKey: string,
  category?: string
): Promise<any> {
  // 获取该科目的知识点列表
  const knowledgePoints = category && KNOWLEDGE_POINTS[category] ? KNOWLEDGE_POINTS[category] : [];
  const knowledgePointKeys = knowledgePoints.map(kp => kp.key);
  
  // 构建知识点说明文本
  let knowledgePointInstruction = '';
  if (knowledgePointKeys.length > 0) {
    knowledgePointInstruction = `
8. knowledge_point 必须从以下知识点列表中选择一个（只能选一个，填写简写形式）：
   可选知识点：${knowledgePointKeys.join('、')}
9. 请根据题目考察的核心内容，选择最匹配的一个知识点
10. 如果题目考察的内容与列表中任何知识点都不匹配，knowledge_point 填写空字符串 ""`;
  } else {
    knowledgePointInstruction = `
8. knowledge_point 填写你判断的这道题主要考察的知识点（字符串形式）`;
  }

  const prompt = `你是一位专业的考试题目解析专家。请分析以下选择题，并按要求给出正确解析。

题目：${question.question_text}

选项：
A. ${question.options[0]}
B. ${question.options[1]}
C. ${question.options[2]}
D. ${question.options[3]}
${category ? `\n科目：${category}` : ''}

请严格按照以下JSON格式返回结果（如有需要，使用$...$包裹LaTeX公式）：
{
  "correct_answer": 0,
  "explanation": "简短的解题过程和解析说明",
  "knowledge_point": "知识点简写",
  "difficulty": "easy"
}

注意：
1. correct_answer 是正确答案的索引（0=A, 1=B, 2=C, 3=D）
2. explanation 请给出简短的解题思路和推导过程，支持LaTeX公式
3. difficulty 只能是 "easy"、"medium" 或 "hard" 之一
4. 只输出JSON，不要有其他文字
5. 题目只涉及中学简单知识，只输出一种简单解法或解释，禁止提到高等数学或大学知识
6. 尽可能言简意赅，不要长篇大论或反复怀疑验算，用凝练的几句话描述即可
7. knowledge_point 只能填写一个知识点（字符串形式）${knowledgePointInstruction}`;

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
    const { question, category } = req.body;

    if (!question || !question.question_text || !question.options) {
      return res.status(400).json({ message: '请提供完整的题目信息（question_text和options）' });
    }

    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return res.status(500).json({ message: 'DeepSeek API Key 未配置，请在环境变量中设置 DEEPSEEK_API_KEY' });
    }

    // 获取该科目的有效知识点列表
    const validKnowledgePoints = category && KNOWLEDGE_POINTS[category] 
      ? KNOWLEDGE_POINTS[category].map(kp => kp.key) 
      : [];

    // 调用DeepSeek API
    let lastError: Error | null = null;
    const maxRetries = 3;
    let retryDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`调用 DeepSeek API 解析题目，第 ${attempt} 次尝试，科目: ${category || '未指定'}`);
        
        const responseData = await callDeepSeekApi(question, deepseekApiKey, category);
        const parsedResult = extractJsonFromDeepSeekResponse(responseData);
        
        // 获取knowledge_point，验证是否在有效列表中
        let knowledgePoint = parsedResult.knowledge_point || '';
        if (validKnowledgePoints.length > 0 && !validKnowledgePoints.includes(knowledgePoint)) {
          // 如果返回的知识点不在列表中，尝试模糊匹配
          const matchedPoint = validKnowledgePoints.find(kp => 
            knowledgePoint.includes(kp) || kp.includes(knowledgePoint)
          );
          if (matchedPoint) {
            knowledgePoint = matchedPoint;
          } else {
            // 如果匹配不到，使用第一个知识点作为默认值（可根据需求调整）
            console.log(`知识点 "${knowledgePoint}" 不在有效列表中，将保留原值`);
          }
        }

        // 验证并标准化结果
        const result = {
          correct_answer: parsedResult.correct_answer ?? 0,
          explanation: parsedResult.explanation || '暂无解析',
          knowledge_point: knowledgePoint,
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
