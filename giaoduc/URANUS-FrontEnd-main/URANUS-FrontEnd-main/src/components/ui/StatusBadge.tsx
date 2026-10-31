import React from 'react';
import Badge from './Badge';

export type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'banned' 
  | 'pending' 
  | 'archived'
  | 'unknown';

interface StatusBadgeProps {
  status: StatusType | string;
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className = '' }) => {
  const getSemanticVariant = (s: string) => {
    switch (s.toLowerCase()) {
      case 'active':
      case 'success':
      case 'completed':
        return 'success';
      case 'banned':
      case 'danger':
      case 'error':
      case 'failed':
        return 'danger';
      case 'pending':
      case 'warning':
        return 'warning';
      case 'inactive':
      case 'archived':
      case 'neutral':
      default:
        return 'neutral';
    }
  };

  const variant = getSemanticVariant(status);

  return (
    <Badge variant={variant as any} className={className}>
      {children}
    </Badge>
  );
};
