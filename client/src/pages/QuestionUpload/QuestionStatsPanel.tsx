import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { CATEGORIES, DIFFICULTIES, KNOWLEDGE_POINTS, getKnowledgePointLabel } from './constants';

interface QuestionStatsPanelProps {
  onFilterSelect: (category: string, knowledge_point: string, difficulty: string) => void;
}

type AggRow = {
  knowledge: string;
  easy: number;
  medium: number;
  hard: number;
};

const QuestionStatsPanel: React.FC<QuestionStatsPanelProps> = ({ onFilterSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [rows, setRows] = useState<AggRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params: any = { limit: 10000 };
        if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
        const result = await adminAPI.getQuestions(params);
        if (result.success) {
          const questions: any[] = result.data.questions || [];
          // Prepare rows for all knowledge points (including zero-count ones)
          let kpKeys: string[] = [];
          if (selectedCategory && selectedCategory !== 'all') {
            kpKeys = (KNOWLEDGE_POINTS[selectedCategory] || []).map(k => k.key);
          } else {
            // union of all knowledge points across categories
            const set = new Set<string>();
            Object.values(KNOWLEDGE_POINTS).forEach(arr => arr.forEach(k => set.add(k.key)));
            kpKeys = Array.from(set);
          }
          // ensure '未设置' is present to represent questions without a knowledge_point
          if (!kpKeys.includes('未设置')) kpKeys.push('未设置');

          const map: Record<string, AggRow> = {};
          kpKeys.forEach(k => {
            map[k] = { knowledge: k, easy: 0, medium: 0, hard: 0 };
          });

          // aggregate counts into map
          questions.forEach(q => {
            const kp = q.knowledge_point || '未设置';
            if (!map[kp]) {
              map[kp] = { knowledge: kp, easy: 0, medium: 0, hard: 0 };
            }
            const diff = q.difficulty || 'medium';
            if (diff === 'easy') map[kp].easy++;
            else if (diff === 'hard') map[kp].hard++;
            else map[kp].medium++;
          });

          const arr = Object.values(map).sort((a, b) => (b.easy + b.medium + b.hard) - (a.easy + a.medium + a.hard));
          setRows(arr);
        }
      } catch (err) {
        console.error('加载统计数据失败', err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedCategory]);

  // compute max total to scale bar widths
  const maxTotal = rows.reduce((m, r) => Math.max(m, r.easy + r.medium + r.hard), 0) || 1;

  const handleSegClick = (knowledge: string, difficulty: string) => {
    onFilterSelect(selectedCategory, knowledge === '未设置' ? '' : knowledge, difficulty);
  };

  return (
    <div className="stats-panel">
      <div className="stats-panel-header">
        <div className="stats-title">题库统计</div>
        <div className="stats-controls">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stats-body">
        {loading && <div className="stats-loading">加载中...</div>}
        {!loading && rows.length === 0 && <div className="stats-empty">暂无数据</div>}
        {!loading && rows.map(row => {
          const total = row.easy + row.medium + row.hard;
          return (
            <div key={row.knowledge} className="stats-row">
              <div className="kp-label" title={getKnowledgePointLabel(selectedCategory, row.knowledge)}>
                {getKnowledgePointLabel(selectedCategory, row.knowledge)}
              </div>
              <div className="bar-outer">
                <div
                  className="bar-inner"
                  data-total={total}
                  style={{ width: `${(total / Math.max(1, maxTotal)) * 100}%` }}
                >
                  {total > 0 ? (
                    <>
                      <div
                        className="stat-seg easy"
                        style={{ width: `${(row.easy / total) * 100}%` }}
                        onClick={() => handleSegClick(row.knowledge, 'easy')}
                      >
                        {row.easy > 0 && <span className="seg-text">{row.easy}</span>}
                      </div>
                      <div
                        className="stat-seg medium"
                        style={{ width: `${(row.medium / total) * 100}%` }}
                        onClick={() => handleSegClick(row.knowledge, 'medium')}
                      >
                        {row.medium > 0 && <span className="seg-text">{row.medium}</span>}
                      </div>
                      <div
                        className="stat-seg hard"
                        style={{ width: `${(row.hard / total) * 100}%` }}
                        onClick={() => handleSegClick(row.knowledge, 'hard')}
                      >
                        {row.hard > 0 && <span className="seg-text">{row.hard}</span>}
                      </div>
                    </>
                  ) : (
                    <div className="stat-empty">0</div>
                  )}
                </div>
                <div className="bar-total">{total}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionStatsPanel;


