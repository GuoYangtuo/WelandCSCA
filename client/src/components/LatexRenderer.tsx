import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  children: string;
  className?: string;
  block?: boolean;
}

/**
 * LaTeX公式渲染组件
 * 支持行内公式 $...$ 和块级公式 $$...$$
 */
const LatexRenderer: React.FC<LatexRendererProps> = ({ children, className = '', block = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current || !children) return;

    // 渲染LaTeX公式
    const renderLatex = (text: string): string => {
      // 先处理块级公式 $$...$$
      let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
          });
        } catch (e) {
          console.error('LaTeX渲染错误:', e);
          return `<span class="latex-error">$$${latex}$$</span>`;
        }
      });

      // 再处理行内公式 $...$（避免匹配已处理的块级公式）
      result = result.replace(/\$([^\$\n]+?)\$/g, (_, latex) => {
        try {
          return katex.renderToString(latex.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
          });
        } catch (e) {
          console.error('LaTeX渲染错误:', e);
          return `<span class="latex-error">$${latex}$</span>`;
        }
      });

      return result;
    };

    containerRef.current.innerHTML = renderLatex(children);
  }, [children]);

  const Tag = block ? 'div' : 'span';

  return (
    <Tag
      ref={containerRef as any}
      className={`latex-content ${className}`}
    />
  );
};

export default LatexRenderer;


