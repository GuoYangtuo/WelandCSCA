// 模拟测试科目配置
export interface SubjectConfig {
  key: string;
  label: string;
  labelKey: string; // 用于国际化的 key
  color: string;
  icon: string;
  durationMinutes: number; // 考试时长（分钟）
}

// 五个科目配置
export const MOCK_TEST_SUBJECTS: SubjectConfig[] = [
  { key: '文科中文', label: '文科中文', labelKey: 'artsChinese', color: '#f56565', icon: '📚', durationMinutes: 60 },
  { key: '理科中文', label: '理科中文', labelKey: 'scienceChinese', color: '#ed64a6', icon: '🔬', durationMinutes: 60 },
  { key: '数学', label: '数学', labelKey: 'math', color: '#48bb78', icon: '📐', durationMinutes: 90 },
  { key: '物理', label: '物理', labelKey: 'physics', color: '#4299e1', icon: '⚡', durationMinutes: 60 },
  { key: '化学', label: '化学', labelKey: 'chemistry', color: '#ed8936', icon: '🧪', durationMinutes: 60 },
];

// 知识点配置：按科目分组
export interface KnowledgePointConfig {
  key: string;
  label: string;
}

// 各科目的知识点及默认每知识点题数配置
export interface SubjectQuestionConfig {
  knowledgePoints: KnowledgePointConfig[];
  defaultQuestionsPerPoint: number; // 每个知识点的默认题数
}

// 知识点配置（与题库中的知识点一致）
export const SUBJECT_QUESTION_CONFIGS: Record<string, SubjectQuestionConfig> = {
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
      { key: '集合', label: '集合（集合的定义、运算及表示方法）' },
      { key: '不等式', label: '不等式（不等式的基本性质与解法）' },
      { key: '函数', label: '函数（函数的概念与性质）' },
      { key: '基本初等函数', label: '基本初等函数（幂、指数、对数、三角函数）' },
      { key: '数列', label: '数列（等差、等比数列的通项公式及求和）' },
      { key: '导数与微积分初步', label: '导数与微积分初步' },
      { key: '平面解析几何', label: '平面解析几何（直线、圆、圆锥曲线）' },
      { key: '向量与复数', label: '向量与复数' },
      { key: '空间几何', label: '空间几何' },
      { key: '古典概型与概率计算', label: '古典概型与概率计算' },
      { key: '数据的数字特征', label: '数据的数字特征（均值、方差等）' },
      { key: '正态分布', label: '正态分布' },
    ],
    defaultQuestionsPerPoint: 4, // 数学默认每个知识点4题
  },
  '物理': {
    knowledgePoints: [
      // 力学
      { key: '运动学', label: '运动学（位移、速度、加速度）' },
      { key: '牛顿运动定律', label: '牛顿运动定律及其应用' },
      { key: '动量与冲量', label: '动量与冲量，动量守恒定律' },
      { key: '功与能', label: '功与能，机械能守恒定律' },
      { key: '圆周运动与万有引力', label: '圆周运动与万有引力' },
      { key: '简谐振动与机械波', label: '简谐振动与机械波' },
      // 电磁学
      { key: '静电场', label: '静电场（库仑定律，电场强度，电势）' },
      { key: '直流电路', label: '直流电路（欧姆定律，串并联电路）' },
      { key: '磁场', label: '磁场（磁感应强度，安培力，洛伦兹力）' },
      { key: '电磁感应', label: '电磁感应（法拉第定律，楞次定律）' },
      // 热学
      { key: '分子动理论', label: '分子动理论' },
      { key: '理想气体状态方程', label: '理想气体状态方程' },
      { key: '热力学第一定律', label: '热力学第一定律' },
      // 光学
      { key: '几何光学', label: '几何光学（反射定律，折射定律）' },
      { key: '物理光学', label: '物理光学（干涉，衍射）' },
      // 近代物理
      { key: '光电效应', label: '光电效应' },
      { key: '原子结构', label: '原子结构' },
      { key: '核物理基础', label: '核物理基础' },
    ],
    defaultQuestionsPerPoint: 2,
  },
  '化学': {
    knowledgePoints: [
      // 物质分类与状态变化
      { key: '物质分类与状态变化', label: '物质分类与状态变化' },
      { key: '化学用语与方程式', label: '化学用语与方程式书写' },
      { key: '溶液浓度与pH计算', label: '溶液浓度与pH计算' },
      { key: '物质的量计算', label: '物质的量相关计算' },
      { key: '理想气体状态方程应用', label: '理想气体状态方程应用' },
      // 物质性质与反应
      { key: '常见无机物性质', label: '常见无机物性质' },
      { key: '基础有机化合物', label: '基础有机化合物（烃类及衍生物）' },
      { key: '氧化还原反应', label: '氧化还原反应判断' },
      { key: '离子反应与检验', label: '离子反应与检验方法' },
      // 化学理论与规律
      { key: '原子结构与元素周期律', label: '原子结构与元素周期律' },
      { key: '化学键与分子间作用力', label: '化学键与分子间作用力' },
      { key: '化学反应速率与平衡', label: '化学反应速率与平衡' },
      { key: '电解质溶液理论', label: '电解质溶液理论' },
      // 化学实验与应用
      { key: '实验室安全与仪器', label: '实验室安全与仪器使用' },
      { key: '气体制备与检验', label: '常见气体制备与检验' },
      { key: '物质分离提纯', label: '物质分离提纯方法' },
      { key: '工业化工流程分析', label: '工业化工流程分析' },
    ],
    defaultQuestionsPerPoint: 2,
  },
};

// 难度系数配置
export interface DifficultyConfig {
  key: string;
  label: string;
  labelKey: string;
  easyRatio: number;   // 简单题比例
  mediumRatio: number; // 中等题比例
  hardRatio: number;   // 困难题比例
}

export const DIFFICULTY_LEVELS: DifficultyConfig[] = [
  { key: 'easy', label: '简单', labelKey: 'easy', easyRatio: 0.6, mediumRatio: 0.3, hardRatio: 0.1 },
  { key: 'medium', label: '中等', labelKey: 'medium', easyRatio: 0.3, mediumRatio: 0.5, hardRatio: 0.2 },
  { key: 'hard', label: '困难', labelKey: 'hard', easyRatio: 0.1, mediumRatio: 0.4, hardRatio: 0.5 },
];

// 获取科目配置
export const getSubjectConfig = (subjectKey: string): SubjectConfig | undefined => {
  return MOCK_TEST_SUBJECTS.find(s => s.key === subjectKey);
};

// 获取科目的知识点配置
export const getSubjectQuestionConfig = (subjectKey: string): SubjectQuestionConfig | undefined => {
  // 文科中文和理科中文共用中文的知识点配置
  if (subjectKey === '文科中文' || subjectKey === '理科中文') {
    return SUBJECT_QUESTION_CONFIGS[subjectKey];
  }
  return SUBJECT_QUESTION_CONFIGS[subjectKey];
};

// 计算科目的总题目数
export const calculateTotalQuestions = (subjectKey: string): number => {
  const config = getSubjectQuestionConfig(subjectKey);
  if (!config) return 0;
  return config.knowledgePoints.length * config.defaultQuestionsPerPoint;
};

