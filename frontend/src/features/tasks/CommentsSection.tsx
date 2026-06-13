import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, MessageSquare } from 'lucide-react';
import { commentApi } from '../../services/api';
import { toast } from 'sonner';

interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string | null;
  user_name: string | null;
  user_email: string | null;
}

interface CommentsSectionProps {
  taskId: number;
  currentUserId: number;
}

export const CommentsSection = ({ taskId, currentUserId }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    try {
      const res = await commentApi.listByTask(taskId);
      setComments(res.data);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await commentApi.create(taskId, newComment.trim());
      setComments(prev => [res.data, ...prev]);
      setNewComment('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentApi.delete(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        <h4 className="text-sm font-semibold text-slate-300">Comments</h4>
        <span className="text-xs text-slate-500">({comments.length})</span>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 rounded-lg bg-surface-0 border border-glass-border text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || submitting}
          className="p-2 rounded-lg gradient-brand text-white hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-slate-500 text-sm py-8">No comments yet</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="group bg-surface-0/50 rounded-lg p-3 border border-glass-border">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full gradient-accent flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                    {comment.user_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-300">
                      {comment.user_name || 'Unknown'}
                    </span>
                    <span className="text-xs text-slate-600 ml-2">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                </div>
                {comment.user_id === currentUserId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm text-slate-300 mt-2 pl-8 leading-relaxed">{comment.content}</p>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>
    </div>
  );
};
