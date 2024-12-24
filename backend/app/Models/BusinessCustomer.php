<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class BusinessCustomer extends Model
{
    use HasUuids;

    protected $fillable = [
        'business_id',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'country',
        'currency',
        'tags',
        'notes',
        'status'
    ];

    protected $casts = [
        'tags' => 'array',
        'status' => 'string'
    ];

    public function business()
    {
        return $this->belongsTo(BusinessProfile::class, 'business_id');
    }

    public function invoices()
    {
        return $this->hasMany(BusinessInvoice::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasManyThrough(
            BusinessInvoicePayment::class,
            BusinessInvoice::class,
            'customer_id', // Foreign key on invoices table
            'invoice_id', // Foreign key on payments table
            'id', // Local key on customers table
            'id' // Local key on invoices table
        );
    }

    public function getTotalSpent()
    {
        return $this->invoices()
            ->with('payments')
            ->get()
            ->sum(function ($invoice) {
                return $invoice->payments->sum('amount');
            });
    }
} 