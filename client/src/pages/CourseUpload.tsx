import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { adminAPI } from '../services/api';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  FolderPlus,
  FileText,
  Eye,
  Layers,
  Upload,
  File,
  FileImage,
  FileSpreadsheet
} from 'lucide-react';
import './CourseUpload.css';

interface Chapter {
  id: number;
  title: string;
  description: string;
  order_index: number;
}

interface Lesson {
  id: number;
  chapter_id: number;
  chapter_title?: string;
  title: string;
  content: string;
  document_url?: string;
  document_name?: string;
  order_index: number;
}

type EditMode = 'none' | 'chapter' | 'lesson';

const CourseUpload: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 数据状态
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 选中状态
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());

  // 编辑状态
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // 文档上传状态
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 权限检查
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // 加载数据
  const loadChapters = useCallback(async () => {
    try {
      const response = await api.get('/admin/chapters');
      const chaptersData = response.data.data;
      setChapters(chaptersData);
      // 默认展开所有章节
      setExpandedChapters(new Set(chaptersData.map((c: Chapter) => c.id)));
    } catch (error) {
      console.error('加载章节失败:', error);
      setMessage({ type: 'error', text: '加载章节失败' });
    }
  }, []);

  const loadLessons = useCallback(async (chapterId?: number) => {
    try {
      const response = await api.get('/admin/lessons', {
        params: { chapterId: chapterId || undefined }
      });
      setLessons(response.data.data);
    } catch (error) {
      console.error('加载课时失败:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadChapters();
      await loadLessons();
      setLoading(false);
    };
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadChapters, loadLessons]);

  // 章节操作
  const handleAddChapter = () => {
    setEditMode('chapter');
    setIsNewItem(true);
    setEditingChapter({
      title: '',
      description: '',
      order_index: chapters.length + 1
    });
    setEditingLesson(null);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditMode('chapter');
    setIsNewItem(false);
    setEditingChapter({ ...chapter });
    setEditingLesson(null);
  };

  const handleSaveChapter = async () => {
    if (!editingChapter?.title?.trim()) {
      setMessage({ type: 'error', text: '请输入章节标题' });
      return;
    }

    setSaving(true);
    try {
      if (isNewItem) {
        await api.post('/admin/chapters', editingChapter);
        setMessage({ type: 'success', text: '章节创建成功' });
      } else {
        await api.put(`/admin/chapters/${editingChapter.id}`, editingChapter);
        setMessage({ type: 'success', text: '章节更新成功' });
      }
      setEditMode('none');
      setEditingChapter(null);
      await loadChapters();
    } catch (error) {
      setMessage({ type: 'error', text: isNewItem ? '创建失败' : '更新失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChapter = async (id: number) => {
    if (!confirm('确定要删除这个章节吗？相关课时也会被删除！')) return;

    try {
      await api.delete(`/admin/chapters/${id}`);
      setMessage({ type: 'success', text: '章节删除成功' });
      if (selectedChapterId === id) {
        setSelectedChapterId(null);
      }
      if (editingChapter?.id === id) {
        setEditMode('none');
        setEditingChapter(null);
      }
      await loadChapters();
      await loadLessons();
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // 课时操作
  const handleAddLesson = (chapterId: number) => {
    const chapterLessons = lessons.filter(l => l.chapter_id === chapterId);
    
    setEditMode('lesson');
    setIsNewItem(true);
    setEditingLesson({
      chapter_id: chapterId,
      title: '',
      content: '',
      order_index: chapterLessons.length + 1
    });
    setEditingChapter(null);
    setSelectedChapterId(chapterId);
    
    // 展开该章节
    setExpandedChapters(prev => new Set([...prev, chapterId]));
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditMode('lesson');
    setIsNewItem(false);
    setEditingLesson({ ...lesson });
    setEditingChapter(null);
    setSelectedChapterId(lesson.chapter_id);
  };

  const handleSaveLesson = async () => {
    if (!editingLesson?.title?.trim()) {
      setMessage({ type: 'error', text: '请输入课时标题' });
      return;
    }
    if (!editingLesson?.content?.trim()) {
      setMessage({ type: 'error', text: '请输入课时内容' });
      return;
    }
    if (!editingLesson?.chapter_id) {
      setMessage({ type: 'error', text: '请选择所属章节' });
      return;
    }

    setSaving(true);
    try {
      if (isNewItem) {
        await api.post('/admin/lessons', editingLesson);
        setMessage({ type: 'success', text: '课时创建成功' });
      } else {
        await api.put(`/admin/lessons/${editingLesson.id}`, editingLesson);
        setMessage({ type: 'success', text: '课时更新成功' });
      }
      setEditMode('none');
      setEditingLesson(null);
      await loadLessons();
    } catch (error) {
      setMessage({ type: 'error', text: isNewItem ? '创建失败' : '更新失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (id: number) => {
    if (!confirm('确定要删除这个课时吗？')) return;

    try {
      await api.delete(`/admin/lessons/${id}`);
      setMessage({ type: 'success', text: '课时删除成功' });
      if (editingLesson?.id === id) {
        setEditMode('none');
        setEditingLesson(null);
      }
      await loadLessons();
    } catch (error) {
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditMode('none');
    setEditingChapter(null);
    setEditingLesson(null);
    setIsNewItem(false);
  };

  // 文档上传处理
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await adminAPI.uploadLessonDocument(file);
      if (result.success) {
        setEditingLesson({
          ...editingLesson,
          document_url: result.data.documentUrl,
          document_name: result.data.documentName
        });
        setMessage({ type: 'success', text: '文档上传成功' });
      }
    } catch (error) {
      console.error('文档上传失败:', error);
      setMessage({ type: 'error', text: '文档上传失败' });
    } finally {
      setUploading(false);
      // 清空文件输入，允许重新选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 移除已上传的文档
  const handleRemoveDocument = async () => {
    if (!editingLesson?.document_url) return;

    try {
      // 从URL中提取文件名
      const filename = editingLesson.document_url.split('/').pop();
      if (filename) {
        await adminAPI.deleteLessonDocument(filename);
      }
      setEditingLesson({
        ...editingLesson,
        document_url: undefined,
        document_name: undefined
      });
      setMessage({ type: 'success', text: '文档已移除，请点击"保存修改"' });
    } catch (error) {
      console.error('移除文档失败:', error);
      setMessage({ type: 'error', text: '移除文档失败' });
    }
  };

  // 获取文档图标
  const getDocumentIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <FileImage size={20} />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet size={20} />;
    }
    return <File size={20} />;
  };

  // 切换章节展开
  const toggleChapter = (chapterId: number) => {
    setExpandedChapters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  // 获取章节下的课时
  const getLessonsByChapter = (chapterId: number) => {
    return lessons.filter(l => l.chapter_id === chapterId).sort((a, b) => a.order_index - b.order_index);
  };

  // 统计
  const getTotalLessons = () => lessons.length;

  if (authLoading || loading) {
    return (
      <div className="course-upload-page">
        <div className="loading-container">
          <Loader2 className="spin" size={48} />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="course-upload-page">
        <div className="auth-required">
          <AlertCircle size={64} />
          <h2>需要登录</h2>
          <p>请先登录后再访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="course-upload-page">
      <div className="course-upload-container">
        {/* 头部 */}
        <header className="course-header">
          <div className="header-left">
            <div className="header-title">
              <BookOpen size={28} />
              <div>
                <h1>课程资料管理</h1>
                <p className="header-subtitle">
                  {chapters.length} 个章节 · {getTotalLessons()} 个课时
                </p>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <Link to="/study" className="btn btn-outline" target="_blank">
              <Eye size={18} />
              查看课程学习页面
              <ExternalLink size={14} />
            </Link>
          </div>
        </header>

        {/* 消息提示 */}
        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
            <button className="message-close" onClick={() => setMessage(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* 主内容区 */}
        <div className="course-main">
          {/* 左侧章节列表 */}
          <aside className="chapters-sidebar">
            <div className="sidebar-header">
              <h2>
                <Layers size={20} />
                章节目录
              </h2>
              <button className="btn btn-sm btn-primary" onClick={handleAddChapter}>
                <FolderPlus size={16} />
                新建章节
              </button>
            </div>

            <div className="chapters-list">
              {chapters.length === 0 ? (
                <div className="empty-hint">
                  <BookOpen size={40} />
                  <p>暂无章节</p>
                  <span>点击上方按钮创建第一个章节</span>
                </div>
              ) : (
                chapters.sort((a, b) => a.order_index - b.order_index).map((chapter) => {
                  const chapterLessons = getLessonsByChapter(chapter.id);
                  const isExpanded = expandedChapters.has(chapter.id);
                  const isEditing = editMode === 'chapter' && editingChapter?.id === chapter.id;

                  return (
                    <div 
                      key={chapter.id} 
                      className={`chapter-item ${isExpanded ? 'expanded' : ''} ${isEditing ? 'editing' : ''}`}
                    >
                      <div className="chapter-header" onClick={() => toggleChapter(chapter.id)}>
                        <span className="chapter-expand-icon">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                        <div className="chapter-info">
                          <span className="chapter-order">第 {chapter.order_index} 章</span>
                          <span className="chapter-name">{chapter.title}</span>
                          <span className="chapter-lesson-count">{chapterLessons.length} 课时</span>
                        </div>
                        <div className="chapter-actions" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-icon" 
                            title="添加课时"
                            onClick={() => handleAddLesson(chapter.id)}
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            className="btn-icon" 
                            title="编辑章节"
                            onClick={() => handleEditChapter(chapter)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="btn-icon danger" 
                            title="删除章节"
                            onClick={() => handleDeleteChapter(chapter.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="lessons-list">
                          {chapterLessons.length === 0 ? (
                            <div className="no-lessons">
                              <span>暂无课时</span>
                              <button 
                                className="btn-link"
                                onClick={() => handleAddLesson(chapter.id)}
                              >
                                添加第一个课时
                              </button>
                            </div>
                          ) : (
                            chapterLessons.map((lesson) => {
                              const isLessonEditing = editMode === 'lesson' && editingLesson?.id === lesson.id;
                              return (
                                <div 
                                  key={lesson.id} 
                                  className={`lesson-item ${isLessonEditing ? 'editing' : ''}`}
                                  onClick={() => handleEditLesson(lesson)}
                                >
                                  <span className="lesson-icon">
                                    <FileText size={14} />
                                  </span>
                                  <span className="lesson-order">{lesson.order_index}.</span>
                                  <span className="lesson-name">{lesson.title}</span>
                                  <div className="lesson-actions" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                      className="btn-icon danger" 
                                      title="删除课时"
                                      onClick={() => handleDeleteLesson(lesson.id)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>

          {/* 右侧编辑区 */}
          <main className="edit-panel">
            {editMode === 'none' ? (
              <div className="edit-placeholder">
                <div className="placeholder-icon">
                  <Edit2 size={48} />
                </div>
                <h3>选择或创建内容</h3>
                <p>从左侧选择章节或课时进行编辑，或点击按钮创建新内容</p>
                <div className="placeholder-actions">
                  <button className="btn btn-primary" onClick={handleAddChapter}>
                    <FolderPlus size={18} />
                    新建章节
                  </button>
                  {chapters.length > 0 && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleAddLesson(chapters[0].id)}
                    >
                      <Plus size={18} />
                      新建课时
                    </button>
                  )}
                </div>
              </div>
            ) : editMode === 'chapter' ? (
              <div className="edit-form">
                <div className="form-header">
                  <h3>{isNewItem ? '新建章节' : '编辑章节'}</h3>
                  <button className="btn-icon" onClick={handleCancelEdit}>
                    <X size={20} />
                  </button>
                </div>

                <div className="form-body">
                  <div className="form-group">
                    <label>章节标题 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="请输入章节标题"
                      value={editingChapter?.title || ''}
                      onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>章节描述</label>
                    <textarea
                      className="form-input"
                      placeholder="请输入章节描述（可选）"
                      rows={3}
                      value={editingChapter?.description || ''}
                      onChange={(e) => setEditingChapter({ ...editingChapter, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>排序序号</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={editingChapter?.order_index || 1}
                      onChange={(e) => setEditingChapter({ ...editingChapter, order_index: parseInt(e.target.value) || 1 })}
                    />
                    <p className="form-hint">数字越小排序越靠前</p>
                  </div>
                </div>

                <div className="form-footer">
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>
                    取消
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveChapter}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                    {isNewItem ? '创建章节' : '保存修改'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="edit-form">
                <div className="form-header">
                  <h3>{isNewItem ? '新建课时' : '编辑课时'}</h3>
                  <button className="btn-icon" onClick={handleCancelEdit}>
                    <X size={20} />
                  </button>
                </div>

                <div className="form-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>所属章节 <span className="required">*</span></label>
                      <select
                        className="form-input"
                        value={editingLesson?.chapter_id || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, chapter_id: parseInt(e.target.value) })}
                      >
                        <option value="">请选择章节</option>
                        {chapters.map((c) => (
                          <option key={c.id} value={c.id}>
                            第 {c.order_index} 章 - {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>排序序号</label>
                      <input
                        type="number"
                        className="form-input"
                        min={1}
                        value={editingLesson?.order_index || 1}
                        onChange={(e) => setEditingLesson({ ...editingLesson, order_index: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>课时标题 <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="请输入课时标题"
                      value={editingLesson?.title || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group flex-grow">
                    <label>课时内容 <span className="required">*</span></label>
                    <textarea
                      className="form-input content-input"
                      placeholder="请输入课时内容..."
                      value={editingLesson?.content || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, content: e.target.value })}
                    />
                    <p className="form-hint">支持多段落，每段用换行分隔</p>
                  </div>

                  <div className="form-group">
                    <label>课时文档</label>
                    <div className="document-upload-area">
                      {editingLesson?.document_url ? (
                        <div className="uploaded-document">
                          <div className="document-info">
                            {getDocumentIcon(editingLesson.document_name || '')}
                            <span className="document-name">{editingLesson.document_name}</span>
                          </div>
                          <div className="document-actions">
                            <a 
                              href={editingLesson.document_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn-icon"
                              title="预览文档"
                            >
                              <Eye size={16} />
                            </a>
                            <button 
                              className="btn-icon danger" 
                              onClick={handleRemoveDocument}
                              title="移除文档"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="upload-trigger"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="spin" size={24} />
                              <span>上传中...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={24} />
                              <span>点击上传文档</span>
                              <span className="upload-hint">支持 PDF、Word、PPT、Excel、图片等格式，最大 50MB</span>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                        onChange={handleDocumentUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-footer">
                  <button className="btn btn-secondary" onClick={handleCancelEdit}>
                    取消
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSaveLesson}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
                    {isNewItem ? '创建课时' : '保存修改'}
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CourseUpload;


