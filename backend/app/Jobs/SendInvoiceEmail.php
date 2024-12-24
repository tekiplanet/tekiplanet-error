<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\BusinessInvoice;
use Illuminate\Support\Facades\Log;
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
        try {
            // Reload invoice with relationships to ensure we have fresh data
            $invoice = BusinessInvoice::with(['items', 'business', 'customer'])
                ->findOrFail($this->invoice->id);

            Log::info('Preparing to send invoice email', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer->email ?? 'no email'
            ]);

            // Generate PDF
            $pdf = PDF::loadView('invoices.template', [
                'invoice' => $invoice
            ]);

            // Send email
            Mail::send('emails.invoice', ['invoice' => $invoice], function ($message) use ($pdf, $invoice) {
                $message->to($invoice->customer->email)
                       ->subject("Invoice #{$invoice->invoice_number}")
                       ->attachData(
                           $pdf->output(),
                           "invoice-{$invoice->invoice_number}.pdf"
                       );
            });

            Log::info('Invoice email sent successfully', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer->email
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send invoice email:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'invoice_id' => $this->invoice->id
            ]);
            
            throw $e;
        }
    }
} 