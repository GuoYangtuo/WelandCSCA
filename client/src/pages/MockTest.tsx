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
  ClipboardList,
  Beaker,
  Calculator,
  Zap,
  BookA,
  GraduationCap,
  ArrowLeft,
  Settings,
  BarChart3
} from 'lucide-react';
import './Test.css';
import { MOCK_TEST_SUBJECTS, DIFFICULTY_LEVELS, SUBJECT_QUESTION_CONFIGS } from './MockTest/constants';

interface Question {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  category?: string;
  difficulty?: string;
  knowledge_point?: string;
  image_url?: string;
}

interface MockTestConfig {
  subject: string;
  name: string;
  durationMinutes: number;
  totalQuestions: number;
  difficultyLevel: string;
  questions: Question[];
}

// 科目图标映射
const getSubjectIcon = (subjectKey: string) => {
  switch (subjectKey) {
    case '文科中文': return BookA;
    case '理科中文': return GraduationCap;
    case '数学': return Calculator;
    case '物理': return Zap;
    case '化学': return Beaker;
    default: return FileText;
  }
};

// ========== 调试开关 ==========
// 设置为 true 显示调试按钮，false 隐藏
const DEBUG_MODE = true;
// ==============================

const MockTest: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // 页面状态
  const [pageState, setPageState] = useState<'select' | 'intro' | 'testing' | 'result'>('select');
  
  // 科目选择状态
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  
  // 测试状态
  const [config, setConfig] = useState<MockTestConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id?: number; score: number; total: number; percentage: number } | null>(null);
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
        setLoading(false);
      }
    });
  }, [isAuthenticated, isLoading, navigate, checkBasicTestStatus]);

  // 生成模拟测试
  const generateTest = async () => {
    if (!selectedSubject) return;
    
    try {
      setGenerating(true);
      const response = await mockTestAPI.generateTest(selectedSubject, selectedDifficulty);
      const configData = response.data;
      
      // 处理题目选项
      const questionsData = configData.questions.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
      }));
      
      setConfig({
        ...configData,
        questions: questionsData
      });
      setAnswers(new Array(configData.totalQuestions).fill(-1));
      setTimeLeft(configData.durationMinutes * 60);
      setPageState('intro');
    } catch (error) {
      console.error('生成模拟测试失败:', error);
      alert(t.mockTest?.generateFailed || '生成模拟测试失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const submitTest = useCallback(async () => {
    if (submittingRef.current || !config) return;
    try {
      submittingRef.current = true;
      setSubmitting(true);
      const questionIds = config.questions.map(q => q.id);
      const response = await testAPI.submit('mock', answers, questionIds, {
        subject: config.subject,
        difficultyLevel: config.difficultyLevel,
        durationMinutes: config.durationMinutes
      });
      setResult(response.data);
      setPageState('result');
    } catch (error) {
      console.error('提交失败:', error);
      alert(t.mockTest.submitFailed);
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }, [config, answers, t]);

  useEffect(() => {
    if (pageState === 'testing' && timeLeft > 0) {
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
  }, [pageState, timeLeft, submitTest]);

  const handleStartTest = () => {
    setPageState('testing');
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (pageState !== 'testing' || timeLeft === 0) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = answerIndex;
    setAnswers(newAnswers);
    
    // 自动跳到下一题（如果不是最后一题）
    if (currentIndex < (config?.totalQuestions || 0) - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 300); // 延迟300ms，让用户看到选中效果
    }
  };

  // 调试：一键随机答完所有题目并提交
  const handleDebugAutoComplete = async () => {
    if (!config || pageState !== 'testing') return;
    
    // 随机生成所有答案
    const randomAnswers = config.questions.map(() => Math.floor(Math.random() * 4));
    setAnswers(randomAnswers);
    
    // 延迟后自动提交
    setTimeout(() => {
      submitTest();
    }, 500);
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

  const handleBackToSelect = () => {
    setPageState('select');
    setConfig(null);
    setCurrentIndex(0);
    setAnswers([]);
    setTimeLeft(0);
    setResult(null);
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
      case 'easy': return t.mockTest?.difficulty?.easy || '简单';
      case 'medium': return t.mockTest?.difficulty?.medium || '中等';
      case 'hard': return t.mockTest?.difficulty?.hard || '困难';
      default: return t.mockTest?.difficulty?.medium || '中等';
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

  // 获取科目的中文/国际化名称
  const getSubjectLabel = (subjectKey: string) => {
    const labelMap: Record<string, string> = {
      '文科中文': t.mockTest?.subjects?.artsChinese || '文科中文',
      '理科中文': t.mockTest?.subjects?.scienceChinese || '理科中文',
      '数学': t.mockTest?.subjects?.math || '数学',
      '物理': t.mockTest?.subjects?.physics || '物理',
      '化学': t.mockTest?.subjects?.chemistry || '化学',
    };
    return labelMap[subjectKey] || subjectKey;
  };

  // 获取难度的国际化名称
  const getDifficultyLevelLabel = (levelKey: string) => {
    const labelMap: Record<string, string> = {
      'easy': t.mockTest?.difficultyLevel?.easy || '简单模式',
      'medium': t.mockTest?.difficultyLevel?.medium || '中等模式',
      'hard': t.mockTest?.difficultyLevel?.hard || '困难模式',
    };
    return labelMap[levelKey] || levelKey;
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

  // 科目选择页面
  if (pageState === 'select') {
    return (
      <div className="test-page">
        <div className="subject-select-container">
          <div className="subject-select-header">
            <h1>{t.mockTest?.selectSubject || '选择考试科目'}</h1>
            <p>{t.mockTest?.selectSubjectDesc || '选择您要进行模拟测试的科目'}</p>
          </div>

          {/* 科目卡片 */}
          <div className="subject-cards-grid">
            {MOCK_TEST_SUBJECTS.map((subject) => {
              const SubjectIcon = getSubjectIcon(subject.key);
              const subjectConfig = SUBJECT_QUESTION_CONFIGS[subject.key];
              const totalQuestions = subjectConfig 
                ? subjectConfig.knowledgePoints.length * subjectConfig.defaultQuestionsPerPoint 
                : 0;
              
              return (
                <div
                  key={subject.key}
                  className={`subject-card ${selectedSubject === subject.key ? 'selected' : ''}`}
                  onClick={() => setSelectedSubject(subject.key)}
                  style={{ '--subject-color': subject.color } as React.CSSProperties}
                >
                  <div className="subject-card-icon" style={{ backgroundColor: subject.color + '20', color: subject.color }}>
                    <SubjectIcon size={32} />
                  </div>
                  <div className="subject-card-content">
                    <h3>{getSubjectLabel(subject.key)}</h3>
                    <div className="subject-card-stats">
                      <span className="stat-item">
                        <Clock size={14} />
                        {subject.durationMinutes} {t.mockTest?.minutes || '分钟'}
                      </span>
                      <span className="stat-item">
                        <FileText size={14} />
                        {totalQuestions} {t.mockTest?.questionsUnit || '题'}
                      </span>
                      <span className="stat-item">
                        <BarChart3 size={14} />
                        {subjectConfig?.knowledgePoints.length || 0} {t.mockTest?.knowledgePoints || '知识点'}
                      </span>
                    </div>
                  </div>
                  {selectedSubject === subject.key && (
                    <div className="subject-card-check">
                      <Check size={20} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 难度选择 */}
          <div className="difficulty-section">
            <h3>
              <Settings size={20} />
              {t.mockTest?.selectDifficulty || '选择难度模式'}
            </h3>
            <div className="difficulty-options">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.key}
                  className={`difficulty-option ${selectedDifficulty === level.key ? 'selected' : ''}`}
                  onClick={() => setSelectedDifficulty(level.key)}
                >
                  <div className="difficulty-option-header">
                    <span className={`difficulty-badge ${level.key}`}>
                      {getDifficultyLevelLabel(level.key)}
                    </span>
                  </div>
                  <div className="difficulty-option-ratios">
                    <div className="ratio-bar">
                      <div className="ratio-segment easy" style={{ width: `${level.easyRatio * 100}%` }}></div>
                      <div className="ratio-segment medium" style={{ width: `${level.mediumRatio * 100}%` }}></div>
                      <div className="ratio-segment hard" style={{ width: `${level.hardRatio * 100}%` }}></div>
                    </div>
                    <div className="ratio-labels">
                      <span className="easy">{t.mockTest?.difficulty?.easy || '简单'} {Math.round(level.easyRatio * 100)}%</span>
                      <span className="medium">{t.mockTest?.difficulty?.medium || '中等'} {Math.round(level.mediumRatio * 100)}%</span>
                      <span className="hard">{t.mockTest?.difficulty?.hard || '困难'} {Math.round(level.hardRatio * 100)}%</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 开始按钮 */}
          <div className="subject-select-actions">
            <button
              onClick={generateTest}
              disabled={!selectedSubject || generating}
              className="btn btn-primary btn-large btn-glow"
            >
              {generating ? (
                <>
                  <span className="btn-spinner"></span>
                  {t.mockTest?.generating || '正在生成试卷...'}
                </>
              ) : (
                <>
                  <Play size={24} />
                  {t.mockTest?.generateTest || '生成试卷'}
                </>
              )}
            </button>
            <button onClick={() => navigate('/study')} className="btn btn-outline">
              {t.mockTest?.backToStudy || '返回学习'}
            </button>
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

  // 结果页面
  if (pageState === 'result' && result) {
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
            <p className="result-subtitle">
              {getSubjectLabel(config.subject)} - {t.mockTest?.completedThisMock || '您已完成本次模拟考试'}
            </p>
            
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
                <div className="score-detail-item">
                  <span className="detail-label">{t.mockTest?.difficultyMode || '难度模式'}</span>
                  <span className="detail-value">{getDifficultyLevelLabel(config.difficultyLevel)}</span>
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
              {result.id && (
                <button onClick={() => navigate(`/exam-analysis/${result.id}`)} className="btn btn-primary btn-glow">
                  <BarChart3 size={20} />
                  {t.mockTest?.viewAnalysis || '查看考试分析'}
                </button>
              )}
              <button onClick={handleBackToSelect} className="btn btn-secondary">
                <RefreshCw size={20} />
                {t.mockTest?.selectOtherSubject || '选择其他科目'}
              </button>
              <button onClick={() => navigate('/study')} className="btn btn-outline">
                <BookOpen size={20} />
                {t.mockTest.continueLearning}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 考前介绍页面
  if (pageState === 'intro') {
    const SubjectIcon = getSubjectIcon(config.subject);
    const subjectConfig = SUBJECT_QUESTION_CONFIGS[config.subject];
    
    return (
      <div className="test-page">
        <div className="intro-container">
          <div className="intro-card">
            <button className="back-to-select" onClick={handleBackToSelect}>
              <ArrowLeft size={20} />
              {t.mockTest?.changeSubject || '更换科目'}
            </button>
            
            <div className="intro-header">
              <div className="intro-icon" style={{ backgroundColor: MOCK_TEST_SUBJECTS.find(s => s.key === config.subject)?.color + '20' }}>
                <SubjectIcon size={48} strokeWidth={1.5} style={{ color: MOCK_TEST_SUBJECTS.find(s => s.key === config.subject)?.color }} />
              </div>
              <h2>{getSubjectLabel(config.subject)}</h2>
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
                <div className="info-card">
                  <div className="info-icon">
                    <Settings size={24} />
                  </div>
                  <div className="info-content">
                    <span className="info-label">{t.mockTest?.difficultyMode || '难度模式'}</span>
                    <span className="info-value">{getDifficultyLevelLabel(config.difficultyLevel)}</span>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">
                    <BarChart3 size={24} />
                  </div>
                  <div className="info-content">
                    <span className="info-label">{t.mockTest?.knowledgePointsCovered || '覆盖知识点'}</span>
                    <span className="info-value">{subjectConfig?.knowledgePoints.length || 0} {t.mockTest?.knowledgePoints || '个'}</span>
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
              <button onClick={handleStartTest} className="btn btn-primary btn-large btn-glow">
                <Play size={24} />
                {t.mockTest.startExam}
              </button>
              <button onClick={handleBackToSelect} className="btn btn-outline">
                {t.mockTest?.changeSubject || '更换科目'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 测试页面
  const currentQuestion = config.questions[currentIndex];
  const progress = ((currentIndex + 1) / config.totalQuestions) * 100;
  const SubjectIcon = getSubjectIcon(config.subject);

  return (
    <div className="test-page mock-mode">
      <div className="test-wrapper">
        {/* 测试头部 */}
        <header className="test-header mock-header">
          <div className="header-left">
            <div className="test-type-badge mock" style={{ backgroundColor: MOCK_TEST_SUBJECTS.find(s => s.key === config.subject)?.color + '20' }}>
              <SubjectIcon size={18} style={{ color: MOCK_TEST_SUBJECTS.find(s => s.key === config.subject)?.color }} />
              <span>{getSubjectLabel(config.subject)}</span>
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
                {currentQuestion.knowledge_point || currentQuestion.category || t.mockTest.comprehensive}
              </span>
              <span className={`question-difficulty ${getDifficultyClass(currentQuestion.difficulty)}`}>
                {getDifficultyLabel(currentQuestion.difficulty)}
              </span>
            </div>
            
            <div className="question-number">Q{currentIndex + 1}</div>
            <h3 className="question-text">
              <LatexRenderer>{currentQuestion.question_text}</LatexRenderer>
            </h3>
            
            {/* 显示题目图片 */}
            {currentQuestion.image_url && (
              <div className="question-image">
                <img src={currentQuestion.image_url} alt="题目图片" />
              </div>
            )}
            
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

        {/* 调试按钮 */}
        {DEBUG_MODE && (
          <div style={{ 
            position: 'fixed', 
            bottom: '100px', 
            right: '20px', 
            zIndex: 9999 
          }}>
            <button
              onClick={handleDebugAutoComplete}
              disabled={submitting}
              style={{
                padding: '8px 16px',
                background: '#f59e0b',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
              }}
            >
              🐛 调试：随机答题并提交
            </button>
          </div>
        )}

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
