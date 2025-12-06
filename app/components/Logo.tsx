'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const logoSize = {
    sm: { width: 40, height: 40 },
    md: { width: 56, height: 56 },
    lg: { width: 80, height: 80 },
  };

  const textSize = {
    sm: { fontSize: '1.5rem' },
    md: { fontSize: '2rem' },
    lg: { fontSize: '2.75rem' },
  };

  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
      <div className="shrink-0">
        <Image
          src="/images/logo.png"
          alt="Legacy Verify Logo"
          width={logoSize[size].width}
          height={logoSize[size].height}
          className="object-contain"
          priority={size === 'lg'}
        />
      </div>
      {showText && (
        <span className="font-bold whitespace-nowrap" style={textSize[size]}>
          <span style={{ color: '#F15A24' }}>Legacy</span>
          <span className="text-primary">Verify</span>
        </span>
      )}
    </div>
  );
}

