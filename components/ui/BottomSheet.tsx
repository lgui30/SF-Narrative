'use client';

import { useEffect, useRef, useCallback, type ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export default function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const currentTranslateY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    currentTranslateY.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (dragStartY.current === null || !sheetRef.current) return;
    const deltaY = e.touches[0].clientY - dragStartY.current;
    if (deltaY > 0) {
      currentTranslateY.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!sheetRef.current) return;
    if (currentTranslateY.current > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = 'translateY(0)';
    }
    dragStartY.current = null;
    currentTranslateY.current = 0;
  }, [onClose]);

  // Reset transform when opening
  useEffect(() => {
    if (isOpen && sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[420px] max-h-[75vh] bg-card-bg rounded-t-2xl shadow-2xl animate-slide-up flex flex-col"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 cursor-grab">
          <div className="w-8 h-0.5 rounded-full bg-fog-gray" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-5 pb-2">
            <h2 className="editorial-headline text-lg">{title}</h2>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
