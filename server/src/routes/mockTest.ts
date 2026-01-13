import express, { Response } from 'express';
import { cscaPool } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// 知识点配置：按科目分组
interface KnowledgePointConfig {
  key: string;
  label: string;
}

// 各科目的知识点及默认每知识点题数配置
interface SubjectQuestionConfig {
  knowledgePoints: KnowledgePointConfig[];
  defaultQuestionsPerPoint: number;
}

// 知识点配置（与题库中的知识点一致）
const SUBJECT_QUESTION_CONFIGS: Record<string, SubjectQuestionConfig> = {
  '文科中文': {
    knowledgePoints: [
      { key: '识解汉字', label: '识解汉字' },
      { key: '选词填空', label: '选词填空' },
      { key: '辨析词语', label: '辨析词语' },
      { key: '选词成段', label: '选词成段' },
      { key: '补全语句', label: '补全语句' },
      { key: '阅读理解', label: '阅读理解' },
    ],
    defaultQuestionsPerPoint: 3,
  },
  '理科中文': {
    knowledgePoints: [
      { key: '识解汉字', label: '识解汉字' },
      { key: '选词填空', label: '选词填空' },
      { key: '辨析词语', label: '辨析词语' },
      { key: '选词成段', label: '选词成段' },
      { key: '补全语句', label: '补全语句' },
      { key: '阅读理解', label: '阅读理解' },
    ],
    defaultQuestionsPerPoint: 3,
  },
  '数学': {
    knowledgePoints: [
      { key: '集合', label: '集合' },
      { key: '不等式', label: '不等式' },
      { key: '函数', label: '函数' },
      { key: '基本初等函数', label: '基本初等函数' },
      { key: '数列', label: '数列' },
      { key: '导数与微积分初步', label: '导数与微积分初步' },
      { key: '平面解析几何', label: '平面解析几何' },
      { key: '向量与复数', label: '向量与复数' },
      { key: '空间几何', label: '空间几何' },
      { key: '古典概型与概率计算', label: '古典概型与概率计算' },
      { key: '数据的数字特征', label: '数据的数字特征' },
      { key: '正态分布', label: '正态分布' },
    ],
    defaultQuestionsPerPoint: 4, // 数学默认每个知识点4题
  },
  '物理': {
    knowledgePoints: [
      { key: '运动学', label: '运动学' },
      { key: '牛顿运动定律', label: '牛顿运动定律' },
      { key: '动量与冲量', label: '动量与冲量' },
      { key: '功与能', label: '功与能' },
      { key: '圆周运动与万有引力', label: '圆周运动与万有引力' },
      { key: '简谐振动与机械波', label: '简谐振动与机械波' },
      { key: '静电场', label: '静电场' },
      { key: '直流电路', label: '直流电路' },
      { key: '磁场', label: '磁场' },
      { key: '电磁感应', label: '电磁感应' },
      { key: '分子动理论', label: '分子动理论' },
      { key: '理想气体状态方程', label: '理想气体状态方程' },
      { key: '热力学第一定律', label: '热力学第一定律' },
      { key: '几何光学', label: '几何光学' },
      { key: '物理光学', label: '物理光学' },
      { key: '光电效应', label: '光电效应' },
      { key: '原子结构', label: '原子结构' },
      { key: '核物理基础', label: '核物理基础' },
    ],
    defaultQuestionsPerPoint: 2,
  },
  '化学': {
    knowledgePoints: [
      { key: '物质分类与状态变化', label: '物质分类与状态变化' },
      { key: '化学用语与方程式', label: '化学用语与方程式' },
      { key: '溶液浓度与pH计算', label: '溶液浓度与pH计算' },
      { key: '物质的量计算', label: '物质的量计算' },
      { key: '理想气体状态方程应用', label: '理想气体状态方程应用' },
      { key: '常见无机物性质', label: '常见无机物性质' },
      { key: '基础有机化合物', label: '基础有机化合物' },
      { key: '氧化还原反应', label: '氧化还原反应' },
      { key: '离子反应与检验', label: '离子反应与检验' },
      { key: '原子结构与元素周期律', label: '原子结构与元素周期律' },
      { key: '化学键与分子间作用力', label: '化学键与分子间作用力' },
      { key: '化学反应速率与平衡', label: '化学反应速率与平衡' },
      { key: '电解质溶液理论', label: '电解质溶液理论' },
      { key: '实验室安全与仪器', label: '实验室安全与仪器' },
      { key: '气体制备与检验', label: '气体制备与检验' },
      { key: '物质分离提纯', label: '物质分离提纯' },
      { key: '工业化工流程分析', label: '工业化工流程分析' },
    ],
    defaultQuestionsPerPoint: 2,
  },
};

