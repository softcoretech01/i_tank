import React from 'react';

export const Button = ({ children, onClick, variant = 'primary', icon: Icon, type = 'button', disabled = false, size = 'md', className = '', style = {} }) => {
  
  const baseStyle = 'flex items-center justify-center rounded-md font-medium shadow-sm transition-all duration-150 ease-in-out';
  
  const hasChildren = React.Children.count(children) > 0;

  // Apply padding based on size and if there is text
  const sizeStyles = {
    sm: hasChildren ? 'px-2 py-1 text-xs' : 'p-1.5',
    md: hasChildren ? 'px-4 py-2 text-sm' : 'p-2',
  };

  // Color variants
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400',
    outline: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  };

  const disabledStyle = 'disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Only apply margin to icon if there is text
  const iconMargin = hasChildren ? (size === 'md' ? 'mr-2' : 'mr-1') : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={`${baseStyle} ${sizeStyles[size]} ${variants[variant]} ${disabledStyle} ${className}`}
    >
      {Icon && <Icon className={`w-4 h-4 ${iconMargin}`} />}
      {children}
    </button>
  );
};