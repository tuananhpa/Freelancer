import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

import Portal from './Portal';
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full m-4',
  };

  return (
    <Portal><div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-fade-in">
      <div 
        className="absolute inset-0 bg-vutru/40 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div 
        className={`relative w-full ${maxWidthClasses[maxWidth]} mx-2 sm:mx-0 bg-white rounded-t-[28px] sm:rounded-[32px] shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-scale-in`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b border-gray-100">
          <h2 className="text-lg sm:text-2xl font-extrabold text-vutru font-body truncate pr-2">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-8 overflow-y-auto min-h-0">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-100 bg-gray-50/50 rounded-b-[28px] sm:rounded-b-[32px]">
            {footer}
          </div>
        )}
      </div>
    </div></Portal>
  );
};

export default Modal;
