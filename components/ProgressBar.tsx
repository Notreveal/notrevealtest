import React from 'react';

interface ProgressBarProps {
  progress: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  const safeProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className="w-full bg-slate-700 rounded-full h-2.5">
      <div
        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${safeProgress}%` }}
        aria-valuenow={safeProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      ></div>
      <span className="sr-only">{safeProgress.toFixed(0)}% Completo</span>
    </div>
  );
};

export default ProgressBar;