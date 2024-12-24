<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Carbon\Carbon;

class BusinessInvoice extends Model
{
    use HasUuids;

    protected $fillable = [
        'business_id',
        'customer_id',
        'invoice_number',
        'amount',
        'currency',
        'paid_amount',
        'due_date',
        'status',
        'payment_reminder_sent',
        'theme_color',
        'notes'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
        'status' => 'string'
    ];

    public function business()
    {
        return $this->belongsTo(BusinessProfile::class, 'business_id');
    }

    public function customer()
    {
        return $this->belongsTo(BusinessCustomer::class, 'customer_id');
    }

    public function payments()
    {
        return $this->hasMany(BusinessInvoicePayment::class, 'invoice_id');
    }

    public function items()
    {
        return $this->hasMany(BusinessInvoiceItem::class, 'invoice_id');
    }

    public function getEffectiveStatus()
    {
        // If the invoice is fully paid (paid_amount equals amount), it's always "paid"
        if ($this->paid_amount >= $this->amount) {
            return 'paid';
        }

        // If there are payments but not fully paid, it's "partially_paid"
        if ($this->paid_amount > 0) {
            return 'partially_paid';
        }

        // If the due date has passed and it's not paid or partially paid, it's "overdue"
        if ($this->due_date < Carbon::now() && $this->paid_amount < $this->amount) {
            return 'overdue';
        }

        // Otherwise, return the current status
        return $this->status;
    }

    public function getStatusDetails()
    {
        $effectiveStatus = $this->getEffectiveStatus();
        $paidAmount = $this->paid_amount;
        $remainingAmount = $this->amount - $paidAmount;
        $daysOverdue = ($this->due_date < Carbon::now() && $remainingAmount > 0) ? 
            Carbon::now()->diffInDays($this->due_date) : 0;

        $details = [
            'status' => $effectiveStatus,
            'paid_amount' => $paidAmount,
            'remaining_amount' => $remainingAmount,
            'is_overdue' => $effectiveStatus === 'overdue' && $remainingAmount > 0,
            'days_overdue' => $daysOverdue,
        ];

        switch ($effectiveStatus) {
            case 'paid':
                $details['label'] = 'Paid';
                $details['color'] = 'success';
                $details['description'] = 'Payment completed';
                break;
            case 'partially_paid':
                $details['label'] = 'Partially Paid';
                $details['color'] = 'info';
                $details['description'] = 'Partial payment received';
                break;
            case 'overdue':
                // Don't show overdue if there's no remaining balance
                if ($remainingAmount <= 0) {
                    $details['label'] = 'Paid';
                    $details['color'] = 'success';
                    $details['description'] = 'Payment completed';
                } else {
                    $details['label'] = 'Overdue';
                    $details['color'] = 'destructive';
                    $details['description'] = $daysOverdue . ' days overdue';
                }
                break;
            case 'sent':
                $details['label'] = 'Sent';
                $details['color'] = 'info';
                $details['description'] = 'Invoice sent to customer';
                break;
            case 'draft':
                $details['label'] = 'Draft';
                $details['color'] = 'muted';
                $details['description'] = 'Invoice not sent yet';
                break;
            case 'cancelled':
                $details['label'] = 'Cancelled';
                $details['color'] = 'muted';
                $details['description'] = 'Invoice cancelled';
                break;
            default:
                $details['label'] = 'Pending';
                $details['color'] = 'warning';
                $details['description'] = 'Payment pending';
                break;
        }

        return $details;
    }
} 