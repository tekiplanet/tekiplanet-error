<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Events\NewNotification;
use Illuminate\Support\Str;

class NotificationService
{
    public function send($data, $users)
    {
        \Log::info('Creating notification:', $data);
        
        // Create the notification
        $notification = Notification::create([
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'icon' => $data['icon'] ?? null,
            'action_url' => $data['action_url'] ?? null,
            'data' => $data['extra_data'] ?? null,
        ]);

        \Log::info('Notification created:', ['id' => $notification->id]);

        // If users is a single user, convert to array
        $users = is_array($users) ? $users : [$users];

        // Attach notification to users
        foreach ($users as $user) {
            \Log::info('Attaching notification to user:', [
                'notification_id' => $notification->id,
                'user_id' => $user->id
            ]);

            $notification->users()->attach($user->id, [
                'id' => Str::uuid(),
                'read' => false
            ]);

            // Broadcast to each user
            \Log::info('Broadcasting notification');
            event(new NewNotification($notification, $user));
        }

        return $notification;
    }
} 