import React, { useRef } from 'react';
import { Image, FileText, Loader2, Scan, X } from 'lucide-react';
import { UploadedImage, UploadedPdf } from './types';

interface ImageUploadSectionProps {
  uploadType: 'image' | 'pdf';
  setUploadType: (type: 'image' | 'pdf') => void;
  uploadedImages: UploadedImage[];
  setUploadedImages: React.Dispatch<React.SetStateAction<UploadedImage[]>>;
  uploadedPdf: UploadedPdf | null;
  setUploadedPdf: React.Dispatch<React.SetStateAction<UploadedPdf | null>>;
  parsing: boolean;
  parseProgress: string;
  onParse: () => void;
  onPdfParse: () => void;
  onReset: () => void;
  setMessage: (msg: { type: 'error' | 'success'; text: string } | null) => void;
  compactMode?: boolean; // 紧凑模式：只显示操作按钮，不显示上传区域
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  uploadType,
  setUploadType,
  uploadedImages,
  setUploadedImages,
  uploadedPdf,
  setUploadedPdf,
  parsing,
  parseProgress,
  onParse,
  onPdfParse,
  onReset,
  setMessage,
  compactMode = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // 图片上传处理
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const filesToAdd = Array.from(files);

    const newImages: UploadedImage[] = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      selected: true
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

  // 紧凑模式：只显示操作按钮
  if (compactMode) {
    return (
      <div className="image-upload-section compact">
        <div className="compact-actions">
          <button 
            className="btn btn-secondary"
            onClick={onReset}
            disabled={parsing}
          >
            <X size={16} />
            清空重置
          </button>
          <button 
            className="btn btn-primary btn-parse"
            onClick={uploadType === 'pdf' ? onPdfParse : onParse}
            disabled={parsing || (uploadType === 'image' ? uploadedImages.length === 0 : !uploadedPdf)}
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
    );
  }

  return (
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
            />
            <div className="upload-zone-content">
              <Image size={48} className="upload-icon" />
              <h3>点击或拖拽上传图片</h3>
              <p>支持 JPG、PNG、WebP 格式，可上传多张图片</p>
              <p className="upload-count">已上传 {uploadedImages.length} 张</p>
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
                  onClick={onReset}
                  disabled={parsing}
                >
                  清空重置
                </button>
                <button 
                  className="btn btn-primary btn-parse"
                  onClick={onParse}
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
              <p>支持 PDF 格式，最大 50MB，可将每页转换为图片进行识别</p>
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
                  onClick={onReset}
                  disabled={parsing}
                >
                  清空重置
                </button>
                <button 
                  className="btn btn-primary btn-parse"
                  onClick={onPdfParse}
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
  );
};

export default ImageUploadSection;

