import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { studyAPI } from '../services/api';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  AlertCircle,
  FileText,
  BookMarked,
  FlaskConical,
  Target,
  Lightbulb,
  GraduationCap,
  Compass,
  PenTool,
  Download,
  File,
  FileImage,
  FileSpreadsheet,
  ExternalLink
} from 'lucide-react';
import './Study.css';

interface Lesson {
  id: number;
  title: string;
  orderIndex: number;
}

interface Chapter {
  id: number;
  title: string;
  description: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface LessonContent {
  id: number;
  chapterId: number;
  title: string;
  content: string;
  documentUrl?: string;
  documentName?: string;
  orderIndex: number;
}

const Study: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadChapters();
  }, [isAuthenticated, isLoading, navigate]);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const response = await studyAPI.getChapters();
      setChapters(response.data);
      // 默认展开所有章节
      if (response.data.length > 0) {
        setExpandedChapters(new Set(response.data.map((c: Chapter) => c.id)));
      }
    } catch (error) {
      console.error('加载章节列表失败:', error);
      alert(t.study.loadChaptersFailed);
    } finally {
      setLoading(false);
    }
  };

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleLessonClick = async (lessonId: number) => {
    try {
      setLoadingLesson(true);
      setError(null);
      const response = await studyAPI.getLesson(lessonId);
      setSelectedLesson(response.data);
    } catch (error: any) {
      console.error('加载课时内容失败:', error);
      if (error.response?.status === 403 && error.response?.data?.requiresBasicTest) {
        setError(t.study.needBasicTest);
        if (confirm(t.study.confirmGoBasicTest)) {
          navigate('/basic-test');
        }
      } else {
        setError(t.study.loadLessonFailed);
      }
      setSelectedLesson(null);
    } finally {
      setLoadingLesson(false);
    }
  };

  const getTotalLessons = () => {
    return chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  };

  const chapterIcons = [BookMarked, FlaskConical, PenTool, Target, Lightbulb, GraduationCap, Compass, BookOpen];
  
  const getChapterIcon = (index: number) => {
    return chapterIcons[index % chapterIcons.length];
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
    if (['pdf'].includes(ext || '')) {
      return <FileText size={20} />;
    }
    return <File size={20} />;
  };

  // 判断是否是图片类型
  const isImageFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
  };

  // 判断是否是PDF
  const isPdfFile = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'pdf';
  };

  if (isLoading || loading) {
    return (
      <div className="study-page">
        <div className="study-loading">
          <div className="loading-animation">
            <div className="book-loader">
              <div className="book">
                <div className="book-page"></div>
                <div className="book-page"></div>
                <div className="book-page"></div>
              </div>
            </div>
            <p>{t.study.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="study-page">
      {/* 侧边栏 */}
      <aside className={`study-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-group">
            <BookOpen size={24} />
            <div>
              <h2>{t.study.title}</h2>
              <p className="sidebar-subtitle">{chapters.length} {t.study.chapters} · {getTotalLessons()} {t.study.lessons}</p>
            </div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? t.study.expandSidebar : t.study.collapseSidebar}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <div className="chapters-container">
          {chapters.map((chapter, chapterIndex) => {
            const ChapterIcon = getChapterIcon(chapterIndex);
            return (
              <div key={chapter.id} className={`chapter-block ${expandedChapters.has(chapter.id) ? 'expanded' : ''}`}>
                <button
                  className="chapter-header"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <span className="chapter-icon">
                    <ChapterIcon size={18} />
                  </span>
                  <div className="chapter-info">
                    <span className="chapter-title">{chapter.title}</span>
                    <span className="chapter-count">{chapter.lessons.length} {t.study.lessons}</span>
                  </div>
                  <span className="expand-arrow">
                    <ChevronDown size={16} />
                  </span>
                </button>
                
                <div className="lessons-container">
                  <div className="lessons-inner">
                    {chapter.lessons.map((lesson, lessonIndex) => (
                      <button
                        key={lesson.id}
                        className={`lesson-item ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                        onClick={() => handleLessonClick(lesson.id)}
                      >
                        <span className="lesson-number">{lessonIndex + 1}</span>
                        <span className="lesson-title">{lesson.title}</span>
                        {selectedLesson?.id === lesson.id && (
                          <span className="lesson-active-indicator">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/mock-test')} className="btn btn-sidebar">
            <FileText size={18} />
            {t.study.startMockTest}
          </button>
        </div>
      </aside>

      {/* 内容区域 */}
      <main className="study-content">
        {loadingLesson ? (
          <div className="content-state loading">
            <div className="state-animation">
              <div className="pulse-loader"></div>
            </div>
            <p>{t.study.loadingLesson}</p>
          </div>
        ) : error ? (
          <div className="content-state error">
            <div className="state-icon error-icon">
              <AlertCircle size={48} />
            </div>
            <h3>{t.study.unableToLoad}</h3>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/basic-test')}
            >
              {t.study.goToBasicTest}
            </button>
          </div>
        ) : selectedLesson ? (
          <article className="lesson-article">
            <header className="article-header">
              <div className="article-breadcrumb">
                <span>{t.study.title}</span>
                <ChevronRight size={14} />
                <span>{t.study.lesson} {selectedLesson.orderIndex}</span>
              </div>
              <h1 className="article-title">{selectedLesson.title}</h1>
              <div className="article-meta">
                <span className="meta-item">
                  <BookOpen size={14} />
                  {t.study.lessonContent}
                </span>
              </div>
            </header>
            
            <div className="article-body">
              {selectedLesson.content.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* 课时文档展示 */}
            {selectedLesson.documentUrl && selectedLesson.documentName && (
              <div className="lesson-document-section">
                <h3 className="document-section-title">
                  <FileText size={20} />
                  {t.study.lessonDocument || '课时文档'}
                </h3>
                <div className="document-content">
                  {isImageFile(selectedLesson.documentName) ? (
                    <div className="document-preview image-preview">
                      <img 
                        src={selectedLesson.documentUrl} 
                        alt={selectedLesson.documentName}
                        onClick={() => window.open(selectedLesson.documentUrl, '_blank')}
                      />
                    </div>
                  ) : isPdfFile(selectedLesson.documentName) ? (
                    <div className="document-preview pdf-preview">
                      <iframe
                        src={selectedLesson.documentUrl}
                        title={selectedLesson.documentName}
                      />
                    </div>
                  ) : null}
                  
                  <div className="document-download-card">
                    <div className="document-info">
                      {getDocumentIcon(selectedLesson.documentName)}
                      <span className="document-name">{selectedLesson.documentName}</span>
                    </div>
                    <div className="document-actions">
                      <a 
                        href={selectedLesson.documentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        <ExternalLink size={16} />
                        {t.study.viewDocument || '在线查看'}
                      </a>
                      <a 
                        href={selectedLesson.documentUrl} 
                        download={selectedLesson.documentName}
                        className="btn btn-primary btn-sm"
                      >
                        <Download size={16} />
                        {t.study.downloadDocument || '下载文档'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <footer className="article-footer">
              <div className="footer-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    const currentChapter = chapters.find(c => c.id === selectedLesson.chapterId);
                    if (currentChapter) {
                      const currentLessonIndex = currentChapter.lessons.findIndex(l => l.id === selectedLesson.id);
                      if (currentLessonIndex > 0) {
                        handleLessonClick(currentChapter.lessons[currentLessonIndex - 1].id);
                      }
                    }
                  }}
                >
                  <ChevronLeft size={18} />
                  {t.study.prevLesson}
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const currentChapter = chapters.find(c => c.id === selectedLesson.chapterId);
                    if (currentChapter) {
                      const currentLessonIndex = currentChapter.lessons.findIndex(l => l.id === selectedLesson.id);
                      if (currentLessonIndex < currentChapter.lessons.length - 1) {
                        handleLessonClick(currentChapter.lessons[currentLessonIndex + 1].id);
                      }
                    }
                  }}
                >
                  {t.study.nextLesson}
                  <ChevronRight size={18} />
                </button>
              </div>
            </footer>
          </article>
        ) : (
          <div className="content-state placeholder">
            <div className="placeholder-illustration">
              <div className="illustration-wrapper">
                <BookOpen size={64} strokeWidth={1} className="illustration-icon" />
                <div className="illustration-glow"></div>
              </div>
            </div>
            <h3>{t.study.startLearning}</h3>
            <p>{t.study.selectLessonHint}</p>
            <div className="quick-tips">
              <div className="tip-item">
                <Lightbulb size={18} className="tip-icon" />
                <span>{t.study.tips.expandCollapse}</span>
              </div>
              <div className="tip-item">
                <BookMarked size={18} className="tip-icon" />
                <span>{t.study.tips.sequential}</span>
              </div>
              <div className="tip-item">
                <Target size={18} className="tip-icon" />
                <span>{t.study.tips.testAfterStudy}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Study;
