import React, { useState } from 'react';
import { 
  Trash2, CheckCircle, AlertCircle, Loader2, RefreshCw, Clock, Upload as UploadIcon, X
} from 'lucide-react';
import LatexRenderer from '../../components/LatexRenderer';
import { QuestionForm } from './types';
import { KNOWLEDGE_POINTS } from './constants';
import { adminAPI } from '../../services/api';

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
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [isEditingOptions, setIsEditingOptions] = useState(false);
  const [isEditingExplanation, setIsEditingExplanation] = useState(false);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await adminAPI.uploadQuestionImage(formData);
      
      if (response.data.success) {
        onUpdate(index, 'image_url', response.data.data.imageUrl);
        onUpdate(index, 'image_file', file);
      }
    } catch (error: any) {
      console.error('图片上传失败:', error);
      alert(error.response?.data?.message || '图片上传失败，请重试');
    } finally {
      setUploadingImage(false);
    }
  };

  // 移除图片
  const handleRemoveImage = () => {
    onUpdate(index, 'image_url', '');
    onUpdate(index, 'image_file', undefined);
  };

  return (
    <div className={`question-form-card ${question.analyzeStatus === 'pending' ? 'status-pending' : ''} ${question.analyzeStatus === 'analyzing' ? 'status-analyzing' : ''} ${question.analyzeStatus === 'error' ? 'status-error' : ''}`}>
      {/* 中间：预览/编辑切换区域 */}
      <div className="question-content-area">
        {/* 题目内容 */}
        <div className="content-section">
          <div className="content-header">
            <label>题目内容 * <span className="label-hint">（支持LaTeX）</span></label>
          </div>
          {isEditingQuestion ? (
            <textarea
              className="form-input"
              placeholder="请输入题目内容，如：求 $x^2 + 2x + 1 = 0$ 的解"
              value={question.question_text}
              onChange={(e) => onUpdate(index, 'question_text', e.target.value)}
              onBlur={() => setIsEditingQuestion(false)}
              rows={3}
              autoFocus
            />
          ) : (
            <div 
              className="preview-content clickable-preview"
              onClick={() => setIsEditingQuestion(true)}
            >
              {question.question_text ? (
                <LatexRenderer>{question.question_text}</LatexRenderer>
              ) : (
                <span className="preview-placeholder">点击编辑题目内容...</span>
              )}
            </div>
          )}
        </div>

        {/* 选项 */}
        <div className="content-section">
          <div className="content-header">
            <label>选项 * <span className="label-hint">（支持LaTeX）</span></label>
          </div>
          {isEditingOptions ? (
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
                    onBlur={() => setIsEditingOptions(false)}
                    autoFocus={oIndex === 0}
                  />
                  <button
                    className={`correct-btn ${question.correct_answer === oIndex ? 'active' : ''}`}
                    onClick={() => onUpdate(index, 'correct_answer', oIndex)}
                    onMouseDown={(e) => e.preventDefault()}
                    title="设为正确答案"
                  >
                    <CheckCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="preview-options clickable-preview"
              onClick={() => setIsEditingOptions(true)}
            >
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
          )}
        </div>

        {/* 解析说明 */}
        <div className="content-section">
          <div className="content-header">
            <label>解析说明 <span className="label-hint">（支持LaTeX）</span></label>
          </div>
          {isEditingExplanation ? (
            <textarea
              className="form-input"
              placeholder="可选：输入题目解析"
              value={question.explanation}
              onChange={(e) => onUpdate(index, 'explanation', e.target.value)}
              onBlur={() => setIsEditingExplanation(false)}
              rows={2}
              autoFocus
            />
          ) : (
            <div 
              className="preview-content clickable-preview"
              onClick={() => setIsEditingExplanation(true)}
            >
              {question.explanation ? (
                <LatexRenderer>{question.explanation}</LatexRenderer>
              ) : (
                <span className="preview-placeholder">点击编辑解析说明...</span>
              )}
            </div>
          )}
        </div>

        {/* 题目来源 */}
        <div className="content-section">
          <div className="content-header">
            <label>题目来源</label>
          </div>
          {isEditingSource ? (
            <input
              type="text"
              className="form-input"
              placeholder="例如：文档名称、图片文件名等"
              value={question.source}
              onChange={(e) => onUpdate(index, 'source', e.target.value)}
              onBlur={() => setIsEditingSource(false)}
              autoFocus
            />
          ) : (
            <div 
              className="preview-content clickable-preview"
              onClick={() => setIsEditingSource(true)}
            >
              {question.source ? (
                <span>{question.source}</span>
              ) : (
                <span className="preview-placeholder">点击编辑题目来源...</span>
              )}
            </div>
          )}
        </div>

        {/* 题目配图 */}
        <div className="content-section">
          <div className="content-header">
            <label>题目配图 <span className="label-hint">（可选）</span></label>
          </div>
          {question.image_url ? (
            <div className="question-image-preview">
              <img 
                src={question.image_url} 
                alt="题目配图" 
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
              />
              <button 
                className="remove-image-btn"
                onClick={handleRemoveImage}
                title="删除图片"
              >
                <X size={16} />
                删除图片
              </button>
            </div>
          ) : (
            <div className="image-upload-area">
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
                <div className="upload-placeholder">
                  {uploadingImage ? (
                    <>
                      <Loader2 size={24} className="spin" />
                      <span>上传中...</span>
                    </>
                  ) : (
                    <>
                      <UploadIcon size={24} />
                      <span>点击上传图片</span>
                      <span className="upload-hint">支持 JPG、PNG、GIF、WebP 格式，最大 10MB</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 三个下拉菜单（移动到解析说明下面） */}
        <div className="question-form-meta">
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
            {/* 知识点选择 - 根据分类动态显示 */}
            {question.category && KNOWLEDGE_POINTS[question.category]?.length > 0 && (
              <div className="form-group">
                <label>知识点</label>
                <select
                  className="form-input"
                  value={
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
          </div>
        </div>

        {/* 知识点警告 */}
        {!question.knowledge_point && question.analyzeStatus === 'completed' && question.category && (
          <div className="content-section">
            <div className="preview-item knowledge-point-warning">
              <span className="preview-label">
                <AlertCircle size={14} />
                知识点
              </span>
              <div className="warning-message">
                <span>⚠️ 未匹配到考纲知识点，或题目科目识别错误，建议删除此题或手动选择</span>
              </div>
            </div>
          </div>
        )}

        {/* 解析状态覆盖层 */}
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

      {/* 底部：LaTeX提示、解析状态和删除按钮 */}
      <div className="question-form-footer">
        <div className="latex-hint">
          💡 嵌入LaTeX公式：<code>$...$</code> 行内公式 &nbsp;|&nbsp; <code>$$...$$</code> 块级公式
        </div>
        <div className="footer-actions">
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
  );
};

export default QuestionFormCard;

