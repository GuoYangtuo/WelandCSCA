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
  Loader
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

type TabType = 'questions' | 'tests' | 'chapters' | 'lessons';

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
    }
  }, [activeTab, isAdmin, loadQuestions, loadTestResults, loadChapters, loadLessons]);

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
        </main>

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
                      <span className={`option-label ${editingQuestion.correct_answer === i ? 'correct' : ''}`}>
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

