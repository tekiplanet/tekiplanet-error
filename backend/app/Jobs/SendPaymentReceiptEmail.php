<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\BusinessInvoicePayment;
use PDF;
use Mail;

class SendPaymentReceiptEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $payment;

    public function __construct(BusinessInvoicePayment $payment)
    {
        $this->payment = $payment;
    }

    public function handle()
    {
        $payment = $this->payment->load(['invoice.business', 'invoice.customer']);
        $invoice = $payment->invoice;

        // Generate receipt PDF
        $pdf = PDF::loadView('receipts.payment', [
            'payment' => $payment,
            'invoice' => $invoice
        ]);

        // Set custom paper size for receipt
        $pdf->setPaper([0, 0, 226.77, 425.197]); // 80mm x 150mm in points

        Mail::send('emails.payment', [
            'payment' => $payment,
            'invoice' => $invoice
        ], function ($message) use ($pdf, $invoice, $payment) {
            $message->to($invoice->customer->email)
                   ->subject("Payment Received - Invoice #{$invoice->invoice_number}")
                   ->attachData(
                       $pdf->output(),
                       "receipt-{$payment->id}.pdf"
                   );
        });
    }
} 