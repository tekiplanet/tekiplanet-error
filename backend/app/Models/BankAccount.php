<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BankAccount extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'bank_name',
        'bank_code',
        'account_number',
        'account_name',
        'recipient_code',
        'is_verified',
        'is_default'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_default' => 'boolean'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function setAsDefault()
    {
        // Remove default status from all other accounts of this user
        static::where('user_id', $this->user_id)
            ->where('id', '!=', $this->id)
            ->update(['is_default' => false]);

        $this->update(['is_default' => true]);
    }
}
