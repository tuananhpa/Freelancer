import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-night-border';
  
  let variantClasses = '';
  if (variant === 'circular') variantClasses = 'rounded-full';
  else if (variant === 'text') variantClasses = 'rounded-md';
  else variantClasses = 'rounded-xl';

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
