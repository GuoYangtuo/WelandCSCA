import React, { useMemo, useEffect } from 'react';
import { Image, FileText, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { UploadedImage, UploadedPdf } from './types';

interface DocumentPreviewPanelProps {
  uploadType: 'image' | 'pdf';
  uploadedImages: UploadedImage[];
  uploadedPdf: UploadedPdf | null;
}

const DocumentPreviewPanel: React.FC<DocumentPreviewPanelProps> = React.memo(({
  uploadType,
  uploadedImages,
  uploadedPdf,
}) => {
  const [zoomLevel, setZoomLevel] = React.useState(100);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  
  // 缓存 PDF URL，只在 uploadedPdf 文件真正改变时重新创建
  // 使用文件名和大小作为依赖，确保稳定性
  const pdfUrl = useMemo(() => {
    if (uploadedPdf) {
      return URL.createObjectURL(uploadedPdf.file);
    }
    return null;
  }, [uploadedPdf?.name, uploadedPdf?.size]);
  
  // 清理 URL 对象，避免内存泄漏
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  // 图片预览模式
  if (uploadType === 'image' && uploadedImages.length > 0) {
    return (
      <div className="document-preview-panel">
        <div className="preview-panel-header">
          <div className="preview-title">
            <Image size={18} />
            <span>图片预览</span>
            <span className="preview-count">({uploadedImages.length}张)</span>
          </div>
          <div className="preview-controls">
            <button onClick={handleZoomOut} className="zoom-btn" title="缩小">
              <ZoomOut size={16} />
            </button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button onClick={handleZoomIn} className="zoom-btn" title="放大">
              <ZoomIn size={16} />
            </button>
            <button onClick={handleResetZoom} className="zoom-btn" title="重置">
              <RotateCw size={16} />
            </button>
          </div>
        </div>
        <div className="preview-content images-scroll-container">
          {uploadedImages.map((img, index) => (
            <div 
              key={index} 
              className={`preview-image-wrapper ${selectedImageIndex === index ? 'selected' : ''}`}
              onClick={() => setSelectedImageIndex(index === selectedImageIndex ? null : index)}
            >
              <div className="image-number">{index + 1}</div>
              <img 
                src={img.preview} 
                alt={`预览图片 ${index + 1}`}
                style={{ width: `${zoomLevel}%` }}
                className="preview-image"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // PDF 预览模式
  if (uploadType === 'pdf' && uploadedPdf && pdfUrl) {
    return (
      <div className="document-preview-panel">
        <div className="preview-panel-header">
          <div className="preview-title">
            <FileText size={18} />
            <span>PDF预览</span>
          </div>
          <div className="pdf-file-name">{uploadedPdf.name}</div>
        </div>
        <div className="preview-content pdf-embed-container">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            title="PDF预览"
            className="pdf-embed-frame"
            key={pdfUrl}
          />
        </div>
      </div>
    );
  }

  // 没有文件时的空状态
  return (
    <div className="document-preview-panel empty">
      <div className="empty-preview-state">
        {uploadType === 'image' ? (
          <>
            <Image size={48} />
            <p>上传图片后将在此处预览</p>
          </>
        ) : (
          <>
            <FileText size={48} />
            <p>上传PDF后将在此处预览</p>
          </>
        )}
      </div>
    </div>
  );
});

DocumentPreviewPanel.displayName = 'DocumentPreviewPanel';

export default DocumentPreviewPanel;

