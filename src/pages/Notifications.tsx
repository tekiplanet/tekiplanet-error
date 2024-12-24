import { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  Trash2, 
  ExternalLink, 
  CheckCheck,
  Filter,
  Search,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from "@/components/ui/scroll-area"

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(search.toLowerCase()) ||
                         notification.message.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.read) ||
                         (filter === 'read' && notification.read)
    return matchesSearch && matchesFilter
  })

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="flex items-center gap-3 px-4 h-14">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
            </p>
          </div>
          {notifications.some(n => !n.read) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Search and Filter Bar */}
        <div className="p-4 space-y-3 border-t bg-muted/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full h-9">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All notifications</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 transition-colors",
                  !notification.read && "bg-muted/50"
                )}
              >
                <div className={cn(
                  "mt-1.5 h-2 w-2 rounded-full shrink-0",
                  !notification.read ? "bg-primary" : "bg-muted-foreground/30"
                )} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={cn(
                        "text-sm leading-tight break-words",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground break-words">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => markAsRead(notification.id)}
                          className="h-8 w-8"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    {notification.action_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs shrink-0"
                        onClick={() => navigate(notification.action_url)}
                      >
                        <ExternalLink className="mr-2 h-3 w-3" />
                        View details
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium">No notifications found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {search || filter !== 'all' 
                  ? 'Try adjusting your filters'
                  : "We'll notify you when something arrives"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 