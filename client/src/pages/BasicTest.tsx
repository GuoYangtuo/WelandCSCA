import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { questionAPI, testAPI, studyAPI } from '../services/api';
import LatexRenderer from '../components/LatexRenderer';
import '../components/LatexRenderer.css';
import {
  CheckSquare,
  BookOpen,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Target,
  Sparkles,
  BookMarked
} from 'lucide-react';
import './Test.css';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  category?: string;
  difficulty?: string;
}

const BasicTest: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [completedResult, setCompletedResult] = useState<{ score: number; totalQuestions: number; percentage: number; createdAt: string } | null>(null);

  const checkBasicTestStatus = useCallback(async () => {
    try {
      const response = await studyAPI.getBasicTestStatus();
      if (response.data.completed) {
        setCompletedResult({
          score: response.data.score,
          totalQuestions: response.data.totalQuestions,
          percentage: response.data.percentage,
          createdAt: response.data.createdAt
        });
        setLoading(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('检查基础测试状态失败:', error);
      return false;
    }
  }, []);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getAll({ limit: 10 });
      console.log(response.data);
      const questionsData = response.data.map((q: any) => ({
        ...q,
        options: q.options
      }));
      setQuestions(questionsData);
      setAnswers(new Array(questionsData.length).fill(-1));
    } catch (error) {
      console.error('加载题目失败:', error);
      alert('加载题目失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    checkBasicTestStatus().then((completed) => {
      if (!completed) {
        loadQuestions();
      }
    });
  }, [isAuthenticated, isLoading, navigate, checkBasicTestStatus, loadQuestions]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === -1)) {
      if (!confirm('还有未作答的题目，确定要提交吗？')) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const questionIds = questions.map(q => q.id);
      const response = await testAPI.submit('basic', answers, questionIds);
      setResult(response.data);
    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => answers.filter(a => a !== -1).length;
  
  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '中等';
    }
  };

  const getDifficultyClass = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'difficulty-medium';
    }
  };

  const getScoreLevel = (percentage: number) => {
    if (percentage >= 90) return { level: '优秀', class: 'excellent', icon: Trophy };
    if (percentage >= 80) return { level: '良好', class: 'good', icon: Target };
    if (percentage >= 60) return { level: '及格', class: 'pass', icon: Sparkles };
    return { level: '需加强', class: 'fail', icon: BookMarked };
  };

  if (isLoading || loading) {
    return (
      <div className="test-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">正在加载题目...</p>
        </div>
      </div>
    );
  }

  // 如果已完成基础测试，显示成绩
  if (completedResult) {
    const date = new Date(completedResult.createdAt);
    const scoreInfo = getScoreLevel(completedResult.percentage);
    const ScoreIcon = scoreInfo.icon;
    return (
      <div className="test-page">
        <div className="result-container">
          <div className="result-card completed">
            <div className="result-badge">
              <span className="badge-icon">
                <Check size={16} strokeWidth={3} />
              </span>
              <span>已完成</span>
            </div>
            <h2 className="result-title">基础测试成绩</h2>
            <p className="result-subtitle">您已完成基础测试，现在可以开始学习训练了</p>
            
            <div className="score-display">
              <div className="score-ring" style={{ '--score-percent': `${completedResult.percentage}%` } as React.CSSProperties}>
                <div className="score-inner">
                  <span className="score-emoji">
                    <ScoreIcon size={28} />
                  </span>
                  <span className="score-value">{completedResult.percentage}</span>
                  <span className="score-unit">%</span>
                </div>
              </div>
              <div className="score-details">
                <div className="score-detail-item">
                  <span className="detail-label">正确题数</span>
                  <span className="detail-value">{completedResult.score} / {completedResult.totalQuestions}</span>
                </div>
                <div className="score-detail-item">
                  <span className="detail-label">评定等级</span>
                  <span className={`detail-value level-${scoreInfo.class}`}>{scoreInfo.level}</span>
                </div>
                <div className="score-detail-item">
                  <span className="detail-label">完成时间</span>
                  <span className="detail-value">{date.toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>

            <div className="result-actions">
              <button onClick={() => navigate('/study')} className="btn btn-primary btn-glow">
                <BookOpen size={20} />
                开始学习训练
              </button>
              <button onClick={() => navigate('/mock-test')} className="btn btn-secondary">
                <FileText size={20} />
                模拟测试
              </button>
              <button onClick={() => navigate('/')} className="btn btn-outline">
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    const scoreInfo = getScoreLevel(result.percentage);
    const ScoreIcon = scoreInfo.icon;
    return (
      <div className="test-page">
        <div className="result-container">
          <div className="result-card success">
            <div className="confetti-container">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="confetti" style={{ '--delay': `${i * 0.1}s`, '--x': `${Math.random() * 100}%` } as React.CSSProperties}></div>
              ))}
            </div>
            <h2 className="result-title">🎉 测试完成！</h2>
            <p className="result-subtitle">恭喜您完成了基础测试</p>
            
            <div className="score-display">
              <div className="score-ring animate" style={{ '--score-percent': `${result.percentage}%` } as React.CSSProperties}>
                <div className="score-inner">
                  <span className="score-emoji">
                    <ScoreIcon size={28} />
                  </span>
                  <span className="score-value">{result.percentage}</span>
                  <span className="score-unit">%</span>
                </div>
              </div>
              <div className="score-details">
                <div className="score-detail-item">
                  <span className="detail-label">正确题数</span>
                  <span className="detail-value">{result.score} / {result.total}</span>
                </div>
                <div className="score-detail-item">
                  <span className="detail-label">评定等级</span>
                  <span className={`detail-value level-${scoreInfo.class}`}>{scoreInfo.level}</span>
                </div>
              </div>
            </div>

            <div className="result-tip">
              {result.percentage >= 80 ? (
                <p>🌟 表现优异！您已经具备了良好的基础，可以开始学习训练提升更多知识。</p>
              ) : result.percentage >= 60 ? (
                <p>💡 不错的开始！建议通过学习训练巩固薄弱环节。</p>
              ) : (
                <p>📖 还需要加油！建议认真完成学习训练，打好基础。</p>
              )}
            </div>

            <div className="result-actions">
              <button onClick={() => navigate('/study')} className="btn btn-primary btn-glow">
                <BookOpen size={20} />
                开始学习训练
              </button>
              <button onClick={() => navigate('/')} className="btn btn-outline">
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="test-page">
        <div className="empty-state">
          <div className="empty-icon">
            <FileText size={48} />
          </div>
          <h3>暂无题目</h3>
          <p>题库正在建设中，请稍后再来</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">返回首页</button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="test-page">
      <div className="test-wrapper">
        {/* 测试头部 */}
        <header className="test-header">
          <div className="header-left">
            <div className="test-type-badge">
              <CheckSquare size={18} />
              <span>基础测试</span>
            </div>
            <div className="progress-info">
              <span className="progress-text">第 {currentIndex + 1} 题 / 共 {questions.length} 题</span>
              <span className="answered-text">已答 {getAnsweredCount()} 题</span>
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}>
                <div className="progress-glow"></div>
              </div>
            </div>
            <div className="progress-percentage">{Math.round(progress)}%</div>
          </div>
        </header>

        {/* 题目卡片 */}
        <main className="question-main">
          <div className="question-card" key={currentIndex}>
            <div className="question-meta">
              <span className="question-category">
                <BookOpen size={14} />
                {currentQuestion.category || '综合'}
              </span>
              <span className={`question-difficulty ${getDifficultyClass(currentQuestion.difficulty)}`}>
                {getDifficultyLabel(currentQuestion.difficulty)}
              </span>
            </div>
            
            <div className="question-number">Q{currentIndex + 1}</div>
            <h3 className="question-text">
              <LatexRenderer>{currentQuestion.question_text}</LatexRenderer>
            </h3>
            
            <div className="options-container">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`option-item ${answers[currentIndex] === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(index)}
                >
                  <span className="option-indicator">
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="option-check">
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </span>
                  <span className="option-content">
                    <LatexRenderer>{option}</LatexRenderer>
                  </span>
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={answers[currentIndex] === index}
                    onChange={() => handleAnswerSelect(index)}
                    className="option-radio"
                  />
                </label>
              ))}
            </div>
          </div>
        </main>

        {/* 底部导航 */}
        <footer className="test-footer">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="btn btn-nav btn-prev"
          >
            <ChevronLeft size={20} />
            上一题
          </button>
          
          <div className="question-nav-dots">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`nav-dot ${answers[index] !== -1 ? 'answered' : ''} ${
                  index === currentIndex ? 'active' : ''
                }`}
                title={`第 ${index + 1} 题${answers[index] !== -1 ? ' (已答)' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {currentIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-nav btn-submit"
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  提交中...
                </>
              ) : (
                <>
                  提交答案
                  <CheckSquare size={20} />
                </>
              )}
            </button>
          ) : (
            <button onClick={handleNext} className="btn btn-nav btn-next">
              下一题
              <ChevronRight size={20} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default BasicTest;






