import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-card p-6 ${
        hover ? 'transition-shadow hover:shadow-card-hover cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
