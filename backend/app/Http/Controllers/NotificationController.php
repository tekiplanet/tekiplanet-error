<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->with('userNotifications')
            ->latest()
            ->paginate(10);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $request->user()->unreadNotifications()->count()
        ]);
    }

    public function markAsRead(Request $request, $id)
    {
        $userNotification = UserNotification::where('user_id', $request->user()->id)
            ->where('notification_id', $id)
            ->first();

        if ($userNotification) {
            $userNotification->markAsRead();
        }

        return response()->json([
            'message' => 'Notification marked as read',
            'unread_count' => $request->user()->unreadNotifications()->count()
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        UserNotification::where('user_id', $request->user()->id)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now()
            ]);

        return response()->json([
            'message' => 'All notifications marked as read'
        ]);
    }

    public function destroy($id)
    {
        try {
            // Find the notification
            $notification = UserNotification::where('notification_id', $id)
                ->where('user_id', auth()->id())
                ->first();

            if (!$notification) {
                return response()->json([
                    'error' => 'Notification not found'
                ], 404);
            }

            // Delete the notification
            $notification->delete();

            // Get updated unread count
            $unreadCount = UserNotification::where('user_id', auth()->id())
                ->where('read', false)
                ->count();

            return response()->json([
                'message' => 'Notification deleted successfully',
                'unread_count' => $unreadCount
            ]);
        } catch (\Exception $e) {
            
            return response()->json([
                'error' => 'Failed to delete notification',
                'details' => $e->getMessage()
            ], 500);
        }
    }
} 