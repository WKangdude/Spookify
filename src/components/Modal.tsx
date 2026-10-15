import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidthClass} rounded-2xl bg-[#130722] border-2 border-purple-500/40 p-6 shadow-2xl glow-purple z-10 my-auto text-slate-100 transform transition-all duration-300 animate-in fade-in zoom-in-95`}
      >
        {/* Glow corner accents */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-purple-900/50">
          <div>
            <h3 className="font-['Creepster'] text-2xl tracking-wider text-orange-400 text-shadow-spooky">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-purple-300/80 mt-1 font-medium">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/50 transition-colors border border-purple-800/40"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="mt-4 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
