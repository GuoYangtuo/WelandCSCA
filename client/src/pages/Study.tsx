import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studyAPI } from '../services/api';
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
  orderIndex: number;
}

const Study: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
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
      alert('加载章节列表失败，请重试');
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
        setError('请先完成基础测试才能查看课时内容');
        if (confirm('您需要先完成基础测试才能查看课时内容，是否前往基础测试页面？')) {
          navigate('/basic-test');
        }
      } else {
        setError('加载课时内容失败，请重试');
      }
      setSelectedLesson(null);
    } finally {
      setLoadingLesson(false);
    }
  };

  const getTotalLessons = () => {
    return chapters.reduce((total, chapter) => total + chapter.lessons.length, 0);
  };

  const getChapterIcon = (index: number) => {
    const icons = ['📖', '📚', '📝', '🎯', '💡', '🔬', '⚗️', '📐'];
    return icons[index % icons.length];
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
            <p>正在加载学习内容...</p>
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <div>
              <h2>学习训练</h2>
              <p className="sidebar-subtitle">{chapters.length} 章节 · {getTotalLessons()} 课时</p>
            </div>
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              {sidebarCollapsed ? (
                <polyline points="9 18 15 12 9 6"/>
              ) : (
                <polyline points="15 18 9 12 15 6"/>
              )}
            </svg>
          </button>
        </div>

        <div className="chapters-container">
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapter.id} className={`chapter-block ${expandedChapters.has(chapter.id) ? 'expanded' : ''}`}>
              <button
                className="chapter-header"
                onClick={() => toggleChapter(chapter.id)}
              >
                <span className="chapter-icon">{getChapterIcon(chapterIndex)}</span>
                <div className="chapter-info">
                  <span className="chapter-title">{chapter.title}</span>
                  <span className="chapter-count">{chapter.lessons.length} 课时</span>
                </div>
                <span className="expand-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
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
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="12" height="12">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={() => navigate('/mock-test')} className="btn btn-sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            开始模拟测试
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
            <p>正在加载课时内容...</p>
          </div>
        ) : error ? (
          <div className="content-state error">
            <div className="state-icon error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="48" height="48">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>无法加载内容</h3>
            <p>{error}</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/basic-test')}
            >
              前往基础测试
            </button>
          </div>
        ) : selectedLesson ? (
          <article className="lesson-article">
            <header className="article-header">
              <div className="article-breadcrumb">
                <span>学习训练</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span>第 {selectedLesson.orderIndex} 课</span>
              </div>
              <h1 className="article-title">{selectedLesson.title}</h1>
              <div className="article-meta">
                <span className="meta-item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                  课时内容
                </span>
              </div>
            </header>
            
            <div className="article-body">
              {selectedLesson.content.split('\n').map((paragraph, index) => (
                paragraph.trim() && <p key={index}>{paragraph}</p>
              ))}
            </div>

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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  上一课
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
                  下一课
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </footer>
          </article>
        ) : (
          <div className="content-state placeholder">
            <div className="placeholder-illustration">
              <svg viewBox="0 0 200 200" width="200" height="200">
                <defs>
                  <linearGradient id="bookGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#667eea"/>
                    <stop offset="100%" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
                <rect x="40" y="30" width="120" height="140" rx="5" fill="url(#bookGrad)" opacity="0.1"/>
                <rect x="50" y="40" width="100" height="120" rx="3" fill="white" stroke="url(#bookGrad)" strokeWidth="2"/>
                <line x1="100" y1="40" x2="100" y2="160" stroke="url(#bookGrad)" strokeWidth="2" strokeDasharray="4"/>
                <path d="M50 100 Q75 90 100 100 Q125 110 150 100" fill="none" stroke="url(#bookGrad)" strokeWidth="2"/>
                <circle cx="100" cy="100" r="30" fill="url(#bookGrad)" opacity="0.1"/>
                <text x="100" y="108" textAnchor="middle" fill="#667eea" fontSize="24">📖</text>
              </svg>
            </div>
            <h3>开始您的学习之旅</h3>
            <p>从左侧选择一个课时，开始学习 CSCA 相关知识</p>
            <div className="quick-tips">
              <div className="tip-item">
                <span className="tip-icon">💡</span>
                <span>点击章节标题可展开或收起课时列表</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📚</span>
                <span>建议按顺序学习，循序渐进</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎯</span>
                <span>学习完成后可以进行模拟测试检验效果</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Study;
