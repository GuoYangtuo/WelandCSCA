import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, Plus, Trash2, Save, FileJson, AlertCircle, CheckCircle, X, 
  Image, Scan, Edit3, Loader2, RefreshCw, Clock, Brain, FileText
} from 'lucide-react';
import { difyAPI, adminAPI } from '../services/api';
import LatexRenderer from '../components/LatexRenderer';
import '../components/LatexRenderer.css';
import './QuestionUpload.css';

// 解析状态类型
type AnalyzeStatus = 'pending' | 'analyzing' | 'completed' | 'error';

interface QuestionForm {
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
  difficulty: string;
  knowledge_points: string[];  // 知识点列表
  analyzeStatus: AnalyzeStatus;  // DeepSeek解析状态
  analyzeError?: string;  // 解析错误信息
}

interface UploadedImage {
  file: File;
  preview: string;
  serverUrl?: string; // 上传到服务器后的URL
}

interface UploadedPdf {
  file: File;
  name: string;
  size: number;
}

const emptyQuestion: QuestionForm = {
  question_text: '',
  options: ['', '', '', ''],
  correct_answer: 0,
  explanation: '',
  category: '',
  difficulty: 'medium',
  knowledge_points: [],
  analyzeStatus: 'completed'  // 手动添加的题目默认为已完成
};

// 是否启用 DeepSeek 自动解析（从环境变量读取）
const ENABLE_DEEPSEEK_ANALYZE = import.meta.env.VITE_ENABLE_DEEPSEEK_ANALYZE === 'true';

