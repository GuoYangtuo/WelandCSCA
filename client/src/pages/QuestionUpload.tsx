import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, Plus, Trash2, Save, FileJson, AlertCircle, CheckCircle, X, 
  Image, Scan, Edit3, Loader2
} from 'lucide-react';
import { difyAPI, adminAPI } from '../services/api';
import LatexRenderer from '../components/LatexRenderer';
import '../components/LatexRenderer.css';
import './QuestionUpload.css';

interface QuestionForm {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
  difficulty: string;
}

interface UploadedImage {
  file: File;
  preview: string;
  serverUrl?: string; // 上传到服务器后的URL
}

const emptyQuestion: QuestionForm = {
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  category: '',
  difficulty: 'medium'
};

const QuestionUpload: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 模式切换：'upload' = 图片上传解析, 'manual' = 手动输入
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  
  // 图片上传相关状态
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  
  // 题目相关状态
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonImport, setShowJsonImport] = useState(false);

  // 图片上传处理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remaining = 10 - uploadedImages.length;
    const filesToAdd = Array.from(files).slice(0, remaining);

    const newImages: UploadedImage[] = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // 调用Dify API解析题目
  const handleParse = async () => {
    if (uploadedImages.length === 0) {
      setMessage({ type: 'error', text: '请先上传图片' });
      return;
    }

    setParsing(true);
    setParseProgress('上传图片到服务器...');
    setMessage(null);

    try {
      // 1. 上传图片到服务器获取URL
      const files = uploadedImages.map(img => img.file);
      const uploadResult = await difyAPI.uploadImages(files);
      
      if (!uploadResult.success || !uploadResult.data.urls.length) {
        throw new Error('图片上传失败');
      }
      
      const imageUrls = uploadResult.data.urls;
      
      setParseProgress('正在解析...');
      
      // 2. 调用Dify API
      const result = await difyAPI.parseQuestions(imageUrls);
      
      if (result.success && result.data.questions.length > 0) {
        setQuestions(result.data.questions);
        setMessage({ 
          type: 'success', 
          text: `成功解析出 ${result.data.questions.length} 道题目，请审核确认` 
        });
      } else {
        setMessage({ type: 'error', text: '未能解析出题目，请检查图片内容' });
      }
    } catch (error: any) {
      console.error('解析错误:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '解析失败，请重试' 
      });
    } finally {
      setParsing(false);
      setParseProgress('');
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion, options: ['', '', '', ''] }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 0) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const validateQuestions = (): boolean => {
    if (questions.length === 0) {
      setMessage({ type: 'error', text: '没有可提交的题目' });
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setMessage({ type: 'error', text: `第 ${i + 1} 题缺少题目内容` });
        return false;
      }
      if (q.options.some(opt => !opt.trim())) {
        setMessage({ type: 'error', text: `第 ${i + 1} 题的选项不完整` });
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateQuestions()) return;

    setUploading(true);
    setMessage(null);

    try {
      if (questions.length === 1) {
        await adminAPI.addQuestion(questions[0]);
      } else {
        await adminAPI.batchAddQuestions(questions);
      }
      setMessage({ type: 'success', text: `成功上传 ${questions.length} 道题目！` });
      setQuestions([]);
      setUploadedImages([]);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || '上传失败，请重试' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const questionsArray = Array.isArray(parsed) ? parsed : [parsed];
      
      const formattedQuestions = questionsArray.map(q => ({
        question_text: q.question_text || q.questionText || '',
        options: q.options || ['', '', '', ''],
        correct_answer: q.correct_answer ?? q.correctAnswer ?? q.correct_option ?? 0,
        explanation: q.explanation || '',
        category: q.category || '',
        difficulty: q.difficulty || 'medium'
      }));

      setQuestions(formattedQuestions);
      setShowJsonImport(false);
      setJsonInput('');
      setMessage({ type: 'success', text: `成功导入 ${formattedQuestions.length} 道题目` });
    } catch (error) {
      setMessage({ type: 'error', text: 'JSON格式错误，请检查' });
    }
  };

  // 重置所有状态
  const handleReset = () => {
    uploadedImages.forEach(img => URL.revokeObjectURL(img.preview));
    setUploadedImages([]);
    setQuestions([]);
    setMessage(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="upload-page">
        <div className="auth-required">
          <AlertCircle size={48} />
          <h2>需要登录</h2>
          <p>请先登录后再使用题目上传功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <header className="upload-header">
          <div className="header-title">
            <Upload size={28} />
            <h1>题目上传</h1>
          </div>
          <div className="header-actions">
            <div className="mode-switch">
              <button 
                className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
                onClick={() => setMode('upload')}
              >
                <Image size={16} />
                图片解析
              </button>
              <button 
                className={`mode-btn ${mode === 'manual' ? 'active' : ''}`}
                onClick={() => setMode('manual')}
              >
                <Edit3 size={16} />
                手动输入
              </button>
            </div>
            <button 
              className="btn btn-outline"
              onClick={() => setShowJsonImport(!showJsonImport)}
            >
              <FileJson size={18} />
              JSON导入
            </button>
            {mode === 'manual' && (
              <button 
                className="btn btn-primary"
                onClick={addQuestion}
              >
                <Plus size={18} />
                添加题目
              </button>
            )}
          </div>
        </header>

        {message && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
            <button className="message-close" onClick={() => setMessage(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {showJsonImport && (
          <div className="json-import-section">
            <h3>JSON导入</h3>
            <p className="json-hint">
              支持单个题目对象或题目数组。字段：question_text, options[], correct_answer/correct_option, explanation, category, difficulty
            </p>
            <textarea
              className="json-input"
              placeholder={`示例：
[
  {
    "question_text": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correct_answer": 0,
    "explanation": "解析",
    "category": "分类",
    "difficulty": "easy"
  }
]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div className="json-actions">
              <button className="btn btn-secondary" onClick={() => setShowJsonImport(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={handleJsonImport}>
                导入
              </button>
            </div>
          </div>
        )}

        {/* 图片上传模式 */}
        {mode === 'upload' && (
          <div className="image-upload-section">
            <div className="upload-zone">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="file-input"
                disabled={uploadedImages.length >= 10}
              />
              <div className="upload-zone-content">
                <Image size={48} className="upload-icon" />
                <h3>点击或拖拽上传图片</h3>
                <p>支持 JPG、PNG、WebP 格式，最多 10 张</p>
                <p className="upload-count">已上传 {uploadedImages.length}/10 张</p>
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="images-preview">
                <div className="images-grid">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="image-item">
                      <img src={img.preview} alt={`预览 ${index + 1}`} />
                      <button 
                        className="image-remove-btn"
                        onClick={() => removeImage(index)}
                      >
                        <X size={14} />
                      </button>
                      <span className="image-index">{index + 1}</span>
                    </div>
                  ))}
                </div>
                <div className="parse-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={handleReset}
                    disabled={parsing}
                  >
                    清空重置
                  </button>
                  <button 
                    className="btn btn-primary btn-parse"
                    onClick={handleParse}
                    disabled={parsing || uploadedImages.length === 0}
                  >
                    {parsing ? (
                      <>
                        <Loader2 size={18} className="spin" />
                        {parseProgress}
                      </>
                    ) : (
                      <>
                        <Scan size={18} />
                        解析题目
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 解析结果展示 / 手动输入区 */}
        {questions.length > 0 && (
          <>
            <div className="parsed-header">
              <h2>
                {mode === 'upload' ? '📝 解析结果审核' : '📝 题目编辑'}
              </h2>
              <p className="parsed-hint">
                {mode === 'upload' 
                  ? '请检查并修正以下解析出的题目，确认无误后点击提交入库' 
                  : '请填写题目信息'}
              </p>
            </div>

            <div className="questions-list">
              {questions.map((question, qIndex) => (
                <div key={qIndex} className="question-form-card">
                  <div className="question-form-header">
                    <span className="question-number">题目 {qIndex + 1}</span>
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
                          onChange={(e) => updateQuestion(qIndex, 'question_text', e.target.value)}
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
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                              />
                              <button
                                className={`correct-btn ${question.correct_answer === oIndex ? 'active' : ''}`}
                                onClick={() => updateQuestion(qIndex, 'correct_answer', oIndex)}
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
                          <input
                            type="text"
                            className="form-input"
                            placeholder="如：数学、语文、地理..."
                            value={question.category}
                            onChange={(e) => updateQuestion(qIndex, 'category', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label>难度</label>
                          <select
                            className="form-input"
                            value={question.difficulty}
                            onChange={(e) => updateQuestion(qIndex, 'difficulty', e.target.value)}
                          >
                            <option value="easy">简单</option>
                            <option value="medium">中等</option>
                            <option value="hard">困难</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>解析说明 <span className="label-hint">（支持LaTeX）</span></label>
                        <textarea
                          className="form-input"
                          placeholder="可选：输入题目解析"
                          value={question.explanation}
                          onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
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
                        {question.explanation && (
                          <div className="preview-item">
                            <span className="preview-label">解析</span>
                            <div className="preview-text">
                              <LatexRenderer>{question.explanation}</LatexRenderer>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="latex-hint">
                        💡 <code>$...$</code> 行内公式 &nbsp;|&nbsp; <code>$$...$$</code> 块级公式
                      </div>
                      <div className="preview-panel-footer">
                        <button 
                          className="btn btn-icon btn-danger"
                          onClick={() => removeQuestion(qIndex)}
                          title="删除此题"
                        >
                          <Trash2 size={18} />
                          删除此题
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="upload-footer">
              <span className="question-count">共 {questions.length} 道题目待提交</span>
              <div className="footer-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={addQuestion}
                >
                  <Plus size={18} />
                  追加题目
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleSubmit}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="btn-spinner"></span>
                      提交中...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      提交入库
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 手动模式下无题目时显示空状态 */}
        {mode === 'manual' && questions.length === 0 && (
          <div className="empty-state">
            <Edit3 size={48} />
            <h3>暂无题目</h3>
            <p>点击右上角「添加题目」按钮开始手动录入</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionUpload;
