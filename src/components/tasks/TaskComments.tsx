import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useComments, TaskComment } from '@/hooks/useComments';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trash2, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface TaskCommentsProps {
  taskId: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ taskId }) => {
  const { language } = useLanguage();
  const { profile } = useAuth();
  const isArabic = language === 'ar';
  const dateLocale = isArabic ? ar : enUS;
  
  const { comments, isLoading, createComment, deleteComment, isCreating } = useComments(taskId);
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    createComment(newComment, {
      onSuccess: () => setNewComment(''),
    });
  };

  const getAuthorName = (comment: TaskComment) => {
    if (!comment.author) return isArabic ? 'مستخدم' : 'User';
    return isArabic 
      ? (comment.author.full_name_ar || comment.author.full_name)
      : comment.author.full_name;
  };

  const getInitials = (comment: TaskComment) => {
    const name = comment.author?.full_name || 'U';
    return name.charAt(0).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground">
        {isArabic ? 'التعليقات' : 'Comments'} ({comments.length})
      </h4>

      {/* Comments List */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isArabic ? 'لا توجد تعليقات بعد' : 'No comments yet'}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {getInitials(comment)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{getAuthorName(comment)}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { 
                      addSuffix: true, 
                      locale: dateLocale 
                    })}
                  </span>
                  {comment.author_id === profile?.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* New Comment Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isArabic ? 'اكتب تعليقاً...' : 'Write a comment...'}
          className="min-h-[60px] resize-none flex-1"
          maxLength={1000}
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!newComment.trim() || isCreating}
          className="h-[60px] w-10"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export default TaskComments;
