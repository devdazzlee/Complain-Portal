'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Comment, FileAttachment } from '../types';
import Toast from './Toast';

interface CommentsSectionProps {
  complaintId: string;
}

export default function CommentsSection({ complaintId }: CommentsSectionProps) {
  const { currentUser, getComments, addComment, updateComment, deleteComment, uploadFile, users } = useApp();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    setComments(getComments(complaintId));
  }, [complaintId, getComments]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          setToast({ message: `File ${file.name} is too large (max 10MB)`, type: 'error' });
          continue;
        }
        const uploaded = await uploadFile(file);
        setAttachments(prev => [...prev, uploaded]);
      }
    } catch (error) {
      setToast({ message: 'Error uploading file', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleMention = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const userName = match[1];
      const user = users.find(u => u.name.toLowerCase().includes(userName.toLowerCase()));
      if (user) {
        mentions.push(user.id);
      }
    }
    return mentions;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && attachments.length === 0) return;

    const mentions = handleMention(newComment);
    addComment(complaintId, newComment, isInternal, mentions, attachments);
    setNewComment('');
    setIsInternal(false);
    setAttachments([]);
    setComments(getComments(complaintId));
    setToast({ message: 'Comment added successfully', type: 'success' });
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditMessage(comment.message);
  };

  const handleUpdate = (commentId: string) => {
    if (!editMessage.trim()) return;
    updateComment(complaintId, commentId, editMessage);
    setEditingId(null);
    setEditMessage('');
    setComments(getComments(complaintId));
    setToast({ message: 'Comment updated successfully', type: 'success' });
  };

  const handleDelete = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment(complaintId, commentId);
      setComments(getComments(complaintId));
      setToast({ message: 'Comment deleted successfully', type: 'success' });
    }
  };

  const formatMessage = (message: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      if (match.index > lastIndex) {
        parts.push(message.substring(lastIndex, match.index));
      }
      const userName = match[1];
      const user = users.find(u => u.name.toLowerCase().includes(userName.toLowerCase()));
      parts.push(
        <span key={match.index} style={{ color: '#2AB3EE', fontWeight: 'bold' }}>
          @{user?.name || userName}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.length) {
      parts.push(message.substring(lastIndex));
    }

    return parts.length > 0 ? parts : message;
  };

  const canEditDelete = (comment: Comment) => {
    return currentUser?.id === comment.userId || currentUser?.role === 'admin';
  };

  return (
    <div className="mt-6 md:mt-8">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6" style={{ color: '#E6E6E6' }}>
        Comments & Updates
      </h2>

      {/* Comments List */}
      <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
        {comments.length === 0 ? (
          <p className="text-base md:text-lg" style={{ color: '#E6E6E6', opacity: 0.7 }}>
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              className="rounded-lg p-4 md:p-6"
              style={{
                backgroundColor: comment.isInternal ? '#2A2B30' : '#1F2022',
                border: `2px solid ${comment.isInternal ? '#2AB3EE' : '#E6E6E6'}`,
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg shrink-0"
                    style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6' }}
                  >
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base md:text-lg break-words" style={{ color: '#E6E6E6' }}>
                      {comment.userName}
                      {comment.isInternal && (
                        <span className="ml-2 text-xs md:text-sm" style={{ color: '#2AB3EE' }}>
                          (Internal Note)
                        </span>
                      )}
                    </p>
                    <p className="text-xs md:text-sm" style={{ color: '#E6E6E6', opacity: 0.7 }}>
                      {comment.createdAt}
                      {comment.updatedAt && ` (edited)`}
                    </p>
                  </div>
                </div>
                {canEditDelete(comment) && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEdit(comment)}
                      className="px-2 md:px-3 py-1 rounded text-xs md:text-sm whitespace-nowrap"
                      style={{ backgroundColor: '#2AB3EE', color: '#E6E6E6', minHeight: '36px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="px-2 md:px-3 py-1 rounded text-xs md:text-sm whitespace-nowrap"
                      style={{ backgroundColor: '#FF3F3F', color: '#E6E6E6', minHeight: '36px' }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editMessage}
                    onChange={(e) => setEditMessage(e.target.value)}
                    className="w-full rounded-lg p-3"
                    style={{
                      backgroundColor: '#2A2B30',
                      border: '2px solid #E6E6E6',
                      color: '#E6E6E6',
                      fontSize: '1.125rem',
                      minHeight: '100px',
                    }}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="px-4 py-2 rounded font-semibold"
                      style={{ backgroundColor: '#009200', color: '#E6E6E6' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditMessage('');
                      }}
                      className="px-4 py-2 rounded font-semibold"
                      style={{ backgroundColor: '#2A2B30', color: '#E6E6E6', border: '2px solid #E6E6E6' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-base md:text-lg mb-3 break-words" style={{ color: '#E6E6E6' }}>
                    {formatMessage(comment.message)}
                  </p>
                  {comment.attachments && comment.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {comment.attachments.map(file => (
                        <a
                          key={file.id}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 md:px-3 py-1.5 md:py-2 rounded flex items-center gap-2 text-xs md:text-sm"
                          style={{ backgroundColor: '#2A2B30', color: '#2AB3EE' }}
                        >
                          <span>📎</span>
                          <span className="truncate max-w-[150px] md:max-w-none">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
        <div className="flex items-center gap-2 md:gap-4 mb-3 md:mb-4">
          {(currentUser?.role === 'provider' || currentUser?.role === 'admin') && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 md:w-5 md:h-5"
              />
              <span className="text-sm md:text-base" style={{ color: '#E6E6E6' }}>Internal Note (Provider/Admin only)</span>
            </label>
          )}
        </div>

        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Type your comment... Use @username to mention someone"
          className="w-full rounded-lg p-3 md:p-4"
          style={{
            backgroundColor: '#1F2022',
            border: '2px solid #E6E6E6',
            color: '#E6E6E6',
            fontSize: '1rem',
            minHeight: '100px',
          }}
          rows={4}
        />

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map(file => (
              <div
                key={file.id}
                className="px-2 md:px-3 py-1.5 md:py-2 rounded flex items-center gap-2 text-xs md:text-sm"
                style={{ backgroundColor: '#2A2B30', color: '#E6E6E6' }}
              >
                <span>📎</span>
                <span className="truncate max-w-[120px] md:max-w-none">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="ml-1 md:ml-2 text-base md:text-lg shrink-0"
                  style={{ color: '#FF3F3F', minWidth: '24px', minHeight: '24px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full sm:w-auto px-4 py-2 rounded font-semibold text-sm md:text-base whitespace-nowrap"
            style={{
              backgroundColor: uploading ? '#2A2B30' : '#2A2B30',
              color: '#E6E6E6',
              border: '2px solid #E6E6E6',
              opacity: uploading ? 0.5 : 1,
              minHeight: '44px',
            }}
          >
            {uploading ? 'Uploading...' : '📎 Attach Files'}
          </button>
          <button
            type="submit"
            disabled={(!newComment.trim() && attachments.length === 0) || uploading}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 rounded font-semibold text-base md:text-lg"
            style={{
              backgroundColor: (!newComment.trim() && attachments.length === 0) || uploading ? '#2A2B30' : '#2AB3EE',
              color: '#E6E6E6',
              opacity: (!newComment.trim() && attachments.length === 0) || uploading ? 0.5 : 1,
              minHeight: '44px',
            }}
          >
            Post Comment
          </button>
        </div>
      </form>
    </div>
  );
}

