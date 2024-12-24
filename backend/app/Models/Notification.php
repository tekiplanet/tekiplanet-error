<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Notification extends Model
{
    use HasUuids;

    protected $fillable = [
        'type',
        'title',
        'message',
        'icon',
        'action_url',
        'data'
    ];

    protected $casts = [
        'data' => 'array'
    ];

    // Notification types
    const TYPE_SYSTEM = 'system';
    const TYPE_COURSE = 'course';
    const TYPE_BUSINESS = 'business';
    const TYPE_PROFESSIONAL = 'professional';
    const TYPE_PAYMENT = 'payment';
    const TYPE_PROFILE = 'profile';

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_notifications')
            ->withPivot('read', 'read_at')
            ->withTimestamps();
    }

    public function userNotifications()
    {
        return $this->hasMany(UserNotification::class);
    }
} 