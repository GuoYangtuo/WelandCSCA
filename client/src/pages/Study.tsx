import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  PenTool
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

  const chapterIcons = [BookMarked, FlaskConical, PenTool, Target, Lightbulb, GraduationCap, Compass, BookOpen];
  
  const getChapterIcon = (index: number) => {
    return chapterIcons[index % chapterIcons.length];
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
            <BookOpen size={24} />
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
                    <span className="chapter-count">{chapter.lessons.length} 课时</span>
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
              <AlertCircle size={48} />
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
                <ChevronRight size={14} />
                <span>第 {selectedLesson.orderIndex} 课</span>
              </div>
              <h1 className="article-title">{selectedLesson.title}</h1>
              <div className="article-meta">
                <span className="meta-item">
                  <BookOpen size={14} />
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
                  <ChevronLeft size={18} />
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
            <h3>开始您的学习之旅</h3>
            <p>从左侧选择一个课时，开始学习 CSCA 相关知识</p>
            <div className="quick-tips">
              <div className="tip-item">
                <Lightbulb size={18} className="tip-icon" />
                <span>点击章节标题可展开或收起课时列表</span>
              </div>
              <div className="tip-item">
                <BookMarked size={18} className="tip-icon" />
                <span>建议按顺序学习，循序渐进</span>
              </div>
              <div className="tip-item">
                <Target size={18} className="tip-icon" />
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
