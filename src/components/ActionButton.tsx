import React from 'react';

interface Props {
  label: string;
  onClick: () => void | Promise<void>;
  className?: string;
  disabled?: boolean;
}

export default function ActionButton({ label, onClick, className, disabled }: Props) {
  const classes = ['action-btn', className ?? '', disabled ? 'desactive' : ''].join(' ').trim();

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    try {
      const res = onClick();
      if (res && typeof (res as any).then === 'function') {
        (res as Promise<void>).then(() => scrollToTop()).catch(() => {});
      } else {
        scrollToTop();
      }
    } catch {
      scrollToTop();
    }
  };

  return (
    <button className={classes} onClick={handleClick} disabled={disabled}>
      {label}
    </button>
  );
}
