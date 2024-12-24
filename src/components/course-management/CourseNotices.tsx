import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, BookOpen, Calendar, FileText, MessageSquare, AlertTriangle, Trash2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'sonner';
import { courseManagementService } from "@/services/courseManagementService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Notice {
  id: string;
  type: 'announcement' | 'resource' | 'assignment' | 'schedule' | 'discussion';
  title: string;
  content: string;
  date: Date;
  read: boolean;
  priority?: 'high' | 'normal';
}

export default function CourseNotices({ 
  courseId, 
  notices, 
  loading,
  onNoticeDelete 
}: { 
  courseId?: string, 
  notices: Notice[], 
  loading: boolean,
  onNoticeDelete?: (noticeId: string) => void 
}) {
  const [showFallbackNotices, setShowFallbackNotices] = React.useState(false);
  const [selectedNotice, setSelectedNotice] = React.useState<Notice | null>(null);

  const handleDeleteNotice = React.useCallback(async (noticeId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const result = await courseManagementService.deleteUserCourseNotice(noticeId);
      
      if (result.success) {
        toast.success('Notice removed successfully');
        
        // Call the parent component's delete handler if provided
        if (onNoticeDelete) {
          onNoticeDelete(noticeId);
        }
      } else {
        toast.error(result.message || 'Failed to remove notice');
      }
    } catch (error) {
      console.error('Error deleting notice:', error);
      toast.error('An unexpected error occurred');
    }
  }, [onNoticeDelete]);

  React.useEffect(() => {
    if (loading === false && notices.length === 0) {
      toast.warning('No new notifications', {
        description: 'Showing default notifications',
        duration: 3000
      });
      setShowFallbackNotices(true);
    }
  }, [loading, notices]);

  const getNoticeIcon = (type: Notice['type']) => {
    switch (type) {
      case 'announcement':
        return <Bell className="h-4 w-4" />;
      case 'resource':
        return <BookOpen className="h-4 w-4" />;
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      case 'schedule':
        return <Calendar className="h-4 w-4" />;
      case 'discussion':
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine which notices to show
  const displayNotices = showFallbackNotices 
    ? [
        {
          id: 'fallback-1',
          type: 'announcement',
          title: 'Course Communication Channel',
          content: 'Please check your email or LMS for important course updates.',
          date: new Date(),
          read: false,
          priority: 'high'
        }
      ] 
    : notices;

  // Empty state
  if (!displayNotices || displayNotices.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px] text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Notices Available</h3>
        <p className="text-sm text-muted-foreground">
          {showFallbackNotices 
            ? 'Unable to retrieve course notices. Please contact support.' 
            : 'There are currently no notifications for this course.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Course Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {showFallbackNotices 
                ? 'Default notifications - please check other communication channels' 
                : `${displayNotices.filter(n => !n.read).length} unread notifications`}
            </p>
          </div>
          {displayNotices.filter(n => !n.read).length > 0 && (
            <Badge variant="secondary" className="bg-primary text-primary-foreground">
              {displayNotices.filter(n => !n.read).length} New
            </Badge>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-16rem)] w-full pr-4 md:pr-6">
          <div className="space-y-3">
            {displayNotices.map((notice) => (
              <Card 
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer active:scale-[0.99] ${
                  !notice.read ? 'bg-primary/5' : ''
                } ${
                  showFallbackNotices ? 'border-yellow-500/20' : 'border-none'
                } shadow-sm`}
              >
                {!notice.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                )}
                
                <CardContent className="p-3 md:p-4">
                  <div className="flex gap-3 md:gap-4">
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                      notice.priority === 'high' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-muted text-muted-foreground'
                    } transition-colors group-hover:bg-primary/10 group-hover:text-primary`}>
                      {getNoticeIcon(notice.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 md:gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h3 className="font-medium leading-none truncate group-hover:text-primary transition-colors">
                            {notice.title}
                          </h3>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                            {notice.content}
                          </p>
                        </div>
                        
                        {!showFallbackNotices && (
                          <button 
                            onClick={(e) => handleDeleteNotice(notice.id, e)}
                            className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                            title="Remove Notice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge 
                          variant={notice.priority === 'high' ? "destructive" : "secondary"} 
                          className="capitalize text-[10px]"
                        >
                          {notice.type}
                        </Badge>
                        
                        {(notice.priority === 'high' || showFallbackNotices) && (
                          <Badge 
                            variant="destructive" 
                            className="text-[10px] bg-destructive/10 text-destructive border-none"
                          >
                            {showFallbackNotices ? 'Fallback' : 'Important'}
                          </Badge>
                        )}
                        
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDate(notice.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Empty state */}
            {displayNotices.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {showFallbackNotices 
                    ? 'Unable to retrieve course notices. Please contact support.' 
                    : "You're all caught up! Check back later for new notifications."}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Notice Details Modal */}
        <Dialog open={!!selectedNotice} onOpenChange={() => setSelectedNotice(null)}>
          <DialogContent className="sm:max-w-[500px]">
            {selectedNotice && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedNotice.priority === 'high' 
                        ? 'bg-destructive/10 text-destructive' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getNoticeIcon(selectedNotice.type)}
                    </div>
                    <DialogTitle>{selectedNotice.title}</DialogTitle>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant={selectedNotice.priority === 'high' ? "destructive" : "secondary"} 
                      className="capitalize"
                    >
                      {selectedNotice.type}
                    </Badge>
                    
                    {(selectedNotice.priority === 'high' || showFallbackNotices) && (
                      <Badge 
                        variant="destructive" 
                        className="bg-destructive/10 text-destructive border-none"
                      >
                        {showFallbackNotices ? 'Fallback' : 'Important'}
                      </Badge>
                    )}
                    
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selectedNotice.date)}
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed">
                    {selectedNotice.content}
                  </p>

                  {!showFallbackNotices && (
                    <div className="flex justify-end">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          handleDeleteNotice(selectedNotice.id);
                          setSelectedNotice(null);
                        }}
                      >
                        Delete Notification
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}