'use client';

import React from 'react';
import { Priority } from '../types';

interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md' | 'lg';
}

export default function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case 'Urgent':
        return '#FF3F3F';
      case 'High':
        return '#FF8800';
      case 'Medium':
        return '#2AB3EE';
      case 'Low':
        return '#009200';
      default:
        return '#E6E6E6';
    }
  };

  const getPriorityIcon = (p: Priority) => {
    switch (p) {
      case 'Urgent':
        return '🔴';
      case 'High':
        return '🟠';
      case 'Medium':
        return '🔵';
      case 'Low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        backgroundColor: getPriorityColor(priority),
        color: '#E6E6E6',
      }}
    >
      <span>{getPriorityIcon(priority)}</span>
      <span>{priority}</span>
    </span>
  );
}

