import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, RefreshCw, Loader2, Database, 
  ChevronLeft, ChevronRight, Edit2, Trash2, X 
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import { ExistingQuestion, Message } from './types';
import { CATEGORIES, DIFFICULTIES, getKnowledgePointLabel } from './constants';
import EditQuestionModal from './EditQuestionModal';

interface QuestionManageSectionProps {
  setMessage: (msg: Message | null) => void;
}

const QuestionManageSection: React.FC<QuestionManageSectionProps> = ({ setMessage }) => {
  const [existingQuestions, setExistingQuestions] = useState<ExistingQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<ExistingQuestion | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载题目列表
  const loadQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
      };
      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }
      if (selectedDifficulty !== 'all') {
        params.difficulty = selectedDifficulty;
      }
      if (searchKeyword.trim()) {
        params.search = searchKeyword.trim();
      }

      const result = await adminAPI.getQuestions(params);
      if (result.success) {
        setExistingQuestions(result.data.questions);
        setTotalPages(result.data.pagination.totalPages);
        setTotalCount(result.data.pagination.total);
      }
    } catch (error: any) {
      console.error('加载题目失败:', error);
      setMessage({ type: 'error', text: '加载题目失败' });
    } finally {
      setLoadingQuestions(false);
    }
  }, [currentPage, selectedCategory, selectedDifficulty, searchKeyword, setMessage]);

  // 当筛选条件变化时重新加载
  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // 切换分类时重置页码
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  // 切换难度时重置页码
  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setCurrentPage(1);
  };

  // 搜索
  const handleSearch = () => {
    setCurrentPage(1);
    loadQuestions();
  };

  // 删除题目
  const handleDeleteQuestion = async (id: number) => {
    if (!window.confirm('确定要删除这道题目吗？此操作不可恢复。')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await adminAPI.deleteQuestion(id);
      if (result.success) {
        setMessage({ type: 'success', text: '题目删除成功' });
        loadQuestions();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '删除失败' });
    } finally {
      setDeletingId(null);
    }
  };

  // 开始编辑题目
  const handleStartEdit = (question: ExistingQuestion) => {
    const options = typeof question.options === 'string' 
      ? JSON.parse(question.options) 
      : question.options;
    setEditingQuestion({ ...question, options });
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingQuestion) return;

    setSaving(true);
    try {
      const result = await adminAPI.updateQuestion(editingQuestion.id, {
        question_text: editingQuestion.question_text,
        options: editingQuestion.options,
        correct_answer: editingQuestion.correct_answer,
        explanation: editingQuestion.explanation,
        category: editingQuestion.category,
        difficulty: editingQuestion.difficulty,
        knowledge_point: editingQuestion.knowledge_point,
      });
      if (result.success) {
        setMessage({ type: 'success', text: '题目更新成功' });
        setEditingQuestion(null);
        loadQuestions();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || '更新失败' });
    } finally {
      setSaving(false);
    }
  };

  // 更新编辑中的题目
  const updateEditingQuestion = (field: keyof ExistingQuestion, value: any) => {
    if (editingQuestion) {
      setEditingQuestion({ ...editingQuestion, [field]: value });
    }
  };

  // 更新编辑中的选项
  const updateEditingOption = (index: number, value: string) => {
    if (editingQuestion && Array.isArray(editingQuestion.options)) {
      const newOptions = [...editingQuestion.options];
      newOptions[index] = value;
      setEditingQuestion({ ...editingQuestion, options: newOptions });
    }
  };

  // 解析选项
  const parseOptions = (options: string | string[]): string[] => {
    if (Array.isArray(options)) return options;
    try {
      return JSON.parse(options);
    } catch {
      return ['', '', '', ''];
    }
  };

  // 获取难度显示文本
  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  return (
    <div className="manage-section">
      {/* 分类标签 */}
      <div className="category-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`category-tab ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.key)}
            style={{ '--tab-color': cat.color } as React.CSSProperties}
          >
            {cat.label}
            {selectedCategory === cat.key && totalCount > 0 && (
              <span className="tab-count">{totalCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜索题目内容..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {searchKeyword && (
              <button className="clear-search" onClick={() => { setSearchKeyword(''); setCurrentPage(1); }}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="difficulty-filter">
            <Filter size={16} />
            <select
              value={selectedDifficulty}
              onChange={(e) => handleDifficultyChange(e.target.value)}
            >
              {DIFFICULTIES.map(d => (
                <option key={d.key} value={d.key}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={loadQuestions}>
          <RefreshCw size={16} />
          刷新
        </button>
      </div>

      {/* 题目列表 */}
      {loadingQuestions ? (
        <div className="loading-state">
          <Loader2 size={32} className="spin" />
          <span>加载中...</span>
        </div>
      ) : existingQuestions.length === 0 ? (
        <div className="empty-state">
          <Database size={48} />
          <h3>暂无题目</h3>
          <p>
            {selectedCategory !== 'all' || selectedDifficulty !== 'all' || searchKeyword
              ? '没有符合筛选条件的题目'
              : '题库中还没有题目，去上传一些吧'}
          </p>
        </div>
      ) : (
        <>
          <div className="questions-table">
            <div className="table-header">
              <span className="col-id">ID</span>
              <span className="col-content">题目内容</span>
              <span className="col-category">分类</span>
              <span className="col-knowledge">知识点</span>
              <span className="col-difficulty">难度</span>
              <span className="col-actions">操作</span>
            </div>
            <div className="table-body">
              {existingQuestions.map((q) => (
                <div key={q.id} className="table-row">
                  <span className="col-id">#{q.id}</span>
                  <div className="col-content">
                    <div className="question-preview-text">
                      <LatexRenderer>{q.question_text.substring(0, 100) + (q.question_text.length > 100 ? '...' : '')}</LatexRenderer>
                    </div>
                    <div className="options-preview">
                      {parseOptions(q.options).map((_, i) => (
                        <span key={i} className={`option-tag ${q.correct_answer === i ? 'correct' : ''}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="col-category">
                    {q.category ? (
                      <span className="category-badge" style={{ 
                        background: `${CATEGORIES.find(c => c.key === q.category)?.color || '#a0aec0'}20`,
                        color: CATEGORIES.find(c => c.key === q.category)?.color || '#a0aec0'
                      }}>
                        {q.category}
                      </span>
                    ) : '-'}
                  </span>
                  <span className="col-knowledge">
                    {q.knowledge_point ? (
                      <span className="knowledge-badge" title={q.category ? getKnowledgePointLabel(q.category, q.knowledge_point) : q.knowledge_point}>
                        {q.knowledge_point}
                      </span>
                    ) : '-'}
                  </span>
                  <span className="col-difficulty">
                    <span className={`difficulty-badge ${q.difficulty}`}>
                      {getDifficultyText(q.difficulty)}
                    </span>
                  </span>
                  <div className="col-actions">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleStartEdit(q)}
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteQuestion(q.id)}
                      disabled={deletingId === q.id}
                      title="删除"
                    >
                      {deletingId === q.id ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={18} />
              </button>
              <span className="page-info">
                第 {currentPage} / {totalPages} 页
              </span>
              <button 
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* 编辑题目弹窗 */}
      {editingQuestion && (
        <EditQuestionModal
          question={editingQuestion}
          saving={saving}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
          onUpdateQuestion={updateEditingQuestion}
          onUpdateOption={updateEditingOption}
        />
      )}
    </div>
  );
};

export default QuestionManageSection;

