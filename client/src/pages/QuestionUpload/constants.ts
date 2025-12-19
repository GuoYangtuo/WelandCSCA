import { QuestionForm } from './types';

// 分类配置
export const CATEGORIES = [
  { key: 'all', label: '全部', color: '#a0aec0' },
  { key: '中文', label: '中文', color: '#f56565' },
  { key: '数学', label: '数学', color: '#48bb78' },
  { key: '物理', label: '物理', color: '#4299e1' },
  { key: '化学', label: '化学', color: '#ed8936' },
];

// 难度配置
export const DIFFICULTIES = [
  { key: 'all', label: '全部难度' },
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
];

// 知识点配置：按科目分组，key为简称（存入数据库），label为详细描述（下拉显示）
export interface KnowledgePointConfig {
  key: string;      // 简称，存入数据库
  label: string;    // 详细描述，下拉菜单显示
}

export const KNOWLEDGE_POINTS: Record<string, KnowledgePointConfig[]> = {
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
    // 力学
    { key: '运动学', label: '运动学（位移、速度、加速度，匀变速直线运动，自由落体运动）' },
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
  '化学': [
    // 物质分类与状态变化
    { key: '物质分类与状态变化', label: '物质分类与状态变化' },
    { key: '化学用语与方程式', label: '化学用语与方程式书写' },
    { key: '溶液浓度与pH计算', label: '溶液浓度与pH计算' },
    { key: '物质的量计算', label: '物质的量相关计算' },
    { key: '理想气体状态方程应用', label: '理想气体状态方程应用' },
    // 物质性质与反应
    { key: '常见无机物性质', label: '常见无机物性质（单质、氧化物、酸、碱、盐）' },
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

// 根据知识点简称获取详细描述
export const getKnowledgePointLabel = (category: string, key: string): string => {
  const points = KNOWLEDGE_POINTS[category];
  if (!points) return key;
  const point = points.find(p => p.key === key);
  return point ? point.label : key;
};

// 空题目模板
export const emptyQuestion: QuestionForm = {
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  category: '',
  difficulty: 'medium',
  knowledge_point: '',
  analyzeStatus: 'completed'
};

// 是否启用 DeepSeek 自动解析（从环境变量读取）
export const ENABLE_DEEPSEEK_ANALYZE = import.meta.env.VITE_ENABLE_DEEPSEEK_ANALYZE === 'true';

