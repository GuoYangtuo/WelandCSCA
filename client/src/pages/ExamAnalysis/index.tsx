import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { testAPI } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import {
  ArrowLeft,
  Trophy,
  Target,
  BarChart3,
  CheckCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  BookOpen,
  Lightbulb,
  RotateCcw,
  Check,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import styles from './ExamAnalysis.module.css';

interface QuestionDetail {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  user_answer: number;
  is_correct: boolean;
  knowledge_point?: string;
  difficulty?: string;
  explanation?: string;
  image_url?: string;
}

interface KnowledgePointAnalysis {
  knowledge_point: string;
  total: number;
  correct: number;
  accuracy: number;
  wrong_questions: QuestionDetail[];
}

interface KpAiAnalysis {
  suggestedQuestions: string[];
  analysisReview: string;
  studyAdvice: string;
}

interface ExamDetail {
  id: number;
  testType: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  subject: string | null;
  difficultyLevel: string | null;
  durationMinutes: number | null;
  createdAt: string;
  questionDetails: QuestionDetail[];
  knowledgePointAnalysis: KnowledgePointAnalysis[];
  wrongKnowledgePoints: string[];
  aiAnalysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysisError: string | null;
  aiAnalysis: Record<string, KpAiAnalysis>;
}

interface ReviewProgress {
  id: number;
  knowledgePointQueue: string[];
  currentIndex: number;
  completedPoints: string[];
  practiceRecords: Record<string, any>;
  isCompleted: boolean;
}

interface PracticeQuestion {
  id: number;
  question_text: string;
  options: string[];
  correct_answer: number;
  knowledge_point?: string;
  difficulty?: string;
  explanation?: string;
  image_url?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const ExamAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [examDetail, setExamDetail] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setAiAnalysisPolling] = useState(false);
  
  // 复盘状态
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress | null>(null);
  const [currentKpIndex, setCurrentKpIndex] = useState(0);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [showPracticeResult, setShowPracticeResult] = useState(false);
  const [loadingPractice, setLoadingPractice] = useState(false);

  // AI 对话状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // 图表展开/折叠状态
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // 图表容器ref，用于计算标签最大宽度
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [labelWidth, setLabelWidth] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadExamDetail();
  }, [authLoading, isAuthenticated, navigate, id]);

  // AI分析状态轮询
  useEffect(() => {
    if (!examDetail || !id) return;
    
    // 只在pending或processing状态下轮询
    if (examDetail.aiAnalysisStatus !== 'pending' && examDetail.aiAnalysisStatus !== 'processing') {
      setAiAnalysisPolling(false);
      return;
    }

    setAiAnalysisPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const response = await testAPI.getAiAnalysisStatus(parseInt(id));
        const status = response.data.status;
        
        if (status === 'completed' || status === 'failed') {
          // 分析完成或失败，重新加载完整数据
          clearInterval(pollInterval);
          setAiAnalysisPolling(false);
          loadExamDetail();
        }
      } catch (error) {
        console.error('轮询AI分析状态失败:', error);
      }
    }, 3000); // 每3秒轮询一次

    return () => {
      clearInterval(pollInterval);
    };
  }, [examDetail?.aiAnalysisStatus, id]);

  // 计算所有stackedBarLabel中最大宽度
  useLayoutEffect(() => {
    if (!chartContainerRef.current || !examDetail) return;
    
    // 先重置宽度以测量自然宽度
    setLabelWidth(null);
    
    // 延迟执行以确保DOM已更新
    const timer = setTimeout(() => {
      const labels = chartContainerRef.current?.querySelectorAll(`.${styles.stackedBarLabel}`);
      if (!labels || labels.length === 0) return;
      
      let maxWidth = 0;
      labels.forEach((label) => {
        const width = (label as HTMLElement).offsetWidth;
        if (width > maxWidth) {
          maxWidth = width;
        }
      });
      
      if (maxWidth > 0) {
        setLabelWidth(maxWidth+1);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [examDetail, isChartExpanded]);

  // 获取当前知识点名称
  const currentKnowledgePoint = examDetail?.wrongKnowledgePoints?.[currentKpIndex] || '';
  
  // 获取当前知识点的AI分析数据
  const currentKpAiAnalysis = examDetail?.aiAnalysis?.[currentKnowledgePoint] || null;

  // 初始化AI欢迎消息
  useEffect(() => {
    if (examDetail && chatMessages.length === 0) {
      const wrongCount = examDetail.questionDetails.filter(q => !q.is_correct).length;
      const wrongKps = examDetail.wrongKnowledgePoints;
      
      let welcomeMessage = `你好！我是你的学习助手 🎓\n\n`;
      if (wrongCount === 0) {
        welcomeMessage += `恭喜你在本次考试中获得了满分！如果你有任何问题想要讨论，随时可以问我。`;
      } else {
        welcomeMessage += `本次考试你有 ${wrongCount} 道错题，涉及以下知识点：\n`;
        wrongKps.forEach((kp) => {
          welcomeMessage += `• ${kp}\n`;
        });
        welcomeMessage += `\n有任何不懂的地方都可以问我，我会帮你分析解答！`;
      }

      setChatMessages([{
        id: '1',
        role: 'ai',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [examDetail]);

  // 滚动到最新消息
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadExamDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await testAPI.getDetail(parseInt(id));
      setExamDetail(response.data);

      // 加载复盘进度
      const progressResponse = await testAPI.getReviewProgress(parseInt(id));
      if (progressResponse.data) {
        setReviewProgress(progressResponse.data);
        setCurrentKpIndex(progressResponse.data.currentIndex);
      }
    } catch (error) {
      console.error('加载考试详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const initReviewProgress = async () => {
    if (!examDetail || !id) return;
    
    try {
      const response = await testAPI.createReviewProgress(
        parseInt(id),
        examDetail.wrongKnowledgePoints
      );
      setReviewProgress(response.data);
      setCurrentKpIndex(0);
      loadPracticeQuestions(examDetail.wrongKnowledgePoints[0]);
    } catch (error) {
      console.error('创建复盘进度失败:', error);
    }
  };

  const loadPracticeQuestions = useCallback(async (knowledgePoint: string) => {
    if (!examDetail) return;
    
    try {
      setLoadingPractice(true);
      setPracticeQuestions([]);
      setPracticeAnswers({});
      setShowPracticeResult(false);

      // 获取当前知识点在本次考试中的错题ID
      const wrongQuestionIds = examDetail.questionDetails
        .filter(q => q.knowledge_point === knowledgePoint && !q.is_correct)
        .map(q => q.id);

      const response = await testAPI.getPracticeQuestions(
        knowledgePoint,
        examDetail.subject || undefined,
        wrongQuestionIds
      );
      setPracticeQuestions(response.data);
    } catch (error) {
      console.error('加载练习题失败:', error);
    } finally {
      setLoadingPractice(false);
    }
  }, [examDetail]);

  const handleStartReview = () => {
    if (reviewProgress) {
      if (examDetail && examDetail.wrongKnowledgePoints[reviewProgress.currentIndex]) {
        loadPracticeQuestions(examDetail.wrongKnowledgePoints[reviewProgress.currentIndex]);
      }
    } else {
      initReviewProgress();
    }
  };

  const handleNextKnowledgePoint = async () => {
    if (!reviewProgress || !examDetail) return;

    const currentKp = examDetail.wrongKnowledgePoints[currentKpIndex];
    const newCompletedPoints = [...reviewProgress.completedPoints, currentKp];
    const newIndex = currentKpIndex + 1;
    const isCompleted = newIndex >= examDetail.wrongKnowledgePoints.length;

    try {
      await testAPI.updateReviewProgress(reviewProgress.id, {
        currentIndex: newIndex,
        completedPoints: newCompletedPoints,
        practiceRecords: {
          ...reviewProgress.practiceRecords,
          [currentKp]: practiceAnswers
        },
        isCompleted
      });

      setReviewProgress({
        ...reviewProgress,
        currentIndex: newIndex,
        completedPoints: newCompletedPoints,
        isCompleted
      });
      setCurrentKpIndex(newIndex);
      
      if (!isCompleted) {
        loadPracticeQuestions(examDetail.wrongKnowledgePoints[newIndex]);
      }
    } catch (error) {
      console.error('更新复盘进度失败:', error);
    }
  };

  // 跳转到指定知识点进行复盘
  const handleJumpToKnowledgePoint = async (kpName: string) => {
    if (!examDetail) return;
    
    // 找到该知识点在错误知识点列表中的索引
    const kpIndex = examDetail.wrongKnowledgePoints.indexOf(kpName);
    if (kpIndex === -1) return; // 不是错题知识点，无法跳转
    
    if (!reviewProgress) {
      // 如果还没开始复盘，先初始化复盘进度
      try {
        const response = await testAPI.createReviewProgress(
          parseInt(id!),
          examDetail.wrongKnowledgePoints
        );
        setReviewProgress(response.data);
        setCurrentKpIndex(kpIndex);
        loadPracticeQuestions(kpName);
      } catch (error) {
        console.error('创建复盘进度失败:', error);
      }
    } else {
      // 已经在复盘中，直接跳转
      setCurrentKpIndex(kpIndex);
      loadPracticeQuestions(kpName);
    }
  };

  const handlePracticeAnswer = (questionId: number, answerIndex: number) => {
    if (showPracticeResult) return;
    setPracticeAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleCheckPracticeResult = () => {
    setShowPracticeResult(true);
  };

  // AI 对话处理
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true);

    // 模拟AI响应（实际应该调用后端API）
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: aiResponse,
        timestamp: new Date()
      }]);
      setIsAiTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  // 生成AI响应（模拟）
  const generateAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('解释') || input.includes('什么是')) {
      return `好的，让我来为你解释一下。\n\n这个概念的核心是理解其基本原理。首先，我们需要明确定义，然后逐步分析其应用场景。\n\n如果你有具体的题目想要讨论，可以直接告诉我题目内容，我会帮你详细分析！`;
    }
    
    if (input.includes('错') || input.includes('不对') || input.includes('为什么')) {
      return `这是一个很好的问题！让我帮你分析一下：\n\n1. 首先要理解题目的考查点\n2. 注意题目中的关键信息\n3. 运用正确的解题方法\n\n建议你仔细回顾错题，找出自己的薄弱环节。有具体问题可以继续问我！`;
    }
    
    if (input.includes('方法') || input.includes('怎么') || input.includes('如何')) {
      return `这里有几个有效的学习方法推荐给你：\n\n📚 **系统复习法**\n每天固定时间复习，形成习惯\n\n✍️ **错题整理法**\n把错题分类整理，定期回顾\n\n🎯 **针对练习法**\n找出薄弱知识点，专项练习\n\n需要针对具体知识点的学习建议吗？`;
    }

    return `收到你的问题了！\n\n作为你的学习助手，我可以帮你：\n• 解释知识点概念\n• 分析错题原因\n• 推荐学习方法\n• 解答疑惑问题\n\n请告诉我你具体想了解什么，我会尽力帮助你！`;
  };

  const handleQuickQuestion = (question: string) => {
    setChatInput(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getDifficultyLabel = (level: string | null | undefined) => {
    if (!level) return '';
    const labelMap: Record<string, string> = {
      'easy': t.mockTest?.difficulty?.easy || '简单',
      'medium': t.mockTest?.difficulty?.medium || '中等',
      'hard': t.mockTest?.difficulty?.hard || '困难',
    };
    return labelMap[level] || level;
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{t.examAnalysis?.loading || '正在加载考试分析...'}</p>
        </div>
      </div>
    );
  }

  if (!examDetail) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{t.examAnalysis?.notFound || '考试记录不存在'}</p>
          <button onClick={() => navigate('/exam-history')} className={styles.backBtn}>
            {t.examAnalysis?.backToHistory || '返回考试记录'}
          </button>
        </div>
      </div>
    );
  }

  // AI分析进行中，显示等待界面
  if (examDetail.aiAnalysisStatus === 'pending' || examDetail.aiAnalysisStatus === 'processing') {
    return (
      <div className={styles.container}>
        <div className={styles.aiAnalysisWaiting}>
          <div className={styles.waitingContent}>
            <div className={styles.waitingIcon}>
              <Loader2 size={48} className={styles.spinningIcon} />
            </div>
            <h2>{t.examAnalysis?.aiAnalyzing || 'AI 正在分析您的考试结果...'}</h2>
            <p>{t.examAnalysis?.aiAnalyzingHint || '我们正在根据您的错题情况，为您生成个性化的分析报告和复习建议'}</p>
            <div className={styles.waitingProgress}>
              <div className={styles.waitingDots}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <p className={styles.waitingTip}>
              {t.examAnalysis?.pleaseWait || '请稍候，分析完成后将自动进入复盘页面'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentKpWrongQuestions = examDetail.questionDetails.filter(
    q => q.knowledge_point === currentKnowledgePoint && !q.is_correct
  );
  const isReviewCompleted = reviewProgress?.isCompleted || currentKpIndex >= examDetail.wrongKnowledgePoints.length;
  const wrongQuestions = examDetail.questionDetails.filter(q => !q.is_correct);

  return (
    <div className={styles.container}>
      {/* 主布局 - 左右两栏 */}
      <div className={styles.mainLayout}>
        {/* 左侧栏 - 35% */}
        <div className={styles.leftColumn}>
          {/* 知识点正确率统计图 */}
          <div 
            className={`${styles.chartSection} ${isChartExpanded ? styles.expanded : ''}`}
            onMouseEnter={() => setIsChartExpanded(true)}
            onMouseLeave={() => setIsChartExpanded(false)}
          >
            <div className={styles.chartHeader}>
              {/* 返回按钮 */}
              <button className={styles.backLink} onClick={() => navigate('/exam-history')}>
                <ArrowLeft size={18} />
              </button>
              <div className={styles.chartTitleGroup}>
                <h2>
                  <BarChart3 size={18} />
                  {t.examAnalysis?.knowledgePointStats || '知识点题目分布'}
                </h2>
              </div>
              {/* 图例 */}
              <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.correctDot}`}></span>
                  <span>正确</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.wrongDot}`}></span>
                  <span>错误</span>
                </div>
                <div className={styles.legendItem}>
                  <CheckCircle2 size={14} className={styles.reviewedIcon} />
                  <span>已复盘</span>
                </div>
              </div>
            </div>
            {(() => {
              // 计算所有知识点中最大的题目数量作为基准
              const maxTotal = Math.max(...examDetail.knowledgePointAnalysis.map(kp => kp.total));
              // 过滤显示的知识点：展开时显示全部，折叠时只显示当前复盘的知识点
              const displayKps = isChartExpanded 
                ? examDetail.knowledgePointAnalysis 
                : examDetail.knowledgePointAnalysis.filter(kp => kp.knowledge_point === currentKnowledgePoint);
              
              return (
                <div className={styles.stackedBarChart} ref={chartContainerRef}>
                  {displayKps.length === 0 && !isChartExpanded && (
                    <div className={styles.chartHint}>
                      鼠标悬停查看全部知识点
                    </div>
                  )}
                  {displayKps.map((kp, index) => {
                    const wrongCount = kp.total - kp.correct;
                    const correctWidth = (kp.correct / maxTotal) * 100;
                    const wrongWidth = (wrongCount / maxTotal) * 100;
                    const isCurrentKp = kp.knowledge_point === currentKnowledgePoint;
                    const isReviewedKp = reviewProgress?.completedPoints?.includes(kp.knowledge_point);
                    const isWrongKp = examDetail.wrongKnowledgePoints.includes(kp.knowledge_point);
                    
                    return (
                      <div 
                        key={index} 
                        className={`${styles.stackedBarItem} ${isCurrentKp ? styles.currentKpItem : ''} ${isWrongKp ? styles.clickable : ''}`}
                        onClick={() => isWrongKp && handleJumpToKnowledgePoint(kp.knowledge_point)}
                      >
                        <div 
                          className={styles.stackedBarLabel}
                          style={labelWidth ? { width: labelWidth } : undefined}
                        >
                          <span className={styles.kpName}>{kp.knowledge_point}</span>
                        </div>
                        <div className={styles.stackedBarContainer}>
                          <div className={styles.stackedBarTrack}>
                            {kp.correct > 0 && (
                              <div
                                className={`${styles.stackedBarSegment} ${styles.correctSegment}`}
                                style={{ width: `${correctWidth}%` }}
                              >
                                <span className={styles.segmentCount}>{kp.correct}</span>
                              </div>
                            )}
                            {wrongCount > 0 && (
                              <div
                                className={`${styles.stackedBarSegment} ${styles.wrongSegment}`}
                                style={{ width: `${wrongWidth}%` }}
                              >
                                <span className={styles.segmentCount}>{wrongCount}</span>
                              </div>
                            )}
                          </div>
                          <span className={styles.totalCount}>{kp.total}题</span>
                          <div className={`${styles.reviewedCheckmark} ${isReviewedKp ? styles.active : ''}`}>
                            <CheckCircle2 size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* AI 对话组件 */}
          <div className={styles.aiChatSection}>
            <div className={styles.aiChatHeader}>
              <div className={styles.aiAvatar}>
                <Bot size={20} />
              </div>
              <h3>{t.examAnalysis?.aiAssistant || 'AI 学习助手'}</h3>
            </div>
            
            <div className={styles.aiChatMessages} ref={chatMessagesRef}>
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`${styles.chatMessage} ${styles[msg.role]}`}>
                  <div className={styles.messageAvatar}>
                    {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={styles.messageContent}>
                    {msg.content.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.content.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className={`${styles.chatMessage} ${styles.ai}`}>
                  <div className={styles.messageAvatar}>
                    <Bot size={16} />
                  </div>
                  <div className={styles.aiTyping}>
                    <div className={styles.typingDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    正在思考...
                  </div>
                </div>
              )}
            </div>

            {/* 快捷问题按钮 - 使用AI生成的问题列表 */}
            <div className={styles.quickQuestions}>
              {currentKpAiAnalysis && currentKpAiAnalysis.suggestedQuestions.length > 0 ? (
                <>
                  <div className={styles.quickQuestionsHeader}>
                    <HelpCircle size={14} />
                    <span>{t.examAnalysis?.suggestedQuestions || '你可能想问的问题'}</span>
                  </div>
                  {currentKpAiAnalysis.suggestedQuestions.slice(0, 3).map((question, idx) => (
                    <button 
                      key={idx}
                      className={styles.quickQuestionBtn}
                      onClick={() => handleQuickQuestion(question)}
                    >
                      {question.length > 20 ? question.substring(0, 20) + '...' : question}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button 
                    className={styles.quickQuestionBtn}
                    onClick={() => handleQuickQuestion('帮我分析一下这次考试的薄弱点')}
                  >
                    {t.examAnalysis?.analyzeWeakPoints || '分析薄弱点'}
                  </button>
                  <button 
                    className={styles.quickQuestionBtn}
                    onClick={() => handleQuickQuestion('如何提高正确率？')}
                  >
                    {t.examAnalysis?.improveAccuracy || '提高正确率'}
                  </button>
                  <button 
                    className={styles.quickQuestionBtn}
                    onClick={() => handleQuickQuestion('推荐学习方法')}
                  >
                    {t.examAnalysis?.studyMethods || '学习方法'}
                  </button>
                </>
              )}
            </div>

            <div className={styles.aiChatInputArea}>
              <input
                type="text"
                className={styles.aiChatInput}
                placeholder={t.examAnalysis?.askQuestion || '输入你的问题...'}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAiTyping}
              />
              <button 
                className={styles.aiChatSendBtn}
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isAiTyping}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 右侧栏 - 65% */}
        <div className={styles.rightColumn}>
          <div className={styles.reviewSection}>
            <div className={styles.reviewContent}>
              {wrongQuestions.length === 0 ? (
                <div className={styles.noWrongQuestions}>
                  <CheckCircle size={64} />
                  <h3>{t.examAnalysis?.perfectScore || '满分！没有错题'}</h3>
                  <p>{t.examAnalysis?.perfectScoreHint || '恭喜你！本次考试全部正确，继续保持！'}</p>
                </div>
              ) : isReviewCompleted ? (
                <div className={styles.reviewCompleted}>
                  <Trophy size={64} />
                  <h2>{t.examAnalysis?.allReviewCompleted || '恭喜！您已完成全部知识点复盘'}</h2>
                  <p>{t.examAnalysis?.reviewCompletedHint || '建议多做练习，巩固所学知识'}</p>
                  <button onClick={() => navigate('/mock-test')} className={styles.retryBtn}>
                    {t.examAnalysis?.retryExam || '再次测试'}
                  </button>
                </div>
              ) : !reviewProgress ? (
                <>
                  {/* 未开始复盘时显示所有错题预览 */}
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <button className={styles.startReviewBtn} onClick={handleStartReview}>
                      <RotateCcw size={20} />
                      {t.examAnalysis?.startReview || '开始错题复盘'}
                    </button>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                      共 {examDetail.wrongKnowledgePoints.length} 个知识点需要复盘
                    </p>
                  </div>

                  {/* 错题预览列表 */}
                  {wrongQuestions.map((q, index) => (
                    <div key={q.id} className={styles.questionCard}>
                      <div className={styles.questionHeader}>
                        <span className={styles.questionIndex}>Q{index + 1}</span>
                        {q.knowledge_point && (
                          <span className={styles.kpTag}>{q.knowledge_point}</span>
                        )}
                        <span className={`${styles.diffTag} ${styles[q.difficulty || 'medium']}`}>
                          {getDifficultyLabel(q.difficulty)}
                        </span>
                      </div>
                      <div className={styles.questionText}>
                        <LatexRenderer>{q.question_text}</LatexRenderer>
                      </div>
                      {q.image_url && (
                        <div className={styles.questionImage}>
                          <img src={q.image_url} alt="题目图片" />
                        </div>
                      )}
                      <div className={styles.answerComparison}>
                        <div className={styles.answerItem + ' ' + styles.wrong}>
                          <span className={styles.answerLabel}>{t.examAnalysis?.yourAnswer || '你的答案'}</span>
                          <span className={styles.answerValue}>
                            {q.user_answer >= 0 ? String.fromCharCode(65 + q.user_answer) : '-'}
                          </span>
                        </div>
                        <div className={styles.answerItem + ' ' + styles.correct}>
                          <span className={styles.answerLabel}>{t.examAnalysis?.correctAnswer || '正确答案'}</span>
                          <span className={styles.answerValue}>{String.fromCharCode(65 + q.correct_answer)}</span>
                        </div>
                      </div>
                      {q.explanation && (
                        <div className={styles.explanation}>
                          <Lightbulb size={16} />
                          <span>{t.examAnalysis?.explanation || '解析'}：</span>
                          <LatexRenderer>{q.explanation}</LatexRenderer>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* 当前知识点统计信息 */}
                  {(() => {
                    const currentKpAnalysis = examDetail.knowledgePointAnalysis.find(
                      kp => kp.knowledge_point === currentKnowledgePoint
                    );
                    const totalCount = currentKpAnalysis?.total || 0;
                    const correctCount = currentKpAnalysis?.correct || 0;
                    const wrongCount = totalCount - correctCount;
                    
                    return (
                      <div className={styles.currentKpCard}>
                        <h3>
                          <BookOpen size={20} />
                          {currentKnowledgePoint}
                        </h3>
                        <div className={styles.kpStats}>
                          <span>本次考试抽到该知识点 <strong>{totalCount}</strong> 次，</span>
                          <span className={styles.correctText}>正确 <strong>{correctCount}</strong> 道</span>
                          <span>、</span>
                          <span className={styles.wrongText}>错误 <strong>{wrongCount}</strong> 道</span>
                        </div>

                        {/* AI分析复盘与复习意见 */}
                        {currentKpAiAnalysis && (
                          <div className={styles.aiAnalysisSection}>
                            {currentKpAiAnalysis.analysisReview && (
                              <div className={styles.aiAnalysisItem}>
                                <div className={styles.aiAnalysisHeader}>
                                  <Sparkles size={16} />
                                  <span>{t.examAnalysis?.analysisReview || 'AI 分析复盘'}</span>
                                </div>
                                <div className={styles.aiAnalysisContent}>
                                  {currentKpAiAnalysis.analysisReview}
                                </div>
                              </div>
                            )}
                            {currentKpAiAnalysis.studyAdvice && (
                              <div className={styles.aiAnalysisItem}>
                                <div className={styles.aiAnalysisHeader}>
                                  <Lightbulb size={16} />
                                  <span>{t.examAnalysis?.studyAdvice || '复习建议'}</span>
                                </div>
                                <div className={styles.aiAnalysisContent}>
                                  {currentKpAiAnalysis.studyAdvice}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 该知识点的错题 */}
                  <div className={styles.kpWrongQuestions}>
                    <h4>
                      <XCircle size={18} />
                      {t.examAnalysis?.wrongQuestionsInKp || '本次考试该知识点错题'}
                    </h4>
                    {currentKpWrongQuestions.map((q, index) => (
                      <div key={q.id} className={styles.reviewQuestionCard}>
                        <div className={styles.questionHeader}>
                          <span className={styles.questionIndex}>Q{index + 1}</span>
                          <span className={`${styles.diffTag} ${styles[q.difficulty || 'medium']}`}>
                            {getDifficultyLabel(q.difficulty)}
                          </span>
                        </div>
                        <div className={styles.questionText}>
                          <LatexRenderer>{q.question_text}</LatexRenderer>
                        </div>
                        {q.image_url && (
                          <div className={styles.questionImage}>
                            <img src={q.image_url} alt="题目图片" />
                          </div>
                        )}
                        <div className={styles.answerComparison}>
                          <div className={styles.answerItem + ' ' + styles.wrong}>
                            <span className={styles.answerLabel}>{t.examAnalysis?.yourAnswer || '你的答案'}</span>
                            <span className={styles.answerValue}>
                              {q.user_answer >= 0 ? String.fromCharCode(65 + q.user_answer) : '-'}
                            </span>
                          </div>
                          <div className={styles.answerItem + ' ' + styles.correct}>
                            <span className={styles.answerLabel}>{t.examAnalysis?.correctAnswer || '正确答案'}</span>
                            <span className={styles.answerValue}>{String.fromCharCode(65 + q.correct_answer)}</span>
                          </div>
                        </div>
                        <div className={styles.optionsList}>
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`${styles.option} ${
                                optIdx === q.correct_answer ? styles.correct : ''
                              } ${
                                optIdx === q.user_answer && optIdx !== q.correct_answer ? styles.wrong : ''
                              }`}
                            >
                              <span className={styles.optionLetter}>{String.fromCharCode(65 + optIdx)}</span>
                              <span className={styles.optionContent}>
                                <LatexRenderer>{opt}</LatexRenderer>
                              </span>
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className={styles.explanation}>
                            <Lightbulb size={16} />
                            <span>{t.examAnalysis?.explanation || '解析'}：</span>
                            <LatexRenderer>{q.explanation}</LatexRenderer>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 练习题 */}
                  <div className={styles.practiceSection}>
                    <h4>
                      <Target size={18} />
                      {t.examAnalysis?.practiceQuestions || '巩固练习（三个难度各一题）'}
                    </h4>
                    {loadingPractice ? (
                      <div className={styles.practiceLoading}>
                        <div className={styles.spinner}></div>
                        <p>{t.examAnalysis?.loadingPractice || '正在抽取练习题...'}</p>
                      </div>
                    ) : practiceQuestions.length === 0 ? (
                      <div className={styles.noPractice}>
                        <p>{t.examAnalysis?.noPracticeQuestions || '暂无该知识点的其他练习题'}</p>
                      </div>
                    ) : (
                      <div className={styles.practiceList}>
                        {practiceQuestions.map((pq, index) => (
                          <div key={pq.id} className={styles.practiceCard}>
                            <div className={styles.questionHeader}>
                              <span className={styles.questionIndex}>Q{index + 1}</span>
                              <span className={`${styles.diffTag} ${styles[pq.difficulty || 'medium']}`}>
                                {getDifficultyLabel(pq.difficulty)}
                              </span>
                            </div>
                            <div className={styles.questionText}>
                              <LatexRenderer>{pq.question_text}</LatexRenderer>
                            </div>
                            {pq.image_url && (
                              <div className={styles.questionImage}>
                                <img src={pq.image_url} alt="题目图片" />
                              </div>
                            )}
                            <div className={styles.optionsList}>
                              {pq.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`${styles.option} ${styles.selectable} ${
                                    practiceAnswers[pq.id] === optIdx ? styles.selected : ''
                                  } ${
                                    showPracticeResult && optIdx === pq.correct_answer ? styles.correct : ''
                                  } ${
                                    showPracticeResult && practiceAnswers[pq.id] === optIdx && optIdx !== pq.correct_answer ? styles.wrong : ''
                                  }`}
                                  onClick={() => handlePracticeAnswer(pq.id, optIdx)}
                                >
                                  <span className={styles.optionLetter}>{String.fromCharCode(65 + optIdx)}</span>
                                  <span className={styles.optionContent}>
                                    <LatexRenderer>{opt}</LatexRenderer>
                                  </span>
                                  {showPracticeResult && optIdx === pq.correct_answer && <Check size={16} className={styles.correctIcon} />}
                                  {showPracticeResult && practiceAnswers[pq.id] === optIdx && optIdx !== pq.correct_answer && <X size={16} className={styles.wrongIcon} />}
                                </div>
                              ))}
                            </div>
                            {showPracticeResult && pq.explanation && (
                              <div className={styles.explanation}>
                                <Lightbulb size={16} />
                                <span>{t.examAnalysis?.explanation || '解析'}：</span>
                                <LatexRenderer>{pq.explanation}</LatexRenderer>
                              </div>
                            )}
                          </div>
                        ))}
                        {!showPracticeResult && practiceQuestions.length > 0 && (
                          <button 
                            className={styles.checkResultBtn}
                            onClick={handleCheckPracticeResult}
                            disabled={Object.keys(practiceAnswers).length < practiceQuestions.length}
                          >
                            <CheckCircle size={18} />
                            {t.examAnalysis?.checkAnswer || '查看答案'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 下一个知识点按钮 */}
                  <div className={styles.reviewActions}>
                    <button 
                      className={styles.nextKpBtn}
                      onClick={handleNextKnowledgePoint}
                    >
                      {currentKpIndex < examDetail.wrongKnowledgePoints.length - 1 ? (
                        <>
                          {t.examAnalysis?.understoodNext || '我已搞懂这个知识点，进入下一个'}
                          <ChevronRight size={20} />
                        </>
                      ) : (
                        <>
                          {t.examAnalysis?.completeReview || '完成复盘'}
                          <Check size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAnalysis;
