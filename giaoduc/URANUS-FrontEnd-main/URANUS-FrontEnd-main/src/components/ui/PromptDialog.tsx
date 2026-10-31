import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
  title: string;
  message?: string;
  placeholder?: string;
  submitText?: string;
  cancelText?: string;
  initialValue?: string;
  isLoading?: boolean;
}

const PromptDialog: React.FC<PromptDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = 'Nhập nội dung...',
  submitText = 'Xác nhận',
  cancelText = 'Hủy',
  initialValue = '',
  isLoading = false
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!value.trim()}
          >
            {submitText}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        {message && <p className="mb-4 text-vutruNhat font-medium">{message}</p>}
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
      </form>
    </Modal>
  );
};

export default PromptDialog;
