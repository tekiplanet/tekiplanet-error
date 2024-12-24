<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\BusinessInvoice;
use PDF;
use Mail;

class SendInvoiceEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $invoice;

    public function __construct(BusinessInvoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function handle()
    {
        $pdf = PDF::loadView('invoices.template', [
            'invoice' => $this->invoice
        ]);

        Mail::send('emails.invoice', ['invoice' => $this->invoice], function ($message) use ($pdf) {
            $message->to($this->invoice->customer->email)
                   ->subject("Invoice #{$this->invoice->invoice_number}")
                   ->attachData(
                       $pdf->output(),
                       "invoice-{$this->invoice->invoice_number}.pdf"
                   );
        });
    }
} 