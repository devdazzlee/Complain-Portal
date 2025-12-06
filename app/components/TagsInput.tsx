'use client';

import React, { useState, KeyboardEvent } from 'react';

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagsInput({ tags, onChange, placeholder = 'Add tags...' }: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onChange([...tags, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg min-h-[56px]" style={{ backgroundColor: '#1F2022', border: '2px solid #E6E6E6' }}>
      {tags.map(tag => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full text-sm font-semibold relative"
          style={{ 
            backgroundColor: '#2AB3EE', 
            color: '#E6E6E6', 
            paddingLeft: '12px', 
            paddingRight: '32px', 
            paddingTop: '6px',
            paddingBottom: '6px',
            minHeight: '32px'
          }}
        >
          <span style={{ 
            textAlign: 'center',
            display: 'block',
            width: 'calc(100% - 28px)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: '0 auto'
          }}>
            {tag}
          </span>
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="absolute text-lg leading-none flex items-center justify-center shrink-0"
            style={{ 
              color: '#E6E6E6', 
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none"
        style={{
          backgroundColor: 'transparent',
          color: '#E6E6E6',
          fontSize: '1.125rem',
          lineHeight: '1.5',
        }}
      />
    </div>
  );
}

