import Pusher from 'pusher-js';
import { apiClient } from '@/lib/axios';

class NotificationService {
    private pusher: Pusher;
    private channel: any;
    private isConnected: boolean = false;

    constructor() {
        const token = localStorage.getItem('token');
        console.log('Token for Pusher auth:', token); // Debug log

        this.pusher = new Pusher('2f14ebc513254579c12a', {
            cluster: 'eu',
            forceTLS: true,
            authEndpoint: 'http://192.168.43.190:8000/api/broadcasting/auth',
            auth: {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-Socket-ID': this.pusher?.connection?.socket_id
                }
            }
        });

        // Monitor connection status
        this.pusher.connection.bind('connected', () => {
            console.log('✅ Pusher connected');
            this.isConnected = true;
        });

        this.pusher.connection.bind('error', (error: any) => {
            console.error('Pusher connection error:', {
                error,
                headers: this.pusher.config.auth?.headers,
                socketId: this.pusher.connection.socket_id
            });
        });
    }

    subscribe(userId: string, onNotification: (data: any) => void) {
        const channelName = `private-notifications.${userId}`;
        console.log('🔌 Subscribing to channel:', {
            channelName,
            token: localStorage.getItem('token'),
            socketId: this.pusher.connection.socket_id
        });
        
        try {
            this.channel = this.pusher.subscribe(channelName);
            
            this.channel.bind('pusher:subscription_succeeded', () => {
                console.log('✅ Successfully subscribed to channel:', channelName);
            });

            this.channel.bind('pusher:subscription_error', (error: any) => {
                console.error('❌ Subscription error:', {
                    error,
                    auth: this.pusher.config.auth,
                    socketId: this.pusher.connection.socket_id
                });
            });

            this.channel.bind('NewNotification', (data: any) => {
                console.log('📨 Received notification data:', data);
                try {
                    onNotification(data);
                    console.log('✅ Notification handler executed successfully');
                } catch (error) {
                    console.error('❌ Error in notification handler:', error);
                }
            });
        } catch (error) {
            console.error('Subscribe error:', error);
        }
    }

    unsubscribe(userId: string) {
        const channelName = `private-notifications.${userId}`;
        if (this.channel) {
            console.log('🔌 Unsubscribing from channel:', channelName);
            this.pusher.unsubscribe(channelName);
        }
    }

    async getNotifications(page = 1) {
        const response = await apiClient.get(`/notifications?page=${page}`);
        return response.data;
    }

    async markAsRead(notificationId: string) {
        const response = await apiClient.post(`/notifications/${notificationId}/read`);
        return response.data;
    }

    async markAllAsRead() {
        const response = await apiClient.post('/notifications/mark-all-read');
        return response.data;
    }

    async deleteNotification(id: string) {
        try {
            const response = await apiClient.delete(`/notifications/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Delete notification error:', {
                error,
                response: error.response?.data
            });
            throw error;
        }
    }
}

export const notificationService = new NotificationService(); 