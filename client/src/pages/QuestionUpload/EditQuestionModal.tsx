import React, { useState } from 'react';
import { X, Loader2, Save, CheckCircle, Upload as UploadIcon, X as XIcon } from 'lucide-react';
import { ExistingQuestion } from './types';
import { KNOWLEDGE_POINTS } from './constants';
import { adminAPI } from '../../services/api';

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
        onUpdateQuestion('image_url', response.data.data.imageUrl);
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
    onUpdateQuestion('image_url', '');
  };

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

          <div className="form-group">
            <label>题目来源</label>
            <input
              type="text"
              className="form-input"
              value={question.source || ''}
              onChange={(e) => onUpdateQuestion('source', e.target.value)}
              placeholder="例如：文档名称、图片文件名等"
            />
          </div>

          <div className="form-group">
            <label>题目配图 <span style={{ fontSize: '0.875rem', color: '#718096' }}>（可选）</span></label>
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
                  type="button"
                >
                  <XIcon size={16} />
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

