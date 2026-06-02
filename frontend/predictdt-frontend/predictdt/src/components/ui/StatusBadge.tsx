import React from 'react';

interface StatusBadgeProps {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}

export default function StatusBadge({ active, activeLabel = 'Ativo', inactiveLabel = 'Inativo' }: StatusBadgeProps) {
  return (
    <span className={active ? 'badge-active' : 'badge-inactive'}>
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{
          background: active ? '#22c55e' : '#ef4444',
          boxShadow: active ? '0 0 4px rgba(34,197,94,0.8)' : '0 0 4px rgba(239,68,68,0.8)',
        }}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}
