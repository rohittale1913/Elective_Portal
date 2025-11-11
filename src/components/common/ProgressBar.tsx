import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  label?: string;
  color?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  total, 
  label,
  color = 'bg-blue-600'
}) => {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
          <span>{label}</span>
          <span>{progress}/{total} ({percentage}%)</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;