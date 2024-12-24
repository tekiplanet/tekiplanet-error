<?php

namespace App\Events;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $notification;
    public $user;

    public function __construct($notification, $user)
    {
     
        
        $this->notification = $notification;
        $this->user = $user;
    }

    public function broadcastOn()
    {
        $channelName = 'private-notifications.' . $this->user->id;
        return new PrivateChannel($channelName);
    }

    public function broadcastAs()
    {
        return 'NewNotification';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->notification->id,
            'type' => $this->notification->type,
            'title' => $this->notification->title,
            'message' => $this->notification->message,
            'icon' => $this->notification->icon,
            'action_url' => $this->notification->action_url,
            'created_at' => $this->notification->created_at,
            'read' => false
        ];
    }
} 