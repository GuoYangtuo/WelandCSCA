import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Shield,
  FileText,
  BookOpen,
  ClipboardList,
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader,
  Key,
  Copy,
  ShoppingCart,
  Check,
  XCircle,
  Clock
} from 'lucide-react';
import './Admin.css';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
  difficulty: string;
}

interface TestResult {
  id: number;
  user_id: string;
  username: string;
  email: string;
  test_type: string;
  score: number;
  total_questions: number;
  created_at: string;
}

interface Chapter {
  id: number;
  title: string;
  description: string;
  order_index: number;
}

interface Lesson {
  id: number;
  chapter_id: number;
  chapter_title: string;
  title: string;
  content: string;
  order_index: number;
}

interface InvitationCode {
  id: number;
  code: string;
  description: string | null;
  is_used: boolean;
  used_by: string | null;
  used_by_username: string | null;
  used_at: string | null;
  created_at: string;
}

interface CardOrder {
  id: number;
  order_code: string;
  user_id: string;
  username: string;
  email: string;
  order_items: { card_type_id: number; quantity: number; price: number; card_name: string }[];
  total_price: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: string | null;
  approved_at: string | null;
  reject_reason: string | null;
  created_at: string;
}

type TabType = 'questions' | 'tests' | 'chapters' | 'lessons' | 'inviteCodes' | 'cardPacks' | 'orders';