// 科目考试时长配置（分钟）
const SUBJECT_DURATION: Record<string, number> = {
  '文科中文': 60,
  '理科中文': 60,
  '数学': 90,
  '物理': 60,
  '化学': 60,
};

// 难度系数配置
interface DifficultyRatio {
  easyRatio: number;
  mediumRatio: number;
  hardRatio: number;
}

const DIFFICULTY_RATIOS: Record<string, DifficultyRatio> = {
  easy: { easyRatio: 0.6, mediumRatio: 0.3, hardRatio: 0.1 },
  medium: { easyRatio: 0.3, mediumRatio: 0.5, hardRatio: 0.2 },
  hard: { easyRatio: 0.1, mediumRatio: 0.4, hardRatio: 0.5 },
};

// 获取可用科目列表
router.get('/subjects', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const subjects = Object.keys(SUBJECT_QUESTION_CONFIGS).map(key => ({
      key,
      durationMinutes: SUBJECT_DURATION[key] || 60,
      totalQuestions: SUBJECT_QUESTION_CONFIGS[key].knowledgePoints.length * 
                      SUBJECT_QUESTION_CONFIGS[key].defaultQuestionsPerPoint,
      knowledgePointsCount: SUBJECT_QUESTION_CONFIGS[key].knowledgePoints.length,
    }));
    
    res.json({
      success: true,
      data: subjects
    });
  } catch (error) {
    console.error('获取科目列表错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 生成模拟测试（按科目动态抽题）
router.post('/generate', authenticate, async (req: AuthRequest, res: Response) => {
  console.log(0);
  try {
    const { subject, difficultyLevel = 'medium' } = req.body;
    
    if (!subject) {
      return res.status(400).json({ message: '请选择考试科目' });
    }
    
    const subjectConfig = SUBJECT_QUESTION_CONFIGS[subject];
    if (!subjectConfig) {
      return res.status(400).json({ message: '无效的科目' });
    }
    
    const difficultyRatio = DIFFICULTY_RATIOS[difficultyLevel] || DIFFICULTY_RATIOS.medium;
    
    // 确定用于查询的科目名称
    // 文科中文和理科中文在题库中可能存储为 "中文" 类别
    let categoryForQuery = subject;
    if (subject === '文科中文' || subject === '理科中文') {
      categoryForQuery = '中文';
    }
    
    const allQuestions: any[] = [];
    
    // 按知识点抽题
    for (const kp of subjectConfig.knowledgePoints) {
      const questionsPerPoint = subjectConfig.defaultQuestionsPerPoint;
      
      // 根据难度系数计算各难度的题目数
      const easyCount = Math.round(questionsPerPoint * difficultyRatio.easyRatio);
      const hardCount = Math.round(questionsPerPoint * difficultyRatio.hardRatio);
      const mediumCount = questionsPerPoint - easyCount - hardCount;
      
      // 分别按难度抽取题目
      const difficulties = [
        { difficulty: 'easy', count: easyCount },
        { difficulty: 'medium', count: mediumCount },
        { difficulty: 'hard', count: hardCount },
      ];
      
      for (const { difficulty, count } of difficulties) {
        if (count <= 0) continue;
        
        // 从数据库随机抽取指定知识点和难度的题目
        const [questions] = await cscaPool.query(
          `SELECT id, question_text, options, correct_answer, category, difficulty, knowledge_point, image_url 
           FROM questions 
           WHERE category = ? AND knowledge_point = ? AND difficulty = ?
           ORDER BY RAND()
           LIMIT ?`,
          [categoryForQuery, kp.key, difficulty, count]
        );
        
        allQuestions.push(...(questions as any[]));
      }
      
      // 如果某个知识点的题目不够，用该知识点的其他难度题目补充
      const currentKpQuestions = allQuestions.filter(q => q.knowledge_point === kp.key);
      if (currentKpQuestions.length < questionsPerPoint) {
        const needed = questionsPerPoint - currentKpQuestions.length;
        const existingIds = currentKpQuestions.map(q => q.id);
        
        let supplementQuery = `SELECT id, question_text, options, correct_answer, category, difficulty, knowledge_point, image_url 
           FROM questions 
           WHERE category = ? AND knowledge_point = ?`;
        const params: any[] = [categoryForQuery, kp.key];
        
        if (existingIds.length > 0) {
          const placeholders = existingIds.map(() => '?').join(',');
          supplementQuery += ` AND id NOT IN (${placeholders})`;
          params.push(...existingIds);
        }
        
        supplementQuery += ` ORDER BY RAND() LIMIT ?`;
        params.push(needed);
        
        const [supplementQuestions] = await cscaPool.query(supplementQuery, params);
        allQuestions.push(...(supplementQuestions as any[]));
      }
    }
    
    // 如果总题目数不够，从该科目随机补充
    const expectedTotal = subjectConfig.knowledgePoints.length * subjectConfig.defaultQuestionsPerPoint;
    if (allQuestions.length < expectedTotal) {
      const needed = expectedTotal - allQuestions.length;
      const existingIds = allQuestions.map(q => q.id);
      
      let supplementQuery = `SELECT id, question_text, options, correct_answer, category, difficulty, knowledge_point, image_url 
         FROM questions 
         WHERE category = ?`;
      const params: any[] = [categoryForQuery];
      
      if (existingIds.length > 0) {
        const placeholders = existingIds.map(() => '?').join(',');
        supplementQuery += ` AND id NOT IN (${placeholders})`;
        params.push(...existingIds);
      }
      
      supplementQuery += ` ORDER BY RAND() LIMIT ?`;
      params.push(needed);
      
      const [supplementQuestions] = await cscaPool.query(supplementQuery, params);
      allQuestions.push(...(supplementQuestions as any[]));
    }
    
    // 打乱题目顺序
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    
    // 处理题目选项（确保是数组格式）
    const processedQuestions = shuffledQuestions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));
    
    res.json({
      success: true,
      data: {
        subject,
        name: `${subject}模拟测试`,
        durationMinutes: SUBJECT_DURATION[subject] || 60,
        totalQuestions: processedQuestions.length,
        difficultyLevel,
        questions: processedQuestions
      }
    });
  } catch (error) {
    console.error('生成模拟测试错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 保留原有的获取配置接口（兼容性）
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

// 获取科目题库统计信息
router.get('/stats/:subject', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { subject } = req.params;
    
    // 确定用于查询的科目名称
    let categoryForQuery = subject;
    if (subject === '文科中文' || subject === '理科中文') {
      categoryForQuery = '中文';
    }
    
    // 获取各知识点的题目数量
    const [stats] = await cscaPool.query(
      `SELECT knowledge_point, difficulty, COUNT(*) as count 
       FROM questions 
       WHERE category = ? 
       GROUP BY knowledge_point, difficulty`,
      [categoryForQuery]
    );
    
    // 整理统计数据
    const statsMap: Record<string, { easy: number; medium: number; hard: number; total: number }> = {};
    (stats as any[]).forEach(row => {
      const kp = row.knowledge_point || '未分类';
      if (!statsMap[kp]) {
        statsMap[kp] = { easy: 0, medium: 0, hard: 0, total: 0 };
      }
      statsMap[kp][row.difficulty as 'easy' | 'medium' | 'hard'] = row.count;
      statsMap[kp].total += row.count;
    });
    
    res.json({
      success: true,
      data: {
        subject,
        knowledgePointStats: statsMap
      }
    });
  } catch (error) {
    console.error('获取题库统计错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
