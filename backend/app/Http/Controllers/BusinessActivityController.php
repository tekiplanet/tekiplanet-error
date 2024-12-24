<?php

namespace App\Http\Controllers;

use App\Models\BusinessCustomer;
use App\Models\BusinessInvoice;
use App\Models\BusinessInvoicePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BusinessActivityController extends Controller
{
    public function index(Request $request)
    {
        try {
            $businessId = $request->user()->businessProfile->id;
            $perPage = 10;
            $page = $request->input('page', 1);
            $search = $request->input('search');
            $type = $request->input('type');
            $from = $request->input('from');
            $to = $request->input('to');

            // Get customers
            $customers = BusinessCustomer::where('business_id', $businessId)
                ->when($search, function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%");
                })
                ->when($from, function($query) use ($from) {
                    $query->where('created_at', '>=', $from);
                })
                ->when($to, function($query) use ($to) {
                    $query->where('created_at', '<=', $to);
                })
                ->select('id', 'name', 'created_at')
                ->get()
                ->map(function($customer) {
                    return [
                        'type' => 'customer_added',
                        'title' => "New customer added: {$customer->name}",
                        'time' => $customer->created_at,
                        'amount' => null,
                        'currency' => null
                    ];
                });

            // Get invoices
            $invoices = BusinessInvoice::where('business_id', $businessId)
                ->when($search, function($query) use ($search) {
                    $query->whereHas('customer', function($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })->orWhere('invoice_number', 'like', "%{$search}%");
                })
                ->when($from, function($query) use ($from) {
                    $query->where('created_at', '>=', $from);
                })
                ->when($to, function($query) use ($to) {
                    $query->where('created_at', '<=', $to);
                })
                ->with('customer:id,name')
                ->get()
                ->map(function($invoice) {
                    return [
                        'type' => 'invoice_created',
                        'title' => "Invoice #{$invoice->invoice_number} created for {$invoice->customer->name}",
                        'time' => $invoice->created_at,
                        'amount' => $invoice->amount,
                        'currency' => $invoice->currency
                    ];
                });

            // Get payments
            $payments = BusinessInvoicePayment::whereHas('invoice', function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            })
            ->when($search, function($query) use ($search) {
                $query->whereHas('invoice.customer', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('invoice', function($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%");
                });
            })
            ->when($from, function($query) use ($from) {
                $query->where('created_at', '>=', $from);
            })
            ->when($to, function($query) use ($to) {
                $query->where('created_at', '<=', $to);
            })
            ->with(['invoice:id,invoice_number,customer_id', 'invoice.customer:id,name'])
            ->get()
            ->map(function($payment) {
                return [
                    'type' => 'payment_received',
                    'title' => "Payment received for Invoice #{$payment->invoice->invoice_number} from {$payment->invoice->customer->name}",
                    'time' => $payment->created_at,
                    'amount' => $payment->amount,
                    'currency' => $payment->currency
                ];
            });

            // Combine and sort activities
            $allActivities = collect()
                ->concat($type === 'customer_added' || !$type ? $customers : [])
                ->concat($type === 'invoice_created' || !$type ? $invoices : [])
                ->concat($type === 'payment_received' || !$type ? $payments : [])
                ->sortByDesc('time');

            // Paginate results
            $paginatedActivities = $allActivities->forPage($page, $perPage);
            $hasNextPage = $allActivities->count() > ($page * $perPage);

            return response()->json([
                'data' => $paginatedActivities->values(),
                'next_page' => $hasNextPage ? $page + 1 : null,
                'total' => $allActivities->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching business activities:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 