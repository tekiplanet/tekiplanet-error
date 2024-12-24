<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Support\Facades\Storage;

class BusinessProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'business_name',
        'business_email',
        'phone_number',
        'registration_number',
        'tax_number',
        'website',
        'description',
        'address',
        'city',
        'state',
        'country',
        'business_type',
        'status',
        'logo'
    ];

    protected $casts = [
        'status' => 'string'
    ];

    protected $appends = ['logo_url'];

    public function isActive()
    {
        return $this->status === 'active';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'business_id');
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function getLogoUrlAttribute()
    {
        if (!$this->logo) {
            return null;
        }
        return $this->logo ? Storage::disk('public')->url($this->logo) : null;
    }
} 