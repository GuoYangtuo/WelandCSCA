import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { testAPI } from '../../services/api';
import {
  Clock,
  FileText,
  ChevronRight,
  Trophy,
  Target,
  Sparkles,
  BookMarked,
  Calendar,
  BarChart3,
  BookA,
  GraduationCap,
  Calculator,
  Zap,
  Beaker,
  Filter
} from 'lucide-react';
import styles from './ExamHistory.module.css';

interface ExamRecord {
  id: number;
  test_type: string;
  score: number;
  total_questions: number;
  subject: string | null;
  difficulty_level: string | null;
  duration_minutes: number | null;
  created_at: string;
}

// 科目图标映射
const getSubjectIcon = (subjectKey: string | null) => {
  switch (subjectKey) {
    case '文科中文': return BookA;
    case '理科中文': return GraduationCap;
    case '数学': return Calculator;
    case '物理': return Zap;
    case '化学': return Beaker;
    default: return FileText;
  }
};

// 科目颜色映射
const getSubjectColor = (subjectKey: string | null): string => {
  switch (subjectKey) {
    case '文科中文': return '#f56565';
    case '理科中文': return '#ed64a6';
    case '数学': return '#48bb78';
    case '物理': return '#4299e1';
    case '化学': return '#ed8936';
    default: return '#718096';
  }
};

const ExamHistory: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<'all' | 'mock' | 'basic'>('all');

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadHistory();
  }, [isAuthenticated, authLoading, navigate, filter]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const testType = filter === 'all' ? undefined : filter;
      const response = await testAPI.getHistory(testType, 50, 0);
      setRecords(response.data.records);
      setTotal(response.data.total);
    } catch (error) {
      console.error('加载考试记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (percentage: number) => {
    if (percentage >= 90) return { level: t.mockTest?.scoreLevel?.excellent || '优秀', class: 'excellent', icon: Trophy };
    if (percentage >= 80) return { level: t.mockTest?.scoreLevel?.good || '良好', class: 'good', icon: Target };
    if (percentage >= 60) return { level: t.mockTest?.scoreLevel?.pass || '及格', class: 'pass', icon: Sparkles };
    return { level: t.mockTest?.scoreLevel?.fail || '需加强', class: 'fail', icon: BookMarked };
  };

  const getSubjectLabel = (subjectKey: string | null) => {
    if (!subjectKey) return t.examHistory?.unknownSubject || '综合测试';
    const labelMap: Record<string, string> = {
      '文科中文': t.mockTest?.subjects?.artsChinese || '文科中文',
      '理科中文': t.mockTest?.subjects?.scienceChinese || '理科中文',
      '数学': t.mockTest?.subjects?.math || '数学',
      '物理': t.mockTest?.subjects?.physics || '物理',
      '化学': t.mockTest?.subjects?.chemistry || '化学',
    };
    return labelMap[subjectKey] || subjectKey;
  };

  const getDifficultyLabel = (level: string | null) => {
    if (!level) return '';
    const labelMap: Record<string, string> = {
      'easy': t.mockTest?.difficultyLevel?.easy || '简单模式',
      'medium': t.mockTest?.difficultyLevel?.medium || '中等模式',
      'hard': t.mockTest?.difficultyLevel?.hard || '困难模式',
    };
    return labelMap[level] || level;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewAnalysis = (examId: number) => {
    navigate(`/exam-analysis/${examId}`);
  };

  if (authLoading || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{t.examHistory?.loading || '正在加载考试记录...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>{t.examHistory?.title || '考试记录'}</h1>
          <p>{t.examHistory?.subtitle || '查看您的历次考试成绩和详细分析'}</p>
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{total}</span>
            <span className={styles.statLabel}>{t.examHistory?.totalExams || '总考试次数'}</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          <Filter size={16} />
          {t.examHistory?.filterAll || '全部'}
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'mock' ? styles.active : ''}`}
          onClick={() => setFilter('mock')}
        >
          <BarChart3 size={16} />
          {t.examHistory?.filterMock || '模拟考试'}
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'basic' ? styles.active : ''}`}
          onClick={() => setFilter('basic')}
        >
          <FileText size={16} />
          {t.examHistory?.filterBasic || '基础测试'}
        </button>
      </div>

      {records.length === 0 ? (
        <div className={styles.empty}>
          <FileText size={64} strokeWidth={1} />
          <h3>{t.examHistory?.noRecords || '暂无考试记录'}</h3>
          <p>{t.examHistory?.startExamHint || '完成考试后，您的记录将显示在这里'}</p>
          <button onClick={() => navigate('/mock-test')} className={styles.startBtn}>
            {t.examHistory?.goToExam || '前往考试'}
          </button>
        </div>
      ) : (
        <div className={styles.recordList}>
          {records.map((record) => {
            const percentage = Math.round((record.score / record.total_questions) * 100);
            const scoreInfo = getScoreLevel(percentage);
            const SubjectIcon = getSubjectIcon(record.subject);
            const subjectColor = getSubjectColor(record.subject);

            return (
              <div
                key={record.id}
                className={styles.recordCard}
                onClick={() => handleViewAnalysis(record.id)}
              >
                <div className={styles.cardLeft}>
                  <div 
                    className={styles.subjectIcon}
                    style={{ backgroundColor: subjectColor + '20', color: subjectColor }}
                  >
                    <SubjectIcon size={24} />
                  </div>
                  <div className={styles.cardInfo}>
                    <h3>{getSubjectLabel(record.subject)}</h3>
                    <div className={styles.cardMeta}>
                      <span className={styles.metaItem}>
                        <Calendar size={14} />
                        {formatDate(record.created_at)}
                      </span>
                      {record.duration_minutes && (
                        <span className={styles.metaItem}>
                          <Clock size={14} />
                          {record.duration_minutes} {t.mockTest?.minutes || '分钟'}
                        </span>
                      )}
                      {record.difficulty_level && (
                        <span className={`${styles.difficultyBadge} ${styles[record.difficulty_level]}`}>
                          {getDifficultyLabel(record.difficulty_level)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.cardRight}>
                  <div className={styles.scoreSection}>
                    <div className={`${styles.scoreCircle} ${styles[scoreInfo.class]}`}>
                      <span className={styles.scoreValue}>{percentage}</span>
                      <span className={styles.scoreUnit}>%</span>
                    </div>
                    <div className={styles.scoreDetails}>
                      <span className={styles.correctCount}>
                        {record.score}/{record.total_questions}
                      </span>
                      <span className={`${styles.levelBadge} ${styles[scoreInfo.class]}`}>
                        {scoreInfo.level}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={20} className={styles.arrow} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExamHistory;

