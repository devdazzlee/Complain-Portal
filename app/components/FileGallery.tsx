'use client';

import React, { useState } from 'react';
import { FileAttachment } from '../types';

interface FileGalleryProps {
  files: FileAttachment[];
  onDelete?: (fileId: string) => void;
  canDelete?: boolean;
}

export default function FileGallery({ files, onDelete, canDelete = false }: FileGalleryProps) {
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (files.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
        {files.map(file => (
          <div
            key={file.id}
            className="rounded-lg p-3 md:p-4 cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: '#2A2B30', border: '2px solid #E6E6E6' }}
            onClick={() => setPreviewFile(file)}
          >
            <div className="flex flex-col items-center gap-2">
              {file.type.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-24 md:h-32 object-cover rounded"
                />
              ) : (
                <div className="w-full h-24 md:h-32 flex items-center justify-center text-3xl md:text-4xl">
                  {getFileIcon(file.type)}
                </div>
              )}
              <div className="w-full text-center min-w-0">
                <p className="text-xs md:text-sm font-semibold truncate px-1" style={{ color: '#E6E6E6' }}>
                  {file.name}
                </p>
                <p className="text-xs" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                  {formatFileSize(file.size)}
                </p>
              </div>
              {canDelete && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(file.id);
                  }}
                  className="px-2 md:px-3 py-1 rounded text-xs md:text-sm mt-2 whitespace-nowrap"
                  style={{ backgroundColor: '#FF3F3F', color: '#E6E6E6', minHeight: '32px' }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] overflow-auto rounded-lg p-4 md:p-6"
            style={{ backgroundColor: '#1F2022' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold break-words pr-2" style={{ color: '#E6E6E6' }}>
                {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-2xl md:text-3xl font-bold shrink-0"
                style={{ color: '#E6E6E6', minWidth: '32px', minHeight: '32px' }}
              >
                ×
              </button>
            </div>
            {previewFile.type.startsWith('image/') ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full h-auto rounded"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <div className="text-6xl mb-4">{getFileIcon(previewFile.type)}</div>
                <p className="text-lg mb-4" style={{ color: '#E6E6E6' }}>
                  {previewFile.name}
                </p>
                <a
                  href={previewFile.url}
                  download={previewFile.name}
                  className="px-6 py-3 rounded font-semibold"
                  style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6' }}
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