const QuestionUpload: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // 模式切换：'upload' = 图片上传解析, 'manual' = 手动输入
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  
  // 上传类型：'image' = 图片, 'pdf' = PDF
  const [uploadType, setUploadType] = useState<'image' | 'pdf'>('pdf');
  
  // 图片上传相关状态
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedPdf, setUploadedPdf] = useState<UploadedPdf | null>(null);
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

  // PDF文件选择处理
  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: '请选择PDF文件' });
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'PDF文件大小不能超过50MB' });
      return;
    }

    setUploadedPdf({
      file,
      name: file.name,
      size: file.size
    });
    
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const removePdf = () => {
    setUploadedPdf(null);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // 使用DeepSeek解析单个题目
  const analyzeQuestionWithDeepSeek = async (index: number, question: { question_text: string; options: string[] }) => {
    // 更新状态为正在解析
    setQuestions(prev => {
      const newQuestions = [...prev];
      if (newQuestions[index]) {
        newQuestions[index] = { ...newQuestions[index], analyzeStatus: 'analyzing' };
      }
      return newQuestions;
    });

    try {
      const result = await difyAPI.analyzeQuestion(question);
      
      if (result.success && result.data) {
        // 更新题目信息
        setQuestions(prev => {
          const newQuestions = [...prev];
          if (newQuestions[index]) {
            newQuestions[index] = {
              ...newQuestions[index],
              correct_answer: result.data.correct_answer ?? 0,
              explanation: result.data.explanation || '',
              difficulty: result.data.difficulty || 'medium',
              knowledge_points: result.data.knowledge_points || [],
              analyzeStatus: 'completed'
            };
          }
          return newQuestions;
        });
      } else {
        throw new Error('解析结果无效');
      }
    } catch (error: any) {
      console.error(`第 ${index + 1} 题解析失败:`, error);
      setQuestions(prev => {
        const newQuestions = [...prev];
        if (newQuestions[index]) {
          newQuestions[index] = {
            ...newQuestions[index],
            analyzeStatus: 'error',
            analyzeError: error.response?.data?.message || '解析失败'
          };
        }
        return newQuestions;
      });
    }
  };

  // 重新解析单个题目
  const retryAnalyzeQuestion = (index: number) => {
    const question = questions[index];
    if (question) {
      analyzeQuestionWithDeepSeek(index, {
        question_text: question.question_text,
        options: question.options
      });
    }
  };

  // 调用Dify API解析题目（图片）
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
      
      await parseQuestionsFromImages(imageUrls);
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

  // 处理PDF上传并解析
  const handlePdfParse = async () => {
    if (!uploadedPdf) {
      setMessage({ type: 'error', text: '请先上传PDF文件' });
      return;
    }

    setParsing(true);
    setParseProgress('上传PDF并转换为图片...');
    setMessage(null);

    try {
      // 1. 上传PDF到服务器，后端会转换为图片
      const uploadResult = await difyAPI.uploadPdf(uploadedPdf.file);
      
      if (!uploadResult.success || !uploadResult.data.urls.length) {
        throw new Error('PDF转换失败');
      }
      
      const imageUrls = uploadResult.data.urls;
      setParseProgress(`PDF转换完成（共${imageUrls.length}页），正在识别题目...`);
      
      // 2. 调用题目识别
      await parseQuestionsFromImages(imageUrls);
    } catch (error: any) {
      console.error('PDF解析错误:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'PDF解析失败，请重试' 
      });
    } finally {
      setParsing(false);
      setParseProgress('');
    }
  };

  // 从图片URL解析题目（共用逻辑）
  const parseQuestionsFromImages = async (imageUrls: string[]) => {
    setParseProgress('正在识别题目...');
    
    // 调用阿里云API识别图片中的题目（只返回题目和选项）
    const result = await difyAPI.parseQuestions(imageUrls);
    
    if (result.success && result.data.questions.length > 0) {
      // 根据环境变量决定初始状态
      const initialAnalyzeStatus: AnalyzeStatus = ENABLE_DEEPSEEK_ANALYZE ? 'pending' : 'completed';
      
      const questionsWithStatus: QuestionForm[] = result.data.questions.map((q: any) => ({
        question_text: q.question_text || '',
        options: q.options || ['', '', '', ''],
        correct_answer: 0,  // 暂时设为0
        explanation: '',
        category: q.category || '',  // 使用阿里云识别出的分类
        difficulty: 'medium',
        knowledge_points: [],
        analyzeStatus: initialAnalyzeStatus
      }));
      
      setQuestions(questionsWithStatus);
      
      if (ENABLE_DEEPSEEK_ANALYZE) {
        // 启用了 DeepSeek 解析，逐个调用
        setMessage({ 
          type: 'success', 
          text: `识别出 ${questionsWithStatus.length} 道题目，正在逐题生成答案和解析...` 
        });
        
        // 逐个调用DeepSeek解析每道题
        for (let i = 0; i < questionsWithStatus.length; i++) {
          await analyzeQuestionWithDeepSeek(i, {
            question_text: questionsWithStatus[i].question_text,
            options: questionsWithStatus[i].options
          });
        }
        
        setMessage({ 
          type: 'success', 
          text: `全部 ${questionsWithStatus.length} 道题目解析完成，请审核确认` 
        });
      } else {
        // 未启用 DeepSeek 解析，直接让用户手动填写
        setMessage({ 
          type: 'success', 
          text: `识别出 ${questionsWithStatus.length} 道题目，请手动填写答案和解析` 
        });
      }
    } else {
      setMessage({ type: 'error', text: '未能解析出题目，请检查文件内容' });
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion, options: ['', '', '', ''], knowledge_points: [], analyzeStatus: 'completed' }]);
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

    // 检查是否有正在解析的题目
    const analyzingCount = questions.filter(q => q.analyzeStatus === 'analyzing' || q.analyzeStatus === 'pending').length;
    if (analyzingCount > 0) {
      setMessage({ type: 'error', text: `还有 ${analyzingCount} 道题目正在解析中，请等待解析完成` });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      // 提交时过滤掉前端专用字段
      const questionsToSubmit = questions.map(q => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty,
        knowledge_points: q.knowledge_points  // 知识点也提交到后端
      }));

      if (questionsToSubmit.length === 1) {
        await adminAPI.addQuestion(questionsToSubmit[0]);
      } else {
        await adminAPI.batchAddQuestions(questionsToSubmit);
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
      
      const formattedQuestions: QuestionForm[] = questionsArray.map(q => ({
        question_text: q.question_text || q.questionText || '',
        options: q.options || ['', '', '', ''],
        correct_answer: q.correct_answer ?? q.correctAnswer ?? q.correct_option ?? 0,
        explanation: q.explanation || '',
        category: q.category || '',
        difficulty: q.difficulty || 'medium',
        knowledge_points: q.knowledge_points || [],
        analyzeStatus: 'completed' as AnalyzeStatus
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
    setUploadedPdf(null);
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

        {/* 图片/PDF上传模式 */}
        {mode === 'upload' && (
          <div className="image-upload-section">
            {/* 上传类型切换 */}
            <div className="upload-type-switch">
              <button 
                className={`upload-type-btn ${uploadType === 'pdf' ? 'active' : ''}`}
                onClick={() => setUploadType('pdf')}
                disabled={parsing}
              >
                <FileText size={18} />
                PDF上传
              </button>
              <button 
                className={`upload-type-btn ${uploadType === 'image' ? 'active' : ''}`}
                onClick={() => setUploadType('image')}
                disabled={parsing}
              >
                <Image size={18} />
                图片上传
              </button>
            </div>

            {/* 图片上传区 */}
            {uploadType === 'image' && (
              <>
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
              </>
            )}

            {/* PDF上传区 */}
            {uploadType === 'pdf' && (
              <>
                <div className="upload-zone">
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfSelect}
                    className="file-input"
                    disabled={!!uploadedPdf}
                  />
                  <div className="upload-zone-content">
                    <FileText size={48} className="upload-icon" />
                    <h3>点击或拖拽上传PDF文件</h3>
                    <p>支持 PDF 格式，最大 50MB，最多转换 10 页</p>
                    {uploadedPdf ? (
                      <p className="upload-count">已选择文件</p>
                    ) : (
                      <p className="upload-count">未选择文件</p>
                    )}
                  </div>
                </div>

                {uploadedPdf && (
                  <div className="pdf-preview">
                    <div className="pdf-info">
                      <FileText size={32} className="pdf-icon" />
                      <div className="pdf-details">
                        <span className="pdf-name">{uploadedPdf.name}</span>
                        <span className="pdf-size">{formatFileSize(uploadedPdf.size)}</span>
                      </div>
                      <button 
                        className="pdf-remove-btn"
                        onClick={removePdf}
                        disabled={parsing}
                      >
                        <X size={18} />
                      </button>
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
                        onClick={handlePdfParse}
                        disabled={parsing || !uploadedPdf}
                      >
                        {parsing ? (
                          <>
                            <Loader2 size={18} className="spin" />
                            {parseProgress}
                          </>
                        ) : (
                          <>
                            <Scan size={18} />
                            解析PDF题目
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
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
                <div key={qIndex} className={`question-form-card ${question.analyzeStatus === 'pending' ? 'status-pending' : ''} ${question.analyzeStatus === 'analyzing' ? 'status-analyzing' : ''} ${question.analyzeStatus === 'error' ? 'status-error' : ''}`}>
                  <div className="question-form-header">
                    <span className="question-number">题目 {qIndex + 1}</span>
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
                            onClick={() => retryAnalyzeQuestion(qIndex)}
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
                          <select
                            className="form-input"
                            value={question.category}
                            onChange={(e) => updateQuestion(qIndex, 'category', e.target.value)}
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
                        {question.knowledge_points && question.knowledge_points.length > 0 && (
                          <div className="preview-item">
                            <span className="preview-label">
                              <Brain size={14} />
                              知识点
                            </span>
                            <div className="knowledge-points-list">
                              {question.knowledge_points.map((point, i) => (
                                <span key={i} className="knowledge-point-tag">{point}</span>
                              ))}
                            </div>
                          </div>
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
