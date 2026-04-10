import React from 'react';

interface Props {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ActionButton({ label, onClick, className, disabled }: Props) {
  return (
    <button className={`action-btn ${className ?? ''}`} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
