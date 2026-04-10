import React from 'react';

interface Props {
  label: string;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export default function ActionButton({ label, onClick, className, disabled }: Props) {
  const classes = ['action-btn', className ?? '', disabled ? 'desactive' : ''].join(' ').trim();

  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
