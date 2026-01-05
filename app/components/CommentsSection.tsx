'use client';

import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Comment } from '../types';
import Toast from './Toast';
import { useComments, useAddComment, useUpdateComment, useDeleteComment } from '../../lib/hooks';

interface CommentsSectionProps {
  complaintId: string;
}

export default function CommentsSection({ complaintId }: CommentsSectionProps) {
  const { currentUser } = useApp();
  
  // Use React Query hooks for comments
  const { data: commentsData = [], isLoading: commentsLoading, refetch } = useComments(complaintId);
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();

  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Get user ID as number (API expects number)
  const getUserId = (): number => {
    if (!currentUser) return 0;
    // Try to get numeric ID from user object
    const userId = (currentUser as any).user_id || (currentUser as any).id || currentUser.id;
    return typeof userId === 'number' ? userId : parseInt(String(userId), 10) || 0;
  };

  // Get numeric complaint ID
  const getNumericComplaintId = (): number => {
    const numericId = complaintId.replace('CMP-', '');
    return parseInt(numericId, 10) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setToast({ message: 'Please enter a comment', type: 'error' });
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setToast({ message: 'User not found', type: 'error' });
      return;
    }

    try {
      await addCommentMutation.mutateAsync({
        complaintId: getNumericComplaintId(),
        commentBy: userId,
        comment: newComment,
      });
      setNewComment('');
      setIsInternal(false);
      setToast({ message: 'Comment added successfully', type: 'success' });
      refetch();
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to add comment', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditMessage(comment.message);
  };

  const handleUpdate = async (comment: Comment) => {
    if (!editMessage.trim()) {
      setToast({ message: 'Please enter a comment', type: 'error' });
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setToast({ message: 'User not found', type: 'error' });
      return;
    }

    try {
      await updateCommentMutation.mutateAsync({
        complaintId: getNumericComplaintId(),
        commentBy: userId,
        comment: editMessage,
      });
      setEditingId(null);
      setEditMessage('');
      setToast({ message: 'Comment updated successfully', type: 'success' });
      refetch();
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to update comment', 
        type: 'error' 
      });
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setToast({ message: 'User not found', type: 'error' });
      return;
    }

    try {
      await deleteCommentMutation.mutateAsync({
        complaintId: getNumericComplaintId(),
        commentBy: userId,
      });
      setToast({ message: 'Comment deleted successfully', type: 'success' });
      refetch();
    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to delete comment', 
        type: 'error' 
      });
    }
  };

  const formatMessage = (message: string) => {
    // Simple text rendering - mentions can be enhanced later
    return message;
  };

  const canEditDelete = (comment: Comment) => {
    if (!currentUser) return false;
    const userId = getUserId();
    const commentUserId = typeof comment.userId === 'number' 
      ? comment.userId 
      : parseInt(String(comment.userId), 10);
    return userId === commentUserId || currentUser.role === 'admin';
  };

  const comments = commentsData || [];

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
      {commentsLoading ? (
        <div className="text-center py-8">
          <p style={{ color: '#E6E6E6', opacity: 0.7 }}>Loading comments...</p>
        </div>
      ) : (
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
                        onClick={() => handleDelete(comment)}
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
                        onClick={() => handleUpdate(comment)}
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
      )}

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
          placeholder="Type your comment..."
          className="w-full rounded-lg p-3 md:p-4"
          style={{
            backgroundColor: '#1F2022',
            border: '2px solid #E6E6E6',
            color: '#E6E6E6',
            fontSize: '1rem',
            minHeight: '100px',
          }}
          rows={4}
          disabled={addCommentMutation.isPending}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
          <button
            type="submit"
            disabled={!newComment.trim() || addCommentMutation.isPending}
            className="w-full sm:flex-1 px-4 md:px-6 py-2 rounded font-semibold text-base md:text-lg"
            style={{
              backgroundColor: (!newComment.trim() || addCommentMutation.isPending) ? '#2A2B30' : '#2AB3EE',
              color: '#E6E6E6',
              opacity: (!newComment.trim() || addCommentMutation.isPending) ? 0.5 : 1,
              minHeight: '44px',
            }}
          >
            {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}
