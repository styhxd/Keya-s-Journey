import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message }) => {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
    } else {
      const timeoutId = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="relative text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mb-6 mx-auto"></div>
        <p className="text-2xl sm:text-3xl text-white/90 font-bold tracking-wider">{message}</p>
      </div>
    </div>
  );
};