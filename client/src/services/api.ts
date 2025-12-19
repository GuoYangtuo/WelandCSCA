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
  submit: async (testType: string, answers: number[], questionIds: number[]) => {
    const response = await api.post('/tests/submit', { testType, answers, questionIds });
    return response.data;
  },
  getHistory: async (testType?: string) => {
    const response = await api.get('/tests/history', { params: { testType } });
    return response.data;
  }
};

export const mockTestAPI = {
  getConfig: async () => {
    const response = await api.get('/mock-test/config');
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
  analyzeQuestion: async (question: { question_text: string; options: string[] }, category?: string) => {
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
    difficulty?: string 
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
  }
};

export default api;
