import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { mockTestAPI, testAPI, studyAPI } from '../services/api';
import LatexRenderer from '../components/LatexRenderer';
import '../components/LatexRenderer.css';
import {
  Lock,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckSquare,
  Play,
  RefreshCw,
  BookOpen,
  Trophy,
  Target,
  Sparkles,
  BookMarked,
  Timer,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import './Test.css';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  category?: string;
  difficulty?: string;
}

interface MockTestConfig {
  id: number;
  name: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
}

const MockTest: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [config, setConfig] = useState<MockTestConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number } | null>(null);
  const [basicTestCompleted, setBasicTestCompleted] = useState(false);
  const submittingRef = useRef(false);

  const checkBasicTestStatus = useCallback(async () => {
    try {
      const response = await studyAPI.getBasicTestStatus();
      if (!response.data.completed) {
        setLoading(false);
        return false;
      }
      setBasicTestCompleted(true);
      return true;
    } catch (error) {
      console.error('检查基础测试状态失败:', error);
      setLoading(false);
      return false;
    }
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await mockTestAPI.getConfig();
      const configData = response.data;
      const questionsData = configData.questions.map((q: any) => ({
        ...q,
        options: q.options
      }));
      setConfig({
        ...configData,
        questions: questionsData
      });
      setAnswers(new Array(configData.totalQuestions).fill(-1));
      setTimeLeft(configData.durationMinutes * 60);
    } catch (error) {
      console.error('加载模拟测试配置失败:', error);
      alert(t.mockTest.loadConfigFailed);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    checkBasicTestStatus().then((completed) => {
      if (completed) {
        loadConfig();
      }
    });
  }, [isAuthenticated, isLoading, navigate, checkBasicTestStatus, loadConfig]);

  const submitTest = useCallback(async () => {
    if (submittingRef.current || !config) return;
    try {
      submittingRef.current = true;
      setSubmitting(true);
      const questionIds = config.questions.map(q => q.id);
      const response = await testAPI.submit('mock', answers, questionIds);
      setResult(response.data);
      setStarted(false);
    } catch (error) {
      console.error('提交失败:', error);
      alert(t.mockTest.submitFailed);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [config, answers, t]);

  useEffect(() => {
    if (started && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            submitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started, timeLeft, submitTest]);

  const handleStart = () => {
    setStarted(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (!started || timeLeft === 0) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < (config?.totalQuestions || 0) - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => answers.filter(a => a !== -1).length;
  
  const getDifficultyLabel = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return t.mockTest.difficulty.easy;
      case 'medium': return t.mockTest.difficulty.medium;
      case 'hard': return t.mockTest.difficulty.hard;
      default: return t.mockTest.difficulty.medium;
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
    if (percentage >= 90) return { level: t.mockTest.scoreLevel.excellent, class: 'excellent', icon: Trophy };
    if (percentage >= 80) return { level: t.mockTest.scoreLevel.good, class: 'good', icon: Target };
    if (percentage >= 60) return { level: t.mockTest.scoreLevel.pass, class: 'pass', icon: Sparkles };
    return { level: t.mockTest.scoreLevel.fail, class: 'fail', icon: BookMarked };
  };

  const getTimeClass = () => {
    if (timeLeft <= 60) return 'critical';
    if (timeLeft <= 300) return 'warning';
    return '';
  };

  if (isLoading || loading) {
    return (
      <div className="test-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">{t.mockTest.loading}</p>
        </div>
      </div>
    );
  }

  // 如果未完成基础测试，显示提示
  if (!basicTestCompleted) {
    return (
      <div className="test-page">
        <div className="result-container">
          <div className="result-card locked">
            <div className="locked-icon">
              <Lock size={64} strokeWidth={1.5} />
            </div>
            <h2 className="result-title">{t.mockTest.locked}</h2>
            <p className="result-subtitle">{t.mockTest.needBasicTestFirst}</p>
            
            <div className="unlock-info">
              <div className="unlock-step">
                <div className="step-number completed">1</div>
                <div className="step-content">
                  <h4>{t.mockTest.unlockSteps.register}</h4>
                  <p>{t.mockTest.unlockSteps.completed}</p>
                </div>
                <span className="step-check">
                  <Check size={16} strokeWidth={3} />
                </span>
              </div>
              <div className="step-connector"></div>
              <div className="unlock-step current">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>{t.mockTest.unlockSteps.basicTest}</h4>
                  <p>{t.mockTest.unlockSteps.basicTestDesc}</p>
                </div>
              </div>
              <div className="step-connector"></div>
              <div className="unlock-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>{t.mockTest.unlockSteps.mockTest}</h4>
                  <p>{t.mockTest.unlockSteps.mockTestDesc}</p>
                </div>
              </div>
            </div>

            <div className="result-actions">
              <button
                onClick={() => navigate('/basic-test')}
                className="btn btn-primary btn-glow"
              >
                <CheckSquare size={20} />
                {t.mockTest.goToBasicTest}
              </button>
              <button
                onClick={() => navigate('/')}
                className="btn btn-outline"
              >
                {t.mockTest.backToHome}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="test-page">
        <div className="empty-state">
          <div className="empty-icon">
            <ClipboardList size={48} />
          </div>
          <h3>{t.mockTest.configNotFound}</h3>
          <p>{t.mockTest.tryLater}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">{t.mockTest.backToHome}</button>
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
          <div className="result-card success mock-result">
            <div className="confetti-container">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="confetti" style={{ '--delay': `${i * 0.08}s`, '--x': `${Math.random() * 100}%` } as React.CSSProperties}></div>
              ))}
            </div>
            <h2 className="result-title">{t.mockTest.mockTestCompleted}</h2>
            <p className="result-subtitle">{t.mockTest.completedThisMock}</p>
            
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
                  <span className="detail-label">{t.mockTest.correctCount}</span>
                  <span className="detail-value">{result.score} / {result.total}</span>
                </div>
                <div className="score-detail-item">
                  <span className="detail-label">{t.mockTest.rating}</span>
                  <span className={`detail-value level-${scoreInfo.class}`}>{scoreInfo.level}</span>
                </div>
                <div className="score-detail-item">
                  <span className="detail-label">{t.mockTest.examDuration}</span>
                  <span className="detail-value">{config.durationMinutes} {t.mockTest.minutes}</span>
                </div>
              </div>
            </div>

            <div className="result-tip">
              {result.percentage >= 80 ? (
                <p>{t.mockTest.resultTips.excellent}</p>
              ) : result.percentage >= 60 ? (
                <p>{t.mockTest.resultTips.good}</p>
              ) : (
                <p>{t.mockTest.resultTips.needImprove}</p>
              )}
            </div>

            <div className="result-actions">
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                <RefreshCw size={20} />
                {t.mockTest.retryTest}
              </button>
              <button onClick={() => navigate('/study')} className="btn btn-secondary">
                <BookOpen size={20} />
                {t.mockTest.continueLearning}
              </button>
              <button onClick={() => navigate('/')} className="btn btn-outline">
                {t.mockTest.backToHomeBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="test-page">
        <div className="intro-container">
          <div className="intro-card">
            <div className="intro-header">
              <div className="intro-icon">
                <FileText size={48} strokeWidth={1.5} />
              </div>
              <h2>{config.name}</h2>
              <p className="intro-subtitle">{t.mockTest.cscaMockExam}</p>
            </div>
            
            <div className="intro-info">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <Clock size={24} />
                  </div>
                  <div className="info-content">
                    <span className="info-label">{t.mockTest.examDurationLabel}</span>
                    <span className="info-value">{config.durationMinutes} {t.mockTest.minutes}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">
                    <FileText size={24} />
                  </div>
                  <div className="info-content">
                    <span className="info-label">{t.mockTest.questionCount}</span>
                    <span className="info-value">{config.totalQuestions} {t.mockTest.questionsUnit}</span>
                  </div>
                </div>
              </div>

              <div className="rules-section">
                <h4>{t.mockTest.examRules}</h4>
                <ul className="rules-list">
                  <li>
                    <Timer size={16} className="rule-icon" />
                    <span>{t.mockTest.rules.timer}</span>
                  </li>
                  <li>
                    <FileText size={16} className="rule-icon" />
                    <span>{t.mockTest.rules.switch}</span>
                  </li>
                  <li>
                    <AlertTriangle size={16} className="rule-icon" />
                    <span>{t.mockTest.rules.warning}</span>
                  </li>
                  <li>
                    <Target size={16} className="rule-icon" />
                    <span>{t.mockTest.rules.standard}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="intro-actions">
              <button onClick={handleStart} className="btn btn-primary btn-large btn-glow">
                <Play size={24} />
                {t.mockTest.startExam}
              </button>
              <button onClick={() => navigate('/study')} className="btn btn-outline">
                {t.mockTest.backToStudy}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = config.questions[currentIndex];
  const progress = ((currentIndex + 1) / config.totalQuestions) * 100;

  return (
    <div className="test-page mock-mode">
      <div className="test-wrapper">
        {/* 测试头部 */}
        <header className="test-header mock-header">
          <div className="header-left">
            <div className="test-type-badge mock">
              <FileText size={18} />
              <span>{t.mockTest.mockTestBadge}</span>
            </div>
            <div className="progress-info">
              <span className="progress-text">{t.mockTest.question} {currentIndex + 1} / {t.mockTest.total} {config.totalQuestions} {t.mockTest.question}</span>
              <span className="answered-text">{t.mockTest.answered} {getAnsweredCount()} {t.mockTest.question}</span>
            </div>
          </div>
          
          <div className={`timer-display ${getTimeClass()}`}>
            <div className="timer-icon">
              <Clock size={20} />
            </div>
            <div className="timer-content">
              <span className="timer-label">{t.mockTest.remainingTime}</span>
              <span className="timer-value">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </header>

        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}>
              <div className="progress-glow"></div>
            </div>
          </div>
          <div className="progress-percentage">{Math.round(progress)}%</div>
        </div>

        {/* 题目卡片 */}
        <main className="question-main">
          <div className="question-card" key={currentIndex}>
            <div className="question-meta">
              <span className="question-category">
                <BookOpen size={14} />
                {currentQuestion.category || t.mockTest.comprehensive}
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
                  className={`option-item ${answers[currentIndex] === index ? 'selected' : ''} ${timeLeft === 0 ? 'disabled' : ''}`}
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
                    disabled={timeLeft === 0}
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
            disabled={currentIndex === 0 || timeLeft === 0}
            className="btn btn-nav btn-prev"
          >
            <ChevronLeft size={20} />
            {t.mockTest.prevQuestion}
          </button>
          
          <div className="question-nav-dots">
            {config.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                disabled={timeLeft === 0}
                className={`nav-dot ${answers[index] !== -1 ? 'answered' : ''} ${
                  index === currentIndex ? 'active' : ''
                }`}
                title={`${t.mockTest.question} ${index + 1}${answers[index] !== -1 ? ` (${t.mockTest.answered})` : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          
          {currentIndex === config.totalQuestions - 1 ? (
            <button
              onClick={submitTest}
              disabled={submitting || timeLeft === 0}
              className="btn btn-nav btn-submit"
            >
              {submitting ? (
                <>
                  <span className="btn-spinner"></span>
                  {t.mockTest.submitting}
                </>
              ) : (
                <>
                  {t.mockTest.submitAnswer}
                  <CheckSquare size={20} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={timeLeft === 0}
              className="btn btn-nav btn-next"
            >
              {t.mockTest.nextQuestion}
              <ChevronRight size={20} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default MockTest;