const Admin: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<TabType>('questions');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsPagination, setQuestionsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [questionSearch, setQuestionSearch] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Test results state
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testsPagination, setTestsPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [testTypeFilter, setTestTypeFilter] = useState('');

  // Chapters state
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [newChapter, setNewChapter] = useState<Partial<Chapter> | null>(null);

  // Lessons state
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [newLesson, setNewLesson] = useState<Partial<Lesson> | null>(null);
  const [lessonChapterFilter, setLessonChapterFilter] = useState('');

  // Invitation codes state
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([]);
  const [showUsedCodes, setShowUsedCodes] = useState(false);
  const [newCodeDescription, setNewCodeDescription] = useState('');
  const [generatingCode, setGeneratingCode] = useState(false);

  // Users & Card packs state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userCards, setUserCards] = useState<any[]>([]);
  const [newCardTypeId, setNewCardTypeId] = useState<number | null>(null);
  const [newCardQuantity, setNewCardQuantity] = useState<number>(1);
  const [newCardExpiresAt, setNewCardExpiresAt] = useState<string>('');
  const [editingUserCard, setEditingUserCard] = useState<any | null>(null);
  const [editingUserCardQuantity, setEditingUserCardQuantity] = useState<number>(0);
  const [editingUserCardExpiresAt, setEditingUserCardExpiresAt] = useState<string>('');

  // Orders state
  const [orders, setOrders] = useState<CardOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('pending');
  const [processingOrderId, setProcessingOrderId] = useState<number | null>(null);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      
      if (!isAuthenticated) {
        navigate('/');
        return;
      }

      try {
        await api.get('/admin/check');
        setIsAdmin(true);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [isAuthenticated, authLoading, navigate]);

  // Load data based on active tab
  const loadQuestions = useCallback(async (page = 1) => {
    try {
      const response = await api.get('/admin/questions', {
        params: { page, limit: 10, search: questionSearch }
      });
      setQuestions(response.data.data.questions.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      })));
      setQuestionsPagination(response.data.data.pagination);
    } catch (error) {
      console.error('加载题目失败:', error);
    }
  }, [questionSearch]);

  const loadTestResults = useCallback(async (page = 1) => {
    try {
      const response = await api.get('/admin/test-results', {
        params: { page, limit: 10, testType: testTypeFilter || undefined }
      });
      setTestResults(response.data.data.results);
      setTestsPagination(response.data.data.pagination);
    } catch (error) {
      console.error('加载考试记录失败:', error);
    }
  }, [testTypeFilter]);

  const loadChapters = useCallback(async () => {
    try {
      const response = await api.get('/admin/chapters');
      setChapters(response.data.data);
    } catch (error) {
      console.error('加载章节失败:', error);
    }
  }, []);

  const loadLessons = useCallback(async () => {
    try {
      const response = await api.get('/admin/lessons', {
        params: { chapterId: lessonChapterFilter || undefined }
      });
      setLessons(response.data.data);
    } catch (error) {
      console.error('加载课时失败:', error);
    }
  }, [lessonChapterFilter]);

  const loadInvitationCodes = useCallback(async () => {
    try {
      const response = await api.get('/admin/invitation-codes', {
        params: { showUsed: showUsedCodes }
      });
      setInvitationCodes(response.data.data);
    } catch (error) {
      console.error('加载邀请码失败:', error);
    }
  }, [showUsedCodes]);

  const loadOrders = useCallback(async () => {
    try {
      const response = await api.get('/admin/orders', {
        params: { status: orderStatusFilter || undefined }
      });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('加载订单失败:', error);
    }
  }, [orderStatusFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    
    switch (activeTab) {
      case 'questions':
        loadQuestions();
        break;
      case 'tests':
        loadTestResults();
        break;
      case 'chapters':
        loadChapters();
        break;
      case 'lessons':
        loadChapters();
        loadLessons();
        break;
      case 'inviteCodes':
        loadInvitationCodes();
        break;
      case 'cardPacks':
        // load supporting data for card packs
        (async () => {
          try {
            const usersResp = await api.get('/admin/users');
            setUsersList(usersResp.data.data || []);
            const typesResp = await api.get('/admin/card-types');
            setCardTypes(typesResp.data.data || typesResp.data || []);
          } catch (e) {
            console.error('加载卡包初始化数据失败', e);
            setMessage({ type: 'error', text: '加载卡包初始化数据失败' });
          }
        })();
        break;
      case 'orders':
        loadOrders();
        break;
    }
  }, [activeTab, isAdmin, loadQuestions, loadTestResults, loadChapters, loadLessons, loadInvitationCodes, loadOrders]);

  const loadUserCards = async (userId: string) => {
    if (!userId) return;
    try {
      const resp = await api.get(`/admin/users/${userId}/cards`);
      setUserCards(resp.data.data);
    } catch (e) {
      console.error('加载用户卡片失败', e);
      setMessage({ type: 'error', text: '加载用户卡片失败' });
    }
  };

  const handleAddUserCard = async () => {
    if (!selectedUserId || (!newCardTypeId)) return setMessage({ type: 'error', text: '请选择用户和卡片类型' });
    try {
      await api.post(`/admin/users/${selectedUserId}/cards`, {
        card_type_id: newCardTypeId,
        quantity: newCardQuantity,
        expires_at: newCardExpiresAt || null
      });
      setMessage({ type: 'success', text: '已为用户添加卡片' });
      loadUserCards(selectedUserId);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || '添加卡片失败' });
    }
  };

  const handleUpdateUserCard = async (cardId: number, quantity?: number, expires_at?: string) => {
    try {
      await api.put(`/admin/users/${selectedUserId}/cards/${cardId}`, { quantity, expires_at: expires_at || undefined });
      setMessage({ type: 'success', text: '用户卡片已更新' });
      loadUserCards(selectedUserId);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || '更新失败' });
    }
  };

  const handleDeleteUserCard = async (cardId: number) => {
    if (!confirm('确定要删除该用户卡片吗？')) return;
    try {
      await api.delete(`/admin/users/${selectedUserId}/cards/${cardId}`);
      setMessage({ type: 'success', text: '用户卡片已删除' });
      loadUserCards(selectedUserId);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.message || '删除失败' });
    }
  };

  const openEditUserCard = (card: any) => {
    setEditingUserCard(card);
    setEditingUserCardQuantity(card.quantity || 0);
    const formattedDate = card.expires_at ? new Date(card.expires_at).toISOString().slice(0,10) : '';
    setEditingUserCardExpiresAt(formattedDate);
  };

  const handleSaveUserCard = async () => {
    if (!editingUserCard) return;
    try {
      await handleUpdateUserCard(editingUserCard.id, editingUserCardQuantity, editingUserCardExpiresAt || undefined);
      setEditingUserCard(null);
    } catch (e) {
      // handleUpdateUserCard already sets messages
    }
  };

  // Question operations
  const handleSaveQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      await api.put(`/admin/questions/${editingQuestion.id}`, editingQuestion);
      setMessage({ type: 'success', text: '题目更新成功' });
      setEditingQuestion(null);
      loadQuestions(questionsPagination.page);
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败' });
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    if (!confirm('确定要删除这道题目吗？')) return;
    
    try {
      await api.delete(`/admin/questions/${id}`);
      setMessage({ type: 'success', text: '题目删除成功' });
      loadQuestions(questionsPagination.page);
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // Test result operations
  const handleDeleteTestResult = async (id: number) => {
    if (!confirm('确定要删除这条考试记录吗？')) return;
    
    try {
      await api.delete(`/admin/test-results/${id}`);
      setMessage({ type: 'success', text: '记录删除成功' });
      loadTestResults(testsPagination.page);
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // Chapter operations
  const handleSaveChapter = async () => {
    if (!editingChapter) return;
    
    try {
      await api.put(`/admin/chapters/${editingChapter.id}`, editingChapter);
      setMessage({ type: 'success', text: '章节更新成功' });
      setEditingChapter(null);
      loadChapters();
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败' });
    }
  };

  const handleCreateChapter = async () => {
    if (!newChapter?.title) return;
    
    try {
      await api.post('/admin/chapters', newChapter);
      setMessage({ type: 'success', text: '章节创建成功' });
      setNewChapter(null);
      loadChapters();
    } catch (error) {
      setMessage({ type: 'error', text: '创建失败' });
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (!confirm('确定要删除这个章节吗？相关课时也会被删除！')) return;
    
    try {
      await api.delete(`/admin/chapters/${id}`);
      setMessage({ type: 'success', text: '章节删除成功' });
      loadChapters();
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // Lesson operations
  const handleSaveLesson = async () => {
    if (!editingLesson) return;
    
    try {
      await api.put(`/admin/lessons/${editingLesson.id}`, editingLesson);
      setMessage({ type: 'success', text: '课时更新成功' });
      setEditingLesson(null);
      loadLessons();
    } catch (error) {
      setMessage({ type: 'error', text: '更新失败' });
    }
  };

  const handleCreateLesson = async () => {
    if (!newLesson?.title || !newLesson?.chapter_id || !newLesson?.content) return;
    
    try {
      await api.post('/admin/lessons', newLesson);
      setMessage({ type: 'success', text: '课时创建成功' });
      setNewLesson(null);
      loadLessons();
    } catch (error) {
      setMessage({ type: 'error', text: '创建失败' });
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('确定要删除这个课时吗？')) return;
    
    try {
      await api.delete(`/admin/lessons/${id}`);
      setMessage({ type: 'success', text: '课时删除成功' });
      loadLessons();
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // Invitation code operations
  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const response = await api.post('/admin/invitation-codes', {
        description: newCodeDescription || null
      });
      setMessage({ type: 'success', text: `邀请码生成成功: ${response.data.data.code}` });
      setNewCodeDescription('');
      loadInvitationCodes();
    } catch (error) {
      setMessage({ type: 'error', text: '生成邀请码失败' });
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!confirm('确定要删除这个邀请码吗？')) return;
    
    try {
      await api.delete(`/admin/invitation-codes/${id}`);
      setMessage({ type: 'success', text: '邀请码删除成功' });
      loadInvitationCodes();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '删除失败' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage({ type: 'success', text: '邀请码已复制到剪贴板' });
  };

  // Order operations
  const handleApproveOrder = async (orderId: number) => {
    if (!confirm('确定要审核通过此订单吗？通过后将自动为用户发放卡片。')) return;
    
    setProcessingOrderId(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/approve`);
      setMessage({ type: 'success', text: '订单审核通过，卡片已发放给用户' });
      loadOrders();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '审核失败' });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    const reason = prompt('请输入拒绝原因（可选）：');
    if (reason === null) return; // 用户点击取消
    
    setProcessingOrderId(orderId);
    try {
      await api.post(`/admin/orders/${orderId}/reject`, { reason });
      setMessage({ type: 'success', text: '订单已拒绝' });
      loadOrders();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '拒绝失败' });
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleCopyOrderCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setMessage({ type: 'success', text: '订单码已复制到剪贴板' });
  };

  // Render loading state
  if (authLoading || loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <Loader className="spin" size={48} />
          <p>验证权限中...</p>
        </div>
      </div>
    );
  }

  // Render access denied
  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="access-denied">
          <Shield size={64} />
          <h2>访问被拒绝</h2>
          <p>此页面仅限管理员访问</p>
          <p className="hint">当前用户: {user?.username}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <header className="admin-header">
          <div className="header-title">
            <Shield size={28} />
            <h1>管理后台</h1>
          </div>
          <span className="admin-badge">管理员: {user?.username}</span>
        </header>

        {/* Message */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
            <button className="message-close" onClick={() => setMessage(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tabs */}
        <nav className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            <FileText size={18} />
            题库管理
          </button>
          <button
            className={`tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            <ClipboardList size={18} />
            考试记录
          </button>
          <button
            className={`tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveTab('chapters')}
          >
            <BookOpen size={18} />
            章节管理
          </button>
          <button
            className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            <Users size={18} />
            课时管理
          </button>
          <button
            className={`tab-btn ${activeTab === 'inviteCodes' ? 'active' : ''}`}
            onClick={() => setActiveTab('inviteCodes')}
          >
            <Key size={18} />
            邀请码管理
          </button>
          <button
            className={`tab-btn ${activeTab === 'cardPacks' ? 'active' : ''}`}
            onClick={() => setActiveTab('cardPacks')}
          >
            <Users size={18} />
            卡包管理
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={18} />
            订单管理
          </button>
        </nav>

        {/* Content */}
        <main className="admin-content">
          {/* Questions Tab */}
          {activeTab === 'questions' && (
            <div className="tab-content">
              <div className="content-header">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="搜索题目..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadQuestions(1)}
                  />
                </div>
                <button className="btn btn-primary" onClick={() => navigate('/question-upload')}>
                  <Plus size={18} />
                  添加题目
                </button>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>题目内容</th>
                      <th>分类</th>
                      <th>难度</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.id}>
                        <td>{q.id}</td>
                        <td className="question-text-cell">
                          {q.question_text.substring(0, 50)}...
                        </td>
                        <td>{q.category || '-'}</td>
                        <td>
                          <span className={`difficulty-badge ${q.difficulty}`}>
                            {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="btn-action edit" onClick={() => setEditingQuestion(q)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-action delete" onClick={() => handleDeleteQuestion(q.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span>共 {questionsPagination.total} 条</span>
                <div className="pagination-btns">
                  <button
                    disabled={questionsPagination.page <= 1}
                    onClick={() => loadQuestions(questionsPagination.page - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>{questionsPagination.page} / {questionsPagination.totalPages}</span>
                  <button
                    disabled={questionsPagination.page >= questionsPagination.totalPages}
                    onClick={() => loadQuestions(questionsPagination.page + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Results Tab */}
          {activeTab === 'tests' && (
            <div className="tab-content">
              <div className="content-header">
                <select
                  className="filter-select"
                  value={testTypeFilter}
                  onChange={(e) => {
                    setTestTypeFilter(e.target.value);
                    setTimeout(() => loadTestResults(1), 0);
                  }}
                >
                  <option value="">全部类型</option>
                  <option value="basic">基础测试</option>
                  <option value="mock">模拟测试</option>
                </select>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>用户</th>
                      <th>类型</th>
                      <th>得分</th>
                      <th>正确率</th>
                      <th>时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((r) => (
                      <tr key={r.id}>
                        <td>{r.id}</td>
                        <td>{r.username || r.user_id?.substring(0, 8)}</td>
                        <td>
                          <span className={`type-badge ${r.test_type}`}>
                            {r.test_type === 'basic' ? '基础' : '模拟'}
                          </span>
                        </td>
                        <td>{r.score} / {r.total_questions}</td>
                        <td>{Math.round((r.score / r.total_questions) * 100)}%</td>
                        <td>{new Date(r.created_at).toLocaleString('zh-CN')}</td>
                        <td className="actions-cell">
                          <button className="btn-action delete" onClick={() => handleDeleteTestResult(r.id)}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <span>共 {testsPagination.total} 条</span>
                <div className="pagination-btns">
                  <button
                    disabled={testsPagination.page <= 1}
                    onClick={() => loadTestResults(testsPagination.page - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span>{testsPagination.page} / {testsPagination.totalPages}</span>
                  <button
                    disabled={testsPagination.page >= testsPagination.totalPages}
                    onClick={() => loadTestResults(testsPagination.page + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Chapters Tab */}
          {activeTab === 'chapters' && (
            <div className="tab-content">
              <div className="content-header">
                <span className="content-title">章节列表</span>
                <button className="btn btn-primary" onClick={() => setNewChapter({ title: '', description: '', order_index: 0 })}>
                  <Plus size={18} />
                  添加章节
                </button>
              </div>

              {newChapter && (
                <div className="edit-form">
                  <h3>新建章节</h3>
                  <div className="form-group">
                    <label>标题</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newChapter.title || ''}
                      onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>描述</label>
                    <textarea
                      className="form-input"
                      value={newChapter.description || ''}
                      onChange={(e) => setNewChapter({ ...newChapter, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>排序</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newChapter.order_index || 0}
                      onChange={(e) => setNewChapter({ ...newChapter, order_index: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setNewChapter(null)}>取消</button>
                    <button className="btn btn-primary" onClick={handleCreateChapter}>
                      <Save size={16} />
                      保存
                    </button>
                  </div>
                </div>
              )}

              <div className="cards-list">
                {chapters.map((c) => (
                  <div key={c.id} className="item-card">
                    <div className="card-header">
                      <span className="card-order">#{c.order_index}</span>
                      <h4>{c.title}</h4>
                    </div>
                    <p className="card-desc">{c.description || '暂无描述'}</p>
                    <div className="card-actions">
                      <button className="btn-action edit" onClick={() => setEditingChapter(c)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-action delete" onClick={() => handleDeleteChapter(c.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="tab-content">
              <div className="content-header">
                <select
                  className="filter-select"
                  value={lessonChapterFilter}
                  onChange={(e) => {
                    setLessonChapterFilter(e.target.value);
                    setTimeout(() => loadLessons(), 0);
                  }}
                >
                  <option value="">全部章节</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={() => setNewLesson({ title: '', content: '', chapter_id: chapters[0]?.id, order_index: 0 })}>
                  <Plus size={18} />
                  添加课时
                </button>
              </div>

              {newLesson && (
                <div className="edit-form">
                  <h3>新建课时</h3>
                  <div className="form-group">
                    <label>所属章节</label>
                    <select
                      className="form-input"
                      value={newLesson.chapter_id || ''}
                      onChange={(e) => setNewLesson({ ...newLesson, chapter_id: parseInt(e.target.value) })}
                    >
                      {chapters.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>标题</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newLesson.title || ''}
                      onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>内容</label>
                    <textarea
                      className="form-input"
                      rows={6}
                      value={newLesson.content || ''}
                      onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>排序</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newLesson.order_index || 0}
                      onChange={(e) => setNewLesson({ ...newLesson, order_index: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={() => setNewLesson(null)}>取消</button>
                    <button className="btn btn-primary" onClick={handleCreateLesson}>
                      <Save size={16} />
                      保存
                    </button>
                  </div>
                </div>
              )}

              <div className="cards-list">
                {lessons.map((l) => (
                  <div key={l.id} className="item-card">
                    <div className="card-header">
                      <span className="card-chapter">{l.chapter_title}</span>
                      <h4>{l.title}</h4>
                    </div>
                    <p className="card-desc">{l.content?.substring(0, 100)}...</p>
                    <div className="card-actions">
                      <button className="btn-action edit" onClick={() => setEditingLesson(l)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-action delete" onClick={() => handleDeleteLesson(l.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invitation Codes Tab */}
          {activeTab === 'inviteCodes' && (
            <div className="tab-content">
              <div className="content-header">
                <div className="header-left">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showUsedCodes}
                      onChange={(e) => {
                        setShowUsedCodes(e.target.checked);
                        setTimeout(() => loadInvitationCodes(), 0);
                      }}
                    />
                    <span>显示已使用的邀请码</span>
                  </label>
                </div>
                <div className="generate-code-form">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="备注说明（可选）"
                    value={newCodeDescription}
                    onChange={(e) => setNewCodeDescription(e.target.value)}
                    style={{ width: '200px' }}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleGenerateCode}
                    disabled={generatingCode}
                  >
                    <Key size={18} />
                    {generatingCode ? '生成中...' : '生成邀请码'}
                  </button>
                </div>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>邀请码</th>
                      <th>备注</th>
                      <th>状态</th>
                      <th>使用者</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitationCodes.map((code) => (
                      <tr key={code.id}>
                        <td>
                          <code className="invite-code-text">{code.code}</code>
                        </td>
                        <td>{code.description || '-'}</td>
                        <td>
                          <span className={`status-badge ${code.is_used ? 'used' : 'available'}`}>
                            {code.is_used ? '已使用' : '可用'}
                          </span>
                        </td>
                        <td>
                          {code.is_used ? (
                            <span>
                              {code.used_by_username || code.used_by?.substring(0, 8)}
                              {code.used_at && (
                                <span className="used-time">
                                  {' '}({new Date(code.used_at).toLocaleDateString('zh-CN')})
                                </span>
                              )}
                            </span>
                          ) : '-'}
                        </td>
                        <td>{new Date(code.created_at).toLocaleString('zh-CN')}</td>
                        <td className="actions-cell">
                          <button 
                            className="btn-action edit" 
                            onClick={() => handleCopyCode(code.code)}
                            title="复制邀请码"
                          >
                            <Copy size={16} />
                          </button>
                          {!code.is_used && (
                            <button 
                              className="btn-action delete" 
                              onClick={() => handleDeleteCode(code.id)}
                              title="删除邀请码"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {invitationCodes.length === 0 && (
                <div className="empty-state">
                  <Key size={48} />
                  <p>暂无邀请码</p>
                  <p className="hint">点击上方按钮生成新的邀请码</p>
                </div>
              )}
            </div>
          )}

          {/* Card Packs Tab */}
          {activeTab === 'cardPacks' && (
            <div className="tab-content">
              <div className="content-header">
                <div className="header-left">
                  <select
                    className="filter-select"
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setTimeout(() => loadUserCards(e.target.value), 0);
                    }}
                  >
                    <option value="">选择用户</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                    ))}
                  </select>
                </div>
                <div className="header-right">
                  <select className="filter-select" value={newCardTypeId || ''} onChange={(e) => setNewCardTypeId(e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">选择卡片类型</option>
                    {cardTypes.map((ct) => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                  <input type="number" className="form-input" value={newCardQuantity} min={1} style={{ width: 90 }} onChange={(e) => setNewCardQuantity(parseInt(e.target.value || '1'))} />
                  <input type="date" className="form-input" value={newCardExpiresAt} onChange={(e) => setNewCardExpiresAt(e.target.value)} />
                  <button className="btn btn-primary" onClick={handleAddUserCard}><Plus size={16} /> 添加卡片</button>
                </div>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>卡名</th>
                      <th>编码</th>
                      <th>数量</th>
                      <th>过期时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userCards.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.card_name || '-'}</td>
                        <td>{c.card_code || '-'}</td>
                        <td>{c.quantity ?? '-'}</td>
                        <td>{c.expires_at ? new Date(c.expires_at).toLocaleDateString('zh-CN') : '-'}</td>
                        <td className="actions-cell">
                          <button className="btn-action edit" onClick={() => openEditUserCard(c)} title="编辑">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-action delete" onClick={() => handleDeleteUserCard(c.id)} title="删除">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-content">
              <div className="content-header">
                <div className="header-left">
                  <select
                    className="filter-select"
                    value={orderStatusFilter}
                    onChange={(e) => {
                      setOrderStatusFilter(e.target.value);
                      setTimeout(() => loadOrders(), 0);
                    }}
                  >
                    <option value="">全部状态</option>
                    <option value="pending">待处理</option>
                    <option value="approved">已通过</option>
                    <option value="rejected">已拒绝</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
                <div className="orders-stats">
                  <span className="stat-item pending">
                    <Clock size={16} />
                    待处理: {orders.filter(o => o.status === 'pending').length}
                  </span>
                </div>
              </div>

              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>订单码</th>
                      <th>用户</th>
                      <th>订单内容</th>
                      <th>金额</th>
                      <th>状态</th>
                      <th>创建时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <code className="order-code-text">{order.order_code}</code>
                          <button 
                            className="btn-copy-small" 
                            onClick={() => handleCopyOrderCode(order.order_code)}
                            title="复制订单码"
                          >
                            <Copy size={12} />
                          </button>
                        </td>
                        <td>
                          <div className="user-info">
                            <span className="user-name">{order.username || '未知'}</span>
                            <span className="user-email">{order.email || ''}</span>
                          </div>
                        </td>
                        <td>
                          <div className="order-items-list">
                            {order.order_items.map((item, idx) => (
                              <span key={idx} className="order-item-tag">
                                {item.card_name} x{item.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="order-amount">¥{order.total_price}</td>
                        <td>
                          <span className={`order-status-badge ${order.status}`}>
                            {order.status === 'pending' && <Clock size={14} />}
                            {order.status === 'approved' && <CheckCircle size={14} />}
                            {order.status === 'rejected' && <XCircle size={14} />}
                            {order.status === 'cancelled' && <X size={14} />}
                            {order.status === 'pending' ? '待处理' : 
                             order.status === 'approved' ? '已通过' :
                             order.status === 'rejected' ? '已拒绝' : '已取消'}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleString('zh-CN')}</td>
                        <td className="actions-cell">
                          {order.status === 'pending' && (
                            <>
                              <button 
                                className="btn-action approve" 
                                onClick={() => handleApproveOrder(order.id)}
                                disabled={processingOrderId === order.id}
                                title="审核通过"
                              >
                                {processingOrderId === order.id ? (
                                  <Loader size={16} className="spin" />
                                ) : (
                                  <Check size={16} />
                                )}
                              </button>
                              <button 
                                className="btn-action delete" 
                                onClick={() => handleRejectOrder(order.id)}
                                disabled={processingOrderId === order.id}
                                title="拒绝订单"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                          {order.status !== 'pending' && (
                            <span className="no-actions">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {orders.length === 0 && (
                <div className="empty-state">
                  <ShoppingCart size={48} />
                  <p>暂无订单</p>
                  <p className="hint">
                    {orderStatusFilter === 'pending' 
                      ? '目前没有待处理的订单' 
                      : '当前筛选条件下没有订单'}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

      {/* Edit User Card Modal */}
      {editingUserCard && (
        <div className="modal-overlay" onClick={() => setEditingUserCard(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>编辑用户卡片</h3>
              <button className="modal-close" onClick={() => setEditingUserCard(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>卡名</label>
                <input type="text" className="form-input" value={editingUserCard.card_name || ''} readOnly />
              </div>
              <div className="form-group">
                <label>数量</label>
                <input type="number" className="form-input" value={editingUserCardQuantity} min={0} onChange={(e) => setEditingUserCardQuantity(parseInt(e.target.value || '0'))} />
              </div>
              <div className="form-group">
                <label>过期时间</label>
                <input type="date" className="form-input" value={editingUserCardExpiresAt || ''} onChange={(e) => setEditingUserCardExpiresAt(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingUserCard(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveUserCard}>
                <Save size={16} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Edit Question Modal */}
        {editingQuestion && (
          <div className="modal-overlay" onClick={() => setEditingQuestion(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>编辑题目</h3>
                <button className="modal-close" onClick={() => setEditingQuestion(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>题目内容</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingQuestion.question_text}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, question_text: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>选项</label>
                  {editingQuestion.options.map((opt, i) => (
                    <div key={i} className="option-edit-row">
                      <span className="option-label">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...editingQuestion.options];
                          newOpts[i] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                      />
                      <button
                        className={`correct-btn ${editingQuestion.correct_answer === i ? 'active' : ''}`}
                        onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: i })}
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>分类</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editingQuestion.category || ''}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, category: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>难度</label>
                    <select
                      className="form-input"
                      value={editingQuestion.difficulty}
                      onChange={(e) => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value })}
                    >
                      <option value="easy">简单</option>
                      <option value="medium">中等</option>
                      <option value="hard">困难</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>解析</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={editingQuestion.explanation || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditingQuestion(null)}>取消</button>
                <button className="btn btn-primary" onClick={handleSaveQuestion}>
                  <Save size={16} />
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Chapter Modal */}
        {editingChapter && (
          <div className="modal-overlay" onClick={() => setEditingChapter(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>编辑章节</h3>
                <button className="modal-close" onClick={() => setEditingChapter(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>标题</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingChapter.title}
                    onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>描述</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingChapter.description || ''}
                    onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>排序</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingChapter.order_index}
                    onChange={(e) => setEditingChapter({ ...editingChapter, order_index: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditingChapter(null)}>取消</button>
                <button className="btn btn-primary" onClick={handleSaveChapter}>
                  <Save size={16} />
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Lesson Modal */}
        {editingLesson && (
          <div className="modal-overlay" onClick={() => setEditingLesson(null)}>
            <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>编辑课时</h3>
                <button className="modal-close" onClick={() => setEditingLesson(null)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>所属章节</label>
                  <select
                    className="form-input"
                    value={editingLesson.chapter_id}
                    onChange={(e) => setEditingLesson({ ...editingLesson, chapter_id: parseInt(e.target.value) })}
                  >
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>标题</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingLesson.title}
                    onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>内容</label>
                  <textarea
                    className="form-input"
                    rows={10}
                    value={editingLesson.content}
                    onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>排序</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingLesson.order_index}
                    onChange={(e) => setEditingLesson({ ...editingLesson, order_index: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditingLesson(null)}>取消</button>
                <button className="btn btn-primary" onClick={handleSaveLesson}>
                  <Save size={16} />
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

