import React from 'react';
import { 
  Trash2, CheckCircle, AlertCircle, Loader2, RefreshCw, Clock, Brain 
} from 'lucide-react';
import LatexRenderer from '../../components/LatexRenderer';
import { QuestionForm } from './types';
import { KNOWLEDGE_POINTS, getKnowledgePointLabel } from './constants';

interface QuestionFormCardProps {
  question: QuestionForm;
  index: number;
  onUpdate: (index: number, field: keyof QuestionForm, value: any) => void;
  onUpdateOption: (questionIndex: number, optionIndex: number, value: string) => void;
  onRemove: (index: number) => void;
  onRetryAnalyze: (index: number) => void;
}

const QuestionFormCard: React.FC<QuestionFormCardProps> = ({
  question,
  index,
  onUpdate,
  onUpdateOption,
  onRemove,
  onRetryAnalyze,
}) => {
  return (
    <div className={`question-form-card ${question.analyzeStatus === 'pending' ? 'status-pending' : ''} ${question.analyzeStatus === 'analyzing' ? 'status-analyzing' : ''} ${question.analyzeStatus === 'error' ? 'status-error' : ''}`}>
      <div className="question-form-header">
        <span className="question-number">题目 {index + 1}</span>
        <div className="analyze-status">
          {question.analyzeStatus === 'pending' && (
            <span className="status-badge pending">
              <Clock size={14} />
              等待解析
            </span>
          )}
          {question.analyzeStatus === 'analyzing' && (
            <span className="status-badge analyzing">
              <Loader2 size={14} className="spin" />
              正在解析...
            </span>
          )}
          {question.analyzeStatus === 'completed' && (
            <span className="status-badge completed">
              <CheckCircle size={14} />
              解析完成
            </span>
          )}
          {question.analyzeStatus === 'error' && (
            <span className="status-badge error">
              <AlertCircle size={14} />
              解析失败
              <button 
                className="retry-btn"
                onClick={() => onRetryAnalyze(index)}
                title="重新解析"
              >
                <RefreshCw size={14} />
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="question-editor-layout">
        {/* 左侧编辑区域 */}
        <div className="editor-panel">
          <div className="form-group">
            <label>题目内容 * <span className="label-hint">（支持LaTeX）</span></label>
            <textarea
              className="form-input"
              placeholder="请输入题目内容，如：求 $x^2 + 2x + 1 = 0$ 的解"
              value={question.question_text}
              onChange={(e) => onUpdate(index, 'question_text', e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>选项 * <span className="label-hint">（支持LaTeX）</span></label>
            <div className="options-grid">
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="option-input-wrapper">
                  <span className="option-label">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={`选项 ${String.fromCharCode(65 + oIndex)}`}
                    value={option}
                    onChange={(e) => onUpdateOption(index, oIndex, e.target.value)}
                  />
                  <button
                    className={`correct-btn ${question.correct_answer === oIndex ? 'active' : ''}`}
                    onClick={() => onUpdate(index, 'correct_answer', oIndex)}
                    title="设为正确答案"
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>分类</label>
              <select
                className="form-input"
                value={question.category}
                onChange={(e) => onUpdate(index, 'category', e.target.value)}
              >
                <option value="">请选择分类</option>
                <option value="中文">中文</option>
                <option value="数学">数学</option>
                <option value="物理">物理</option>
                <option value="化学">化学</option>
              </select>
            </div>
            <div className="form-group">
              <label>难度</label>
              <select
                className="form-input"
                value={question.difficulty}
                onChange={(e) => onUpdate(index, 'difficulty', e.target.value)}
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>

          {/* 知识点选择 - 根据分类动态显示 */}
          {question.category && KNOWLEDGE_POINTS[question.category]?.length > 0 && (
            <div className="form-group">
              <label>知识点</label>
              <select
                className="form-input"
                value={
                  // 检查当前知识点是否属于当前分类，如果不属于则显示为空
                  question.knowledge_point && 
                  KNOWLEDGE_POINTS[question.category]?.some(kp => kp.key === question.knowledge_point)
                    ? question.knowledge_point 
                    : ''
                }
                onChange={(e) => onUpdate(index, 'knowledge_point', e.target.value)}
              >
                <option value="">请选择知识点</option>
                {KNOWLEDGE_POINTS[question.category].map((kp) => (
                  <option key={kp.key} value={kp.key}>
                    {kp.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>解析说明 <span className="label-hint">（支持LaTeX）</span></label>
            <textarea
              className="form-input"
              placeholder="可选：输入题目解析"
              value={question.explanation}
              onChange={(e) => onUpdate(index, 'explanation', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* 右侧预览区域 */}
        <div className="preview-panel">
          <div className="preview-panel-content">
            <div className="preview-item">
              <span className="preview-label">题目</span>
              <div className="preview-text">
                {question.question_text ? (
                  <LatexRenderer>{question.question_text}</LatexRenderer>
                ) : (
                  <span className="preview-placeholder">等待输入...</span>
                )}
              </div>
            </div>
            <div className="preview-item">
              <span className="preview-label">选项</span>
              <div className="preview-options">
                {question.options.map((opt, i) => (
                  <div key={i} className={`preview-option ${question.correct_answer === i ? 'correct' : ''}`}>
                    <span className="preview-option-letter">{String.fromCharCode(65 + i)}</span>
                    <div className="preview-option-content">
                      {opt ? (
                        <LatexRenderer>{opt}</LatexRenderer>
                      ) : (
                        <span className="preview-placeholder">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {question.category && (
              <div className="preview-item">
                <span className="preview-label">分类</span>
                <div className="preview-text">
                  <span className="category-tag">{question.category}</span>
                </div>
              </div>
            )}
            {question.explanation && (
              <div className="preview-item">
                <span className="preview-label">解析</span>
                <div className="preview-text">
                  <LatexRenderer>{question.explanation}</LatexRenderer>
                </div>
              </div>
            )}
            {question.knowledge_point ? (
              <div className="preview-item">
                <span className="preview-label">
                  <Brain size={14} />
                  知识点
                </span>
                <div className="knowledge-points-list">
                  <span className="knowledge-point-tag">
                    {getKnowledgePointLabel(question.category, question.knowledge_point)}
                  </span>
                </div>
              </div>
            ) : (
              question.analyzeStatus === 'completed' && question.category && (
                <div className="preview-item knowledge-point-warning">
                  <span className="preview-label">
                    <AlertCircle size={14} />
                    知识点
                  </span>
                  <div className="warning-message">
                    <span>⚠️ 未匹配到考纲知识点，或题目科目识别错误，建议删除此题或手动选择</span>
                  </div>
                </div>
              )
            )}
            {question.analyzeStatus === 'pending' && (
              <div className="analyze-pending-overlay">
                <Clock size={24} />
                <span>等待生成答案和解析...</span>
              </div>
            )}
            {question.analyzeStatus === 'analyzing' && (
              <div className="analyze-pending-overlay analyzing">
                <Loader2 size={24} className="spin" />
                <span>正在解析中...</span>
              </div>
            )}
          </div>
          <div className="latex-hint">
            💡 <code>$...$</code> 行内公式 &nbsp;|&nbsp; <code>$$...$$</code> 块级公式
          </div>
          <div className="preview-panel-footer">
            <button 
              className="btn btn-danger"
              onClick={() => onRemove(index)}
              title="删除此题"
            >
              <Trash2 size={18} />
              删除此题
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionFormCard;

