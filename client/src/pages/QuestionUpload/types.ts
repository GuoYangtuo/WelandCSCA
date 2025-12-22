// 解析状态类型
export type AnalyzeStatus = 'pending' | 'analyzing' | 'completed' | 'error';

// 题目表单接口
export interface QuestionForm {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
  difficulty: string;
  knowledge_point: string;  // 知识点（单个）
  source: string;  // 题目来源
  image_url?: string;  // 题目配图URL
  image_file?: File;  // 待上传的图片文件
  analyzeStatus: AnalyzeStatus;
  analyzeError?: string;
}

// 已上传的图片
export interface UploadedImage {
  file?: File;
  preview: string;
  serverUrl?: string;
  selected?: boolean;
}

// 已上传的PDF
export interface UploadedPdf {
  file: File;
  name: string;
  size: number;
}

// 已存在的题目（从数据库加载）
export interface ExistingQuestion {
  id: number;
  question_text: string;
  options: string | string[];
  correct_answer: number;
  explanation: string | null;
  category: string | null;
  difficulty: string;
  knowledge_point: string | null;  // 知识点
  source: string | null;  // 题目来源
  image_url?: string | null;  // 题目配图URL
  created_at?: string;
}

// 消息类型
export interface Message {
  type: 'success' | 'error';
  text: string;
}

