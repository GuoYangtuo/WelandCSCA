import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
  register: async (
    username: string, 
    email: string, 
    password: string,
    nationality: string,
    source: string,
    inviteCode?: string
  ) => {
    const response = await api.post('/auth/register', { 
      username, 
      email, 
      password,
      nationality,
      source,
      inviteCode,
      userType: 'student'
    });
    return response.data;
  },
  registerInstitution: async (
    username: string,
    email: string,
    password: string,
    inviteCode: string
  ) => {
    const response = await api.post('/auth/register', {
      username,
      email,
      password,
      inviteCode,
      userType: 'institution'
    });
    return response.data;
  }
};

export const questionAPI = {
  getAll: async (params?: { category?: string; difficulty?: string; limit?: number }) => {
    const response = await api.get('/questions', { params });
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/questions/${id}`);
    return response.data;
  }
};

export const testAPI = {
  submit: async (
    testType: string, 
    answers: number[], 
    questionIds: number[],
    options?: { subject?: string; difficultyLevel?: string; durationMinutes?: number }
  ) => {
    const response = await api.post('/tests/submit', { 
      testType, 
      answers, 
      questionIds,
      ...options
    });
    return response.data;
  },
  getHistory: async (testType?: string, limit?: number, offset?: number) => {
    const response = await api.get('/tests/history', { params: { testType, limit, offset } });
    return response.data;
  },
  getDetail: async (examId: number) => {
    const response = await api.get(`/tests/detail/${examId}`);
    return response.data;
  },
  getAiAnalysisStatus: async (examId: number) => {
    const response = await api.get(`/tests/ai-analysis-status/${examId}`);
    return response.data;
  },
  getReviewProgress: async (examId: number) => {
    const response = await api.get(`/tests/review-progress/${examId}`);
    return response.data;
  },
  createReviewProgress: async (examId: number, knowledgePointQueue: string[]) => {
    const response = await api.post('/tests/review-progress', { examId, knowledgePointQueue });
    return response.data;
  },
  updateReviewProgress: async (progressId: number, data: {
    currentIndex?: number;
    completedPoints?: string[];
    practiceRecords?: Record<string, any>;
    isCompleted?: boolean;
  }) => {
    const response = await api.put(`/tests/review-progress/${progressId}`, data);
    return response.data;
  },
  getPracticeQuestions: async (knowledgePoint: string, category?: string, excludeIds?: number[]) => {
    const response = await api.get('/tests/practice-questions', { 
      params: { 
        knowledgePoint, 
        category,
        excludeIds: excludeIds?.join(',')
      } 
    });
    return response.data;
  }
};

export const mockTestAPI = {
  getConfig: async () => {
    const response = await api.get('/mock-test/config');
    return response.data;
  },
  // 获取可用科目列表
  getSubjects: async () => {
    const response = await api.get('/mock-test/subjects');
    return response.data;
  },
  // 生成模拟测试（按科目动态抽题）
  generateTest: async (subject: string, difficultyLevel: string = 'medium') => {
    const response = await api.post('/mock-test/generate', { subject, difficultyLevel });
    return response.data;
  },
  // 获取科目题库统计信息
  getSubjectStats: async (subject: string) => {
    const response = await api.get(`/mock-test/stats/${encodeURIComponent(subject)}`);
    return response.data;
  }
};

export const studyAPI = {
  getChapters: async () => {
    const response = await api.get('/study/chapters');
    return response.data;
  },
  getLesson: async (id: number) => {
    const response = await api.get(`/study/lessons/${id}`);
    return response.data;
  },
  getBasicTestStatus: async () => {
    const response = await api.get('/study/basic-test-status');
    return response.data;
  }
};

export const difyAPI = {
  // 上传图片到服务器
  uploadImages: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    const response = await api.post('/dify/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  // 上传PDF并转换为图片
  uploadPdf: async (file: File) => {
    const formData = new FormData();
    formData.append('pdf', file);
    const response = await api.post('/dify/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000 // PDF转换可能需要较长时间，设置2分钟超时
    });
    return response.data;
  },
  // 解析题目（只返回题目和选项）
  parseQuestions: async (imageUrls: string[]) => {
    const response = await api.post('/dify/parse-questions', { imageUrls });
    return response.data;
  },
  // 使用DeepSeek解析单个题目的详细信息
  analyzeQuestion: async (question: { question_text: string; options: string[]; correct_answer?: number; explanation?: string }, category?: string) => {
    const response = await api.post('/dify/analyze-question', { question, category });
    return response.data;
  },
  // 清理上传的图片
  cleanupImages: async (filenames: string[]) => {
    const response = await api.post('/dify/cleanup-images', { filenames });
    return response.data;
  }
};

export const adminAPI = {
  addQuestion: async (question: any) => {
    const response = await api.post('/admin/questions', question);
    return response.data;
  },
  batchAddQuestions: async (questions: any[]) => {
    const response = await api.post('/admin/questions/batch', { questions });
    return response.data;
  },
  getQuestions: async (params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    category?: string; 
    difficulty?: string;
    knowledge_point?: string;
  }) => {
    const response = await api.get('/admin/questions', { params });
    return response.data;
  },
  updateQuestion: async (id: number, question: any) => {
    const response = await api.put(`/admin/questions/${id}`, question);
    return response.data;
  },
  deleteQuestion: async (id: number) => {
    const response = await api.delete(`/admin/questions/${id}`);
    return response.data;
  },
  // 上传题目图片
  uploadQuestionImage: async (formData: FormData) => {
    const response = await api.post('/admin/questions/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  // 删除题目图片
  deleteQuestionImage: async (filename: string) => {
    const response = await api.delete(`/admin/questions/image/${filename}`);
    return response.data;
  },
  // 课时文档上传
  uploadLessonDocument: async (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    const response = await api.post('/admin/lessons/upload-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  // 删除课时文档
  deleteLessonDocument: async (filename: string) => {
    const response = await api.delete(`/admin/lessons/document/${filename}`);
    return response.data;
  },
  // 卡片/卡包管理
  getCardTypes: async () => {
    const response = await api.get('/admin/card-types');
    return response.data;
  },
  getUserCards: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}/cards`);
    return response.data;
  },
  addUserCard: async (userId: string, payload: { card_code?: string; card_type_id?: number; quantity?: number; expires_at?: string }) => {
    const response = await api.post(`/admin/users/${userId}/cards`, payload);
    return response.data;
  },
  updateUserCard: async (userId: string, cardId: number, payload: { quantity?: number; expires_at?: string }) => {
    const response = await api.put(`/admin/users/${userId}/cards/${cardId}`, payload);
    return response.data;
  },
  deleteUserCard: async (userId: string, cardId: number) => {
    const response = await api.delete(`/admin/users/${userId}/cards/${cardId}`);
    return response.data;
  },
  // 订单管理
  getOrders: async (status?: string) => {
    const response = await api.get('/admin/orders', { params: { status } });
    return response.data;
  },
  approveOrder: async (orderId: number) => {
    const response = await api.post(`/admin/orders/${orderId}/approve`);
    return response.data;
  },
  rejectOrder: async (orderId: number, reason?: string) => {
    const response = await api.post(`/admin/orders/${orderId}/reject`, { reason });
    return response.data;
  }
};

// 订单相关API（用户端）
export const ordersAPI = {
  // 获取卡片类型
  getCardTypes: async () => {
    const response = await api.get('/orders/card-types');
    return response.data;
  },
  // 获取我的卡片
  getMyCards: async () => {
    const response = await api.get('/orders/my-cards');
    return response.data;
  },
  // 创建订单
  createOrder: async (items: { card_type_id: number; quantity: number; price: number; card_name: string }[], total_price: number) => {
    const response = await api.post('/orders/create', { items, total_price });
    return response.data;
  },
  // 获取我的订单
  getMyOrders: async () => {
    const response = await api.get('/orders/my-orders');
    return response.data;
  },
  // 取消订单
  cancelOrder: async (orderId: number) => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  }
};

export default api;
