import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXPreviewProps {
  text: string;
}

const KaTeXPreview: React.FC<KaTeXPreviewProps> = ({ text }) => {
  const hasKaTeX = useMemo(() => text.includes('$') || text.includes('\\(') || text.includes('\\['), [text]);

  if (!text || !hasKaTeX) return null;

  const renderMath = (content: string) => {
    // Basic implementation to extract and render latex blocks
    // Note: a more robust solution would parse the DOM/text properly.
    // For now, we replace $...$ with rendered katex spans
    try {
      const parts = content.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
      return parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2);
          const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
          return <div key={index} dangerouslySetInnerHTML={{ __html: html }} className="my-2" />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1);
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={index} dangerouslySetInnerHTML={{ __html: html }} />;
        }
        return <span key={index}>{part}</span>;
      });
    } catch (e) {
      return <span className="text-red-500 text-sm">Lỗi render KaTeX</span>;
    }
  };

  return (
    <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm text-gray-700 border border-blue-100 flex flex-col gap-1">
      <span className="text-xs font-semibold text-blue-600 uppercase">Preview Công thức:</span>
      <div>{renderMath(text)}</div>
    </div>
  );
};

export default KaTeXPreview;
