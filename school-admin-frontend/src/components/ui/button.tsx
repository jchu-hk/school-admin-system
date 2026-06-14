import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  // If a custom className is provided that includes layout/color overrides (e.g. "p-2 text-blue-600"),
  // use it directly without the default base styles so callers can fully control appearance.
  const hasCustomStyle = className.length > 0;

  return (
    <button
      type={type}
      className={hasCustomStyle ? `inline-flex items-center justify-center rounded-lg transition-colors ${className}` : baseStyles}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
