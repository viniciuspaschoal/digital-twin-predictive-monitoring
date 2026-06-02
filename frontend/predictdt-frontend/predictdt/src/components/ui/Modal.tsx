import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 400, md: 560, lg: 720 };

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div
        className="glass-card w-full animate-fade-in flex flex-col max-h-[90vh]"
        style={{ maxWidth: sizes[size], animation: 'fadeIn 0.2s ease-out' }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: '#30363D' }}>
          <h2 className="font-display font-semibold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}
