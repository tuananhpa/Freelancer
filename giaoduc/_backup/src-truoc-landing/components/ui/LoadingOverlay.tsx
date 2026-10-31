import React from 'react';
import ReactDOM from 'react-dom';

interface LoadingOverlayProps {
  text?: string;
  inline?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ text = "Đang tải...", inline = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-bounce mb-6">
        <div className="w-24 h-24 bg-white dark:bg-night-elevated rounded-[2rem] flex items-center justify-center shadow-xl border-4 border-cam/30 relative overflow-hidden group">
          <div className="absolute inset-0 bg-cam/10 animate-pulse"></div>
          <img src="/logo.svg" alt="Loading Logo" className="w-16 h-16 object-contain z-10" />
        </div>
      </div>
      <p className="text-xl font-body font-bold text-vutru dark:text-gray-200 animate-pulse tracking-wide">{text}</p>
    </div>
  );

  if (inline) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        {content}
      </div>
    );
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 dark:bg-night-page/60 backdrop-blur-md animate-fade-in">
      {content}
    </div>,
    document.body
  );
};

export default LoadingOverlay;
