import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { notificationService } from '@/services/notificationService';
import useAuthStore from '@/store/useAuthStore';
import { toast } from 'react-hot-toast';

interface NotificationContextType {
    notifications: any[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<any[]>(() => {
        const stored = localStorage.getItem('notifications');
        return stored ? JSON.parse(stored) : [];
    });
    
    const [unreadCount, setUnreadCount] = useState<number>(() => {
        return Number(localStorage.getItem('unreadCount') || '0');
    });

    const { user } = useAuthStore();

    const forceUpdate = useCallback((data: any) => {
        console.log('🔄 Forcing update with new notification:', data);
        
        const notification = {
            id: data.id,
            type: data.type,
            title: data.title,
            message: data.message,
            icon: data.icon,
            action_url: data.action_url,
            created_at: data.created_at,
            read: false
        };
        
        setNotifications(prev => {
            const newNotifications = [notification, ...prev];
            console.log('Updated notifications:', newNotifications);
            localStorage.setItem('notifications', JSON.stringify(newNotifications));
            return newNotifications;
        });
        
        setUnreadCount(prev => {
            const newCount = prev + 1;
            console.log('Updated unread count:', newCount);
            localStorage.setItem('unreadCount', String(newCount));
            return newCount;
        });

        toast.success(`${notification.title}: ${notification.message}`, {
            duration: 4000,
            position: 'top-right'
        });
    }, []);

    useEffect(() => {
        if (user?.id) {
            console.log('🔄 Setting up notifications for user:', user.id);
            
            loadNotifications();

            notificationService.subscribe(user.id, forceUpdate);

            return () => {
                notificationService.unsubscribe(user.id);
            };
        }
    }, [user?.id, forceUpdate]);

    const loadNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data.notifications.data);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            const data = await notificationService.markAsRead(id);
            setUnreadCount(data.unread_count);
            setNotifications(notifications.map(notification => 
                notification.id === id 
                    ? { ...notification, read: true } 
                    : notification
            ));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setUnreadCount(0);
            setNotifications(notifications.map(notification => ({
                ...notification,
                read: true
            })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await notificationService.deleteNotification(id);
            setNotifications(prev => prev.filter(notification => notification.id !== id));
            const wasUnread = notifications.find(n => n.id === id && !n.read);
            if (wasUnread) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            throw error;
        }
    };

    const value = useMemo(() => ({
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    }), [notifications, unreadCount]);

    useEffect(() => {
        console.log('Current notifications:', notifications);
        console.log('Current unread count:', unreadCount);
    }, [notifications, unreadCount]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}; 