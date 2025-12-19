import React from 'react';
import { X, Loader2, Save, CheckCircle } from 'lucide-react';
import { ExistingQuestion } from './types';
import { KNOWLEDGE_POINTS } from './constants';

interface EditQuestionModalProps {
  question: ExistingQuestion;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  onUpdateQuestion: (field: keyof ExistingQuestion, value: any) => void;
  onUpdateOption: (index: number, value: string) => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  saving,
  onCancel,
  onSave,
  onUpdateQuestion,
  onUpdateOption,
}) => {
  return (
    <div className="edit-modal-overlay" onClick={onCancel}>
      <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h3>编辑题目 #{question.id}</h3>
          <button className="modal-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="edit-modal-body">
          <div className="form-group">
            <label>题目内容 *</label>
            <textarea
              className="form-input"
              value={question.question_text}
              onChange={(e) => onUpdateQuestion('question_text', e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>选项 *</label>
            <div className="options-grid">
              {Array.isArray(question.options) && question.options.map((option, oIndex) => (
                <div key={oIndex} className="option-input-wrapper">
                  <span className="option-label">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <input
                    type="text"
                    className="form-input"
                    value={option}
                    onChange={(e) => onUpdateOption(oIndex, e.target.value)}
                  />
                  <button
                    className={`correct-btn ${question.correct_answer === oIndex ? 'active' : ''}`}
                    onClick={() => onUpdateQuestion('correct_answer', oIndex)}
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
                value={question.category || ''}
                onChange={(e) => onUpdateQuestion('category', e.target.value)}
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
                onChange={(e) => onUpdateQuestion('difficulty', e.target.value)}
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
                onChange={(e) => onUpdateQuestion('knowledge_point', e.target.value)}
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
            <label>解析说明</label>
            <textarea
              className="form-input"
              value={question.explanation || ''}
              onChange={(e) => onUpdateQuestion('explanation', e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <div className="edit-modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            取消
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                保存修改
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;

