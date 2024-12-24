<?php

namespace App\Services;

use App\Models\BusinessInvoice;
use App\Models\BusinessInvoicePayment;
use App\Models\BusinessCustomer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BusinessMetricsService
{
    protected $currencyService;

    public function __construct(CurrencyService $currencyService)
    {
        $this->currencyService = $currencyService;
    }

    public function getBusinessMetrics($businessId)
    {
        $currentMonthRevenue = $this->calculateMonthlyRevenue($businessId);
        $lastMonthRevenue = $this->calculateLastMonthRevenue($businessId);
        $revenueTrend = $this->calculateTrendPercentage($currentMonthRevenue, $lastMonthRevenue);

        $currentMonthCustomers = $this->getCustomersThisMonth($businessId);
        $lastMonthCustomers = $this->getLastMonthCustomers($businessId);
        $customerTrend = $this->calculateTrendPercentage($currentMonthCustomers, $lastMonthCustomers);

        return [
            'revenue' => $currentMonthRevenue,
            'revenue_trend' => [
                'direction' => $revenueTrend >= 0 ? 'up' : 'down',
                'percentage' => abs($revenueTrend)
            ],
            'total_customers' => $this->getTotalCustomers($businessId),
            'customers_this_month' => $currentMonthCustomers,
            'customer_trend' => [
                'direction' => $customerTrend >= 0 ? 'up' : 'down',
                'percentage' => abs($customerTrend)
            ],
            'revenueData' => $this->getRevenueChartData($businessId),
            'recent_activities' => $this->getRecentActivities($businessId)
        ];
    }

    protected function calculateMonthlyRevenue($businessId)
    {
        Log::info('Calculating monthly revenue:', [
            'business_id' => $businessId,
            'month' => now()->month,
            'year' => now()->year
        ]);

        $businessInvoices = BusinessInvoice::where('business_id', $businessId)
            ->pluck('id');

        Log::info('Found invoices:', [
            'invoice_count' => $businessInvoices->count(),
            'invoice_ids' => $businessInvoices
        ]);

        $totalRevenue = BusinessInvoicePayment::whereIn('invoice_id', $businessInvoices)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('converted_amount');

        Log::info('Revenue calculation result:', [
            'total_revenue' => $totalRevenue
        ]);

        return $totalRevenue;
    }

    protected function calculateLastMonthRevenue($businessId)
    {
        $lastMonth = now()->subMonth();
        
        $businessInvoices = BusinessInvoice::where('business_id', $businessId)
            ->pluck('id');

        return BusinessInvoicePayment::whereIn('invoice_id', $businessInvoices)
            ->whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->sum('converted_amount');
    }

    protected function getLastMonthCustomers($businessId)
    {
        $lastMonth = now()->subMonth();
        
        return BusinessCustomer::where('business_id', $businessId)
            ->whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->count();
    }

    protected function calculateTrendPercentage($current, $previous)
    {
        if ($previous == 0) {
            return $current > 0 ? 100 : 0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    protected function getRevenueChartData($businessId)
    {
        $data = [];
        $sixMonthsAgo = now()->subMonths(5); // Get 6 months including current

        for ($i = 0; $i < 6; $i++) {
            $month = $sixMonthsAgo->copy()->addMonths($i);
            $data[] = [
                'name' => $month->format('M Y'),
                'value' => $this->getMonthRevenue($businessId, $month)
            ];
        }

        return $data;
    }

    protected function getMonthRevenue($businessId, $month)
    {
        $businessInvoices = BusinessInvoice::where('business_id', $businessId)
            ->pluck('id');

        return BusinessInvoicePayment::whereIn('invoice_id', $businessInvoices)
            ->whereMonth('created_at', $month->month)
            ->whereYear('created_at', $month->year)
            ->sum('converted_amount');
    }

    protected function getTotalCustomers($businessId)
    {
        Log::info('Getting total customers:', [
            'business_id' => $businessId
        ]);

        $count = BusinessCustomer::where('business_id', $businessId)->count();

        Log::info('Customer count:', [
            'total_customers' => $count
        ]);

        return $count;
    }

    protected function getCustomersData($businessId)
    {
        return BusinessCustomer::where('business_id', $businessId)
            ->select('id', 'created_at')
            ->get();
    }

    protected function getCustomersThisMonth($businessId)
    {
        return BusinessCustomer::where('business_id', $businessId)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
    }

    protected function getRecentActivities($businessId, $limit = 20)
    {
        Log::info('Getting recent activities:', [
            'business_id' => $businessId,
            'limit' => $limit
        ]);

        // Log counts before processing
        $customerCount = BusinessCustomer::where('business_id', $businessId)->count();
        $invoiceCount = BusinessInvoice::where('business_id', $businessId)->count();
        $paymentCount = BusinessInvoicePayment::whereHas('invoice', function($query) use ($businessId) {
            $query->where('business_id', $businessId);
        })->count();

        Log::info('Activity counts:', [
            'customers' => $customerCount,
            'invoices' => $invoiceCount,
            'payments' => $paymentCount
        ]);

        // Get recent customers
        $customers = BusinessCustomer::where('business_id', $businessId)
            ->select('id', 'name', 'created_at')
            ->latest()
            ->limit($limit)
            ->get();

        Log::info('Recent customers:', ['count' => $customers->count()]);

        $customers = $customers->map(function($customer) {
            return [
                'type' => 'customer_added',
                'title' => "New customer added: {$customer->name}",
                'time' => $customer->created_at,
                'amount' => null,
                'currency' => null
            ];
        });

        // Get recent invoices
        $invoices = BusinessInvoice::where('business_id', $businessId)
            ->select('id', 'invoice_number', 'amount', 'currency', 'created_at', 'customer_id')
            ->with('customer:id,name')
            ->latest()
            ->limit($limit)
            ->get();

        Log::info('Recent invoices:', ['count' => $invoices->count()]);

        $invoices = $invoices->map(function($invoice) {
            return [
                'type' => 'invoice_created',
                'title' => "Invoice #{$invoice->invoice_number} created for {$invoice->customer->name}",
                'time' => $invoice->created_at,
                'amount' => $invoice->amount,
                'currency' => $invoice->currency
            ];
        });

        // Get recent payments
        $payments = BusinessInvoicePayment::whereHas('invoice', function($query) use ($businessId) {
            $query->where('business_id', $businessId);
        })
        ->with(['invoice:id,invoice_number,customer_id', 'invoice.customer:id,name'])
        ->select('id', 'invoice_id', 'amount', 'currency', 'created_at')
        ->latest()
        ->limit($limit)
        ->get();

        Log::info('Recent payments:', ['count' => $payments->count()]);

        $payments = $payments->map(function($payment) {
            return [
                'type' => 'payment_received',
                'title' => "Payment received for Invoice #{$payment->invoice->invoice_number} from {$payment->invoice->customer->name}",
                'time' => $payment->created_at,
                'amount' => $payment->amount,
                'currency' => $payment->currency
            ];
        });

        // Combine all activities and sort by time
        $activities = $customers->concat($invoices)
            ->concat($payments)
            ->sortByDesc('time')
            ->take($limit)
            ->values()
            ->all();

        Log::info('Combined activities:', ['count' => count($activities)]);

        return $activities;
    }
}
