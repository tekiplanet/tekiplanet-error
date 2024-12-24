<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\Transaction;
use App\Models\BankAccount;

class WithdrawalRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $transaction;
    public $bankAccount;
    public $formattedAmount;

    public function __construct(Transaction $transaction, BankAccount $bankAccount)
    {
        $this->transaction = $transaction;
        $this->bankAccount = $bankAccount;
        $this->formattedAmount = $this->formatAmount($transaction->amount);
    }

    protected function formatAmount($amount, $currency = 'NGN') 
    {
        $symbol = '₦';
        return $symbol . number_format($amount, 2);
    }

    public function build()
    {
        return $this->markdown('emails.withdrawal-request')
                    ->subject('Withdrawal Request Received');
    }
} 