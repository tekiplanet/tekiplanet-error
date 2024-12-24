<?php

namespace App\Http\Controllers;

use App\Models\BusinessInvoice;
use App\Models\BusinessInvoiceItem;
use App\Models\BusinessProfile;
use App\Models\BusinessInvoicePayment;
use App\Models\BusinessCustomer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use TCPDF;
use App\Services\CurrencyService;
use App\Jobs\SendInvoiceEmail;
use App\Jobs\SendPaymentReceiptEmail;
use PDF;

class BusinessInvoiceController extends Controller
{
    protected $currencyService;

    public function __construct(CurrencyService $currencyService)
    {
        $this->currencyService = $currencyService;
    }

    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            $validator = Validator::make($request->all(), [
                'customer_id' => 'required|uuid',
                'invoice_number' => 'nullable|string|max:50',
                'amount' => 'required|numeric|min:0',
                'due_date' => 'required|date',
                'notes' => 'nullable|string',
                'theme_color' => 'nullable|string',
                'items' => 'required|array|min:1',
                'items.*.description' => 'required|string',
                'items.*.quantity' => 'required|numeric|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.amount' => 'required|numeric|min:0'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get business profile
            $businessProfile = auth()->user()->business_profile;
            if (!$businessProfile) {
                return response()->json(['message' => 'Business profile not found'], 404);
            }

            // Get customer to use their currency
            $customer = BusinessCustomer::findOrFail($request->customer_id);

            // Create invoice
            $invoice = BusinessInvoice::create([
                'business_id' => $businessProfile->id,
                'customer_id' => $request->customer_id,
                'invoice_number' => $request->invoice_number ?? 'INV-' . str_pad(mt_rand(1, 999999), 6, '0', STR_PAD_LEFT),
                'amount' => $request->amount,
                'currency' => $customer->currency,
                'paid_amount' => 0,
                'due_date' => $request->due_date,
                'status' => 'draft',
                'payment_reminder_sent' => false,
                'theme_color' => $request->theme_color,
                'notes' => $request->notes
            ]);

            // Create invoice items
            foreach ($request->items as $item) {
                BusinessInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'amount' => $item['amount']
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'invoice' => $invoice->load('items')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating invoice:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getCustomerInvoices($customerId)
    {
        try {
            $businessProfile = BusinessProfile::where('user_id', Auth::id())->first();
            if (!$businessProfile) {
                return response()->json(['message' => 'Business profile not found'], 404);
            }

            $invoices = BusinessInvoice::where('business_id', $businessProfile->id)
                ->where('customer_id', $customerId)
                ->with('items')
                ->get()
                ->map(function ($invoice) {
                    $invoice->status_details = $invoice->getStatusDetails();
                    return $invoice;
                });

            return response()->json($invoices);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch invoices',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getInvoice(BusinessInvoice $invoice)
    {
        try {
            $businessProfile = auth()->user()->business_profile;
            if (!$businessProfile) {
                return response()->json([
                    'message' => 'Business profile not found'
                ], 404);
            }

            // Check if the user owns the business
            if ($invoice->business_id !== $businessProfile->id) {
                return response()->json([
                    'message' => 'You are not authorized to view this invoice'
                ], 403);
            }

            // Load relationships and add status details
            $invoice->load(['customer', 'items', 'payments']);
            $invoice->status_details = $invoice->getStatusDetails();

            return response()->json($invoice);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch invoice:', [
                'id' => $invoice->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch invoice',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function download($id)
    {
        try {
            $invoice = BusinessInvoice::with(['items', 'business', 'customer'])
                ->findOrFail($id);

            // Generate PDF
            $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
            
            // Set document information
            $pdf->SetCreator(PDF_CREATOR);
            $pdf->SetAuthor($invoice->business->business_name);
            $pdf->SetTitle('Invoice #' . $invoice->invoice_number);

            // Remove default header/footer
            $pdf->setPrintHeader(false);
            $pdf->setPrintFooter(false);

            // Set margins
            $pdf->SetMargins(15, 15, 15);

            // Add a page
            $pdf->AddPage();

            // Set font
            $pdf->SetFont('helvetica', '', 10);

            // Get status details for styling
            $statusDetails = $invoice->getStatusDetails();
            $themeColor = $invoice->theme_color ?? '#0000FF';
            
            // Convert hex color to RGB for TCPDF
            list($r, $g, $b) = sscanf($themeColor, "#%02x%02x%02x");
            
            // Start with custom styling
            $html = '<style>
                .header { color: rgb('.$r.','.$g.','.$b.'); }
                .status { 
                    padding: 5px 10px;
                    color: white;
                    background-color: rgb('.$r.','.$g.','.$b.');
                    display: inline-block;
                    border-radius: 4px;
                }
                .total-section {
                    background-color: rgb('.($r*0.95).','.($g*0.95).','.($b*0.95).');
                    color: white;
                    padding: 10px;
                }
            </style>';

            // Business Information with theme color
            $html .= '<h1 class="header" style="font-size: 24pt;">INVOICE</h1>';
            $html .= '<div style="margin-bottom: 20px;">';
            $html .= '<strong style="color: rgb('.$r.','.$g.','.$b.');">' . $invoice->business->business_name . '</strong><br>';
            $html .= $invoice->business->address . '<br>';
            $html .= 'Email: ' . $invoice->business->business_email . '<br>';
            $html .= 'Phone: ' . $invoice->business->phone_number . '<br>';
            $html .= '</div>';

            // Invoice Details with Status
            $html .= '<div style="margin-bottom: 20px;">';
            $html .= '<table width="100%"><tr>';
            $html .= '<td width="60%">';
            $html .= '<strong>Invoice #:</strong> ' . $invoice->invoice_number . '<br>';
            $html .= '<strong>Date:</strong> ' . $invoice->created_at->format('Y-m-d') . '<br>';
            $html .= '<strong>Due Date:</strong> ' . $invoice->due_date->format('Y-m-d') . '<br>';
            $html .= '</td>';
            $html .= '<td width="40%" align="right">';
            $html .= '<div class="status">' . strtoupper($statusDetails['label']) . '</div>';
            $html .= '</td>';
            $html .= '</tr></table>';
            $html .= '</div>';

            // Customer Information
            $html .= '<div style="margin-bottom: 20px;">';
            $html .= '<strong>Bill To:</strong><br>';
            $html .= $invoice->customer->name . '<br>';
            $html .= $invoice->customer->address . '<br>';
            $html .= 'Email: ' . $invoice->customer->email . '<br>';
            $html .= 'Phone: ' . $invoice->customer->phone . '<br>';
            $html .= '</div>';

            // Items Table
            $html .= '<table border="1" cellpadding="5">';
            $html .= '<tr style="background-color: rgb('.$r.','.$g.','.$b.'); color: white;">';
            $html .= '<th>Description</th><th>Quantity</th><th>Unit Price</th><th>Amount</th></tr>';
            
            foreach ($invoice->items as $item) {
                $html .= '<tr>';
                $html .= '<td>' . $item->description . '</td>';
                $html .= '<td align="center">' . $item->quantity . '</td>';
                $html .= '<td align="right">' . number_format($item->unit_price, 2) . ' ' . $invoice->currency . '</td>';
                $html .= '<td align="right">' . number_format($item->amount, 2) . ' ' . $invoice->currency . '</td>';
                $html .= '</tr>';
            }

            // Totals section
            $html .= '<tr class="total-section">';
            $html .= '<td colspan="3" align="right"><strong>Total:</strong></td>';
            $html .= '<td align="right"><strong>' . number_format($invoice->amount, 2) . ' ' . $invoice->currency . '</strong></td>';
            $html .= '</tr>';
            
            if ($invoice->paid_amount > 0) {
                $html .= '<tr>';
                $html .= '<td colspan="3" align="right">Paid Amount:</td>';
                $html .= '<td align="right">' . number_format($invoice->paid_amount, 2) . ' ' . $invoice->currency . '</td>';
                $html .= '</tr>';
                
                $html .= '<tr>';
                $html .= '<td colspan="3" align="right"><strong>Balance Due:</strong></td>';
                $html .= '<td align="right"><strong>' . number_format($invoice->amount - $invoice->paid_amount, 2) . ' ' . $invoice->currency . '</strong></td>';
                $html .= '</tr>';
            }
            
            $html .= '</table>';

            // Add notes if any
            if ($invoice->notes) {
                $html .= '<div style="margin-top: 20px;">';
                $html .= '<strong style="color: rgb('.$r.','.$g.','.$b.');">Notes:</strong><br>';
                $html .= $invoice->notes;
                $html .= '</div>';
            }

            // Write HTML to PDF
            $pdf->writeHTML($html, true, false, true, false, '');

            // Stream the PDF directly
            return response()->streamDownload(
                function () use ($pdf) {
                    echo $pdf->Output('', 'S');
                },
                "invoice-{$invoice->invoice_number}.pdf",
                [
                    'Content-Type' => 'application/pdf',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0'
                ]
            );

        } catch (\Exception $e) {
            Log::error('Invoice download failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to download invoice'
            ], 500);
        }
    }

    public function send($id)
    {
        try {
            $invoice = BusinessInvoice::with(['items', 'business', 'customer'])
                ->findOrFail($id);

            // Queue the email sending process
            SendInvoiceEmail::dispatch($invoice);
            
            // Update status immediately
            $invoice->update([
                'status' => 'sent',
                'sent_at' => now()
            ]);

            return response()->json([
                'message' => 'Invoice sent successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Invoice sending failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to send invoice'
            ], 500);
        }
    }

    public function recordPayment(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $invoice = BusinessInvoice::findOrFail($id);
            
            $payment = BusinessInvoicePayment::create([
                'invoice_id' => $invoice->id,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'payment_date' => now(),
                'notes' => $request->notes
            ]);

            // Update invoice paid amount
            $invoice->paid_amount = $invoice->payments->sum('amount') + $request->amount;
            $invoice->status = $invoice->paid_amount >= $invoice->amount ? 'paid' : 'partially_paid';
            $invoice->save();

            // Send payment receipt email
            SendPaymentReceiptEmail::dispatch($payment);

            DB::commit();

            return response()->json([
                'message' => 'Payment recorded successfully',
                'payment' => $payment
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment recording failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to record payment'
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|string|in:' . implode(',', BusinessInvoice::$statuses)
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $invoice = BusinessInvoice::findOrFail($id);

            // Check if user owns the business
            if ($invoice->business->user_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Prevent status update if invoice is paid
            if ($invoice->status === BusinessInvoice::STATUS_PAID) {
                return response()->json([
                    'message' => 'Cannot update status of paid invoice'
                ], 422);
            }

            $invoice->update(['status' => $request->status]);

            return response()->json([
                'message' => 'Invoice status updated successfully',
                'invoice' => $invoice->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update invoice status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function generateInvoicePDF($invoice)
    {
        // Create PDF instance
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);

        // Set document information
        $pdf->SetCreator(PDF_CREATOR);
        $pdf->SetAuthor($invoice->business->business_name);
        $pdf->SetTitle('Invoice #' . $invoice->invoice_number);

        // Remove default header/footer
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(false);

        // Set margins
        $pdf->SetMargins(15, 15, 15);

        // Add a page
        $pdf->AddPage();

        // Set font
        $pdf->SetFont('helvetica', '', 10);

        // Add business logo if exists
        if ($invoice->business->logo_url) {
            $pdf->Image($invoice->business->logo_url, 15, 15, 40);
            $pdf->Ln(20);
        }

        // Add invoice content (same as downloadPDF method)
        // ... (copy the PDF generation code from downloadPDF)

        return $pdf->Output('', 'S');
    }

    public function getCustomerTransactions($customerId)
    {
        try {
            $businessProfile = BusinessProfile::where('user_id', Auth::id())->first();
            if (!$businessProfile) {
                return response()->json(['message' => 'Business profile not found'], 404);
            }

            // Get all invoice payments for the customer
            $transactions = BusinessInvoicePayment::whereHas('invoice', function ($query) use ($businessProfile, $customerId) {
                $query->where('business_id', $businessProfile->id)
                    ->where('customer_id', $customerId);
            })
            ->with(['invoice:id,invoice_number,currency'])
            ->orderBy('payment_date', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'payment_date' => $payment->payment_date->format('Y-m-d\TH:i:s.u\Z'),
                    'type' => 'payment',
                    'amount' => $payment->amount,
                    'currency' => $payment->invoice->currency,
                    'status' => 'completed',
                    'notes' => $payment->notes,
                    'invoice_number' => $payment->invoice->invoice_number
                ];
            });

            return response()->json($transactions);
        } catch (\Exception $e) {
            \Log::error('Error fetching customer transactions:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch customer transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createInvoice(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:business_customers,id',
            'invoice_number' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
            'theme_color' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.amount' => 'required|numeric|min:0'
        ]);

        // Get the customer to use their currency
        $customer = BusinessCustomer::findOrFail($request->customer_id);

        // Check if the user owns the business
        if ($customer->business_id !== auth()->user()->business_profile->id) {
            return response()->json([
                'message' => 'You are not authorized to create invoices for this customer'
            ], 403);
        }

        // Create the invoice
        $invoice = BusinessInvoice::create([
            'business_id' => auth()->user()->business_profile->id,
            'customer_id' => $request->customer_id,
            'invoice_number' => $request->invoice_number,
            'amount' => $request->amount,
            'currency' => $customer->currency,
            'due_date' => $request->due_date,
            'status' => 'draft',
            'notes' => $request->notes,
            'theme_color' => $request->theme_color
        ]);

        // Create invoice items
        foreach ($request->items as $item) {
            $invoice->items()->create([
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'amount' => $item['amount']
            ]);
        }

        return response()->json([
            'message' => 'Invoice created successfully',
            'invoice' => $invoice->fresh(['items'])
        ]);
    }

    public function show($id)
    {
        \Log::info('Fetching invoice:', ['id' => $id]);
        try {
            $invoice = BusinessInvoice::with(['items', 'business', 'customer', 'payments'])
                ->findOrFail($id);
            
            // Get the business profile
            $businessProfile = auth()->user()->business_profile;
            if (!$businessProfile) {
                \Log::error('Business profile not found for user:', ['user_id' => auth()->id()]);
                return response()->json([
                    'message' => 'Business profile not found'
                ], 404);
            }
            
            // Add authorization check
            if ($invoice->business_id !== $businessProfile->id) {
                \Log::error('Unauthorized access to invoice:', [
                    'invoice_id' => $id,
                    'user_id' => auth()->id(),
                    'business_id' => $businessProfile->id
                ]);
                abort(403);
            }

            \Log::info('Invoice found:', ['invoice' => $invoice->toArray()]);
            return response()->json($invoice);
        } catch (\Exception $e) {
            \Log::error('Error fetching invoice:', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Invoice not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function downloadReceipt($invoiceId, $paymentId)
    {
        try {
            $payment = BusinessInvoicePayment::with(['invoice.business', 'invoice.customer'])
                ->findOrFail($paymentId);
            
            // Check if payment belongs to the invoice
            if ($payment->invoice_id !== $invoiceId) {
                throw new \Exception('Payment does not belong to this invoice');
            }

            // Generate receipt PDF
            $pdf = PDF::loadView('receipts.payment', [
                'payment' => $payment,
                'invoice' => $payment->invoice
            ]);

            // Set custom paper size for receipt
            $pdf->setPaper([0, 0, 226.77, 425.197]); // 80mm x 150mm in points

            return response()->streamDownload(
                function () use ($pdf) {
                    echo $pdf->output();
                },
                "receipt-{$payment->id}.pdf",
                [
                    'Content-Type' => 'application/pdf',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0'
                ]
            );

        } catch (\Exception $e) {
            Log::error('Receipt download failed:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to download receipt'
            ], 500);
        }
    }
} 