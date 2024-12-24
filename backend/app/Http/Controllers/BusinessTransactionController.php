<?php

namespace App\Http\Controllers;

use App\Models\BusinessInvoicePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BusinessTransactionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $businessId = $request->user()->businessProfile->id;
            $perPage = 20;
            $page = $request->input('page', 1);
            $search = $request->input('search');
            $from = $request->input('from');
            $to = $request->input('to');

            $query = BusinessInvoicePayment::whereHas('invoice', function($query) use ($businessId) {
                $query->where('business_id', $businessId);
            })
            ->with(['invoice:id,invoice_number,customer_id', 'invoice.customer:id,name'])
            ->when($search, function($query) use ($search) {
                $query->whereHas('invoice.customer', function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhereHas('invoice', function($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%");
                });
            })
            ->when($from, function($query) use ($from) {
                $query->where('payment_date', '>=', $from);
            })
            ->when($to, function($query) use ($to) {
                $query->where('payment_date', '<=', $to);
            })
            ->latest('payment_date');

            $total = $query->count();
            $transactions = $query->forPage($page, $perPage)
                ->get()
                ->map(function($payment) {
                    return [
                        'id' => $payment->id,
                        'invoice_number' => $payment->invoice->invoice_number,
                        'customer_name' => $payment->invoice->customer->name,
                        'amount' => $payment->amount,
                        'currency' => $payment->currency,
                        'payment_date' => $payment->payment_date,
                        'notes' => $payment->notes
                    ];
                });

            $hasNextPage = $total > ($page * $perPage);

            return response()->json([
                'data' => $transactions,
                'next_page' => $hasNextPage ? $page + 1 : null,
                'total' => $total
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching business transactions:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch transactions',
                'error' => $e->getMessage()
            ], 500);
        }
    }
} 