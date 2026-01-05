import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentService } from '../services';
import { Comment } from '../../app/types';

// Query keys for comments
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (complaintId: string | number) => [...commentKeys.lists(), complaintId] as const,
  details: () => [...commentKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
};

// Helper function to map API comment to Comment interface
const mapCommentFromAPI = (apiComment: Record<string, unknown>, complaintId: string): Comment => {
  // Store comment_by as number for API calls (update/delete)
  const commentBy = apiComment.comment_by || apiComment.user_id;
  const commentByNum = typeof commentBy === 'number' ? commentBy : parseInt(String(commentBy || '0'), 10);
  
  return {
    id: String(apiComment.id || apiComment.comment_id || ''),
    complaintId: String(complaintId),
    userId: String(commentByNum || ''), // Store as string for compatibility, but contains numeric value
    userName: String(apiComment.user_name || apiComment.name || apiComment.comment_by || 'Unknown'),
    userRole: (apiComment.role as any) || 'provider',
    message: String(apiComment.comment || apiComment.message || ''),
    isInternal: Boolean(apiComment.is_internal || apiComment.isInternal || false),
    mentions: (apiComment.mentions as string[]) || [],
    attachments: (apiComment.attachments as any[]) || [],
    createdAt: apiComment.created_at 
      ? new Date(String(apiComment.created_at)).toLocaleString()
      : new Date().toLocaleString(),
    updatedAt: apiComment.updated_at 
      ? new Date(String(apiComment.updated_at)).toLocaleString()
      : undefined,
  };
};

/**
 * Hook to get all comments
 * Note: The API endpoint get-user-comments seems to return all comments
 * You may need to filter by complaint_id on the client side
 */
export function useComments(complaintId?: string | number) {
  return useQuery({
    queryKey: complaintId ? commentKeys.list(complaintId) : commentKeys.lists(),
    queryFn: async () => {
      const response = await commentService.getComments();
      // Handle different response structures
      const comments = response?.comments || response?.data || response || [];
      const commentsList = Array.isArray(comments) ? comments : [];
      
      // If complaintId is provided, filter comments for that complaint
      if (complaintId) {
        const numericId = typeof complaintId === 'string' 
          ? parseInt(complaintId.replace('CMP-', '')) 
          : complaintId;
        
        const filteredComments = commentsList.filter((c: Record<string, unknown>) => {
          const cComplaintId = c.complaint_id || c.complaintId;
          return cComplaintId === numericId || cComplaintId === complaintId || String(cComplaintId) === String(complaintId);
        });
        
        return filteredComments.map((c: Record<string, unknown>) => 
          mapCommentFromAPI(c, String(complaintId))
        );
      }
      
      return commentsList.map((c: Record<string, unknown>) => 
        mapCommentFromAPI(c, String(c.complaint_id || c.complaintId || ''))
      );
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to add a comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      complaintId, 
      commentBy, 
      comment 
    }: { 
      complaintId: string | number; 
      commentBy: number; 
      comment: string;
    }) => commentService.addComment(complaintId, commentBy, comment),
    onSuccess: (_, variables) => {
      // Invalidate comments list to refetch
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.complaintId) });
    },
  });
}

/**
 * Hook to update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      complaintId, 
      commentBy, 
      comment 
    }: { 
      complaintId: string | number; 
      commentBy: number; 
      comment: string;
    }) => commentService.updateComment(complaintId, commentBy, comment),
    onSuccess: (_, variables) => {
      // Invalidate comments list to refetch
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.complaintId) });
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      complaintId, 
      commentBy 
    }: { 
      complaintId: string | number; 
      commentBy: number;
    }) => commentService.deleteComment(complaintId, commentBy),
    onSuccess: (_, variables) => {
      // Invalidate comments list to refetch
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      queryClient.invalidateQueries({ queryKey: commentKeys.list(variables.complaintId) });
    },
  });
}

