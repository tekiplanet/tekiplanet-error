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

    public function __construct(Transaction $transaction, BankAccount $bankAccount)
    {
        $this->transaction = $transaction;
        $this->bankAccount = $bankAccount;
    }

    public function build()
    {
        return $this->markdown('emails.withdrawal-request')
                    ->subject('Withdrawal Request Received');
    }
} 