import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Upload, Plus, Save, AlertCircle, CheckCircle, X, 
  Image, Edit3, Database
} from 'lucide-react';
import { difyAPI, adminAPI } from '../../services/api';
import '../../components/LatexRenderer.css';
import '../QuestionUpload.css';

import { QuestionForm, UploadedImage, UploadedPdf, Message, AnalyzeStatus } from './types';
import { emptyQuestion, ENABLE_DEEPSEEK_ANALYZE } from './constants';
import ImageUploadSection from './ImageUploadSection';
import QuestionFormCard from './QuestionFormCard';
import QuestionManageSection from './QuestionManageSection';

const QuestionUpload: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  // 模式切换：'upload' = 图片上传解析, 'manual' = 手动输入, 'manage' = 题目管理
  const [mode, setMode] = useState<'upload' | 'manual' | 'manage'>('upload');
  
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
  const [message, setMessage] = useState<Message | null>(null);

  // 使用DeepSeek解析单个题目
  const analyzeQuestionWithDeepSeek = async (index: number, question: { question_text: string; options: string[] }) => {
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
        setQuestions(prev => {
          const newQuestions = [...prev];
          if (newQuestions[index]) {
            newQuestions[index] = {
              ...newQuestions[index],
              correct_answer: result.data.correct_answer ?? 0,
              explanation: result.data.explanation || '',
              difficulty: result.data.difficulty || 'medium',
              knowledge_point: result.data.knowledge_point || '',
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

  // 从图片URL解析题目（共用逻辑）
  const parseQuestionsFromImages = async (imageUrls: string[]) => {
    setParseProgress('正在识别题目...');
    
    const result = await difyAPI.parseQuestions(imageUrls);
    
    if (result.success && result.data.questions.length > 0) {
      const initialAnalyzeStatus: AnalyzeStatus = ENABLE_DEEPSEEK_ANALYZE ? 'pending' : 'completed';
      
      const questionsWithStatus: QuestionForm[] = result.data.questions.map((q: any) => ({
        question_text: q.question_text || '',
        options: q.options || ['', '', '', ''],
        correct_answer: 0,
        explanation: '',
        category: q.category || '',
        difficulty: 'medium',
        knowledge_point: '',
        analyzeStatus: initialAnalyzeStatus
      }));
      
      setQuestions(questionsWithStatus);
      
      if (ENABLE_DEEPSEEK_ANALYZE) {
        setMessage({ 
          type: 'success', 
          text: `识别出 ${questionsWithStatus.length} 道题目，正在逐题生成答案和解析...` 
        });
        
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
        setMessage({ 
          type: 'success', 
          text: `识别出 ${questionsWithStatus.length} 道题目，请校对识别结果，并手动填写答案和解析` 
        });
      }
    } else {
      setMessage({ type: 'error', text: '未能解析出题目，请检查文件内容' });
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
      const uploadResult = await difyAPI.uploadPdf(uploadedPdf.file);
      
      if (!uploadResult.success || !uploadResult.data.urls.length) {
        throw new Error('PDF转换失败');
      }
      
      const imageUrls = uploadResult.data.urls;
      setParseProgress(`PDF转换完成（共${imageUrls.length}页），正在识别题目...`);
      
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

  const addQuestion = () => {
    setQuestions([...questions, { ...emptyQuestion, options: ['', '', '', ''], knowledge_point: '', analyzeStatus: 'completed' }]);
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

    const analyzingCount = questions.filter(q => q.analyzeStatus === 'analyzing' || q.analyzeStatus === 'pending').length;
    if (analyzingCount > 0) {
      setMessage({ type: 'error', text: `还有 ${analyzingCount} 道题目正在解析中，请等待解析完成` });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const questionsToSubmit = questions.map(q => ({
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        category: q.category,
        difficulty: q.difficulty,
        knowledge_point: q.knowledge_point
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
            <h1>题目管理</h1>
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
              <button 
                className={`mode-btn ${mode === 'manage' ? 'active' : ''}`}
                onClick={() => setMode('manage')}
              >
                <Database size={16} />
                题库管理
              </button>
            </div>
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

        {/* 图片/PDF上传模式 */}
        {mode === 'upload' && (
          <ImageUploadSection
            uploadType={uploadType}
            setUploadType={setUploadType}
            uploadedImages={uploadedImages}
            setUploadedImages={setUploadedImages}
            uploadedPdf={uploadedPdf}
            setUploadedPdf={setUploadedPdf}
            parsing={parsing}
            parseProgress={parseProgress}
            onParse={handleParse}
            onPdfParse={handlePdfParse}
            onReset={handleReset}
            setMessage={setMessage}
          />
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
                <QuestionFormCard
                  key={qIndex}
                  question={question}
                  index={qIndex}
                  onUpdate={updateQuestion}
                  onUpdateOption={updateOption}
                  onRemove={removeQuestion}
                  onRetryAnalyze={retryAnalyzeQuestion}
                />
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

        {/* 题库管理模式 */}
        {mode === 'manage' && (
          <QuestionManageSection setMessage={setMessage} />
        )}
      </div>
    </div>
  );
};

export default QuestionUpload;

