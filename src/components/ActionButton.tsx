import React from 'react';

interface Props {
  label: string;
  onClick: () => void;
  className?: string;
}

export default function ActionButton({ label, onClick, className }: Props) {
  return (
    <button className={`action-btn ${className ?? ''}`} onClick={onClick}>
      {label}
    </button>
  );
}
