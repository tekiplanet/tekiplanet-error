import { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  Trash2, 
  ExternalLink, 
  CheckCheck,
  Filter,
  Search
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
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your notifications and preferences
          </p>
        </div>
        <Button
          variant="outline"
          onClick={markAllAsRead}
          disabled={!notifications.some(n => !n.read)}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            prefix={<Search className="h-4 w-4 text-muted-foreground" />}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
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

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                !notification.read && "bg-muted/50"
              )}
            >
              <div className={cn(
                "mt-1 h-2 w-2 rounded-full",
                !notification.read ? "bg-primary" : "bg-muted-foreground/30"
              )} />
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={cn(
                      "text-sm",
                      !notification.read && "font-medium"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                  {notification.action_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-lg font-medium">No notifications found</h3>
            <p className="text-muted-foreground">
              {search || filter !== 'all' 
                ? 'Try adjusting your filters'
                : "We'll notify you when something arrives"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 