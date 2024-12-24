<?php

namespace App\Http\Controllers;

use App\Models\Professional;
use App\Models\Hustle;
use App\Models\HustlePayment;
use App\Models\WorkstationPayment;
use App\Models\WorkstationSubscription;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ProfessionalDashboardController extends Controller
{
    public function getDashboardData()
    {
        try {
            // Get professional profile through user relationship
            $professional = Auth::user()->professional;
            
            if (!$professional) {
                return response()->json([
                    'message' => 'Professional profile not found'
                ], 404);
            }

            // Get currency settings
            $settings = Setting::first();
            $currency = [
                'code' => $settings ? $settings->default_currency : 'USD',
                'symbol' => $settings ? $settings->currency_symbol : '$'
            ];

            // Get current month's data
            $startOfMonth = Carbon::now()->startOfMonth();
            $endOfMonth = Carbon::now()->endOfMonth();

            // Calculate monthly revenue (completed payments only)
            $monthlyRevenue = HustlePayment::where('professional_id', $professional->id)
                ->where('status', 'completed')
                ->whereBetween('paid_at', [$startOfMonth, $endOfMonth])
                ->sum('amount');

            // Calculate all-time revenue
            $totalRevenue = HustlePayment::where('professional_id', $professional->id)
                ->where('status', 'completed')
                ->sum('amount');

            // Get hustle statistics
            $totalHustles = Hustle::where('assigned_professional_id', $professional->id)->count();
            $completedHustles = Hustle::where('assigned_professional_id', $professional->id)
                ->where('status', 'completed')
                ->count();
            
            // Calculate success rate
            $successRate = $totalHustles > 0 ? ($completedHustles / $totalHustles) * 100 : 0;

            // Get active workstation subscription
            $activeSubscription = WorkstationSubscription::with('plan')
                ->where('user_id', Auth::id())
                ->where('status', 'active')
                ->where('end_date', '>', now())
                ->latest()
                ->first();

            // Get recent activities (last 20)
            $recentActivities = $this->getRecentActivities($professional->id);

            return response()->json([
                'currency' => $currency,
                'statistics' => [
                    'monthly_revenue' => $monthlyRevenue,
                    'total_revenue' => $totalRevenue,
                    'completed_hustles' => $completedHustles,
                    'success_rate' => round($successRate, 2),
                ],
                'workstation' => [
                    'has_active_subscription' => !is_null($activeSubscription),
                    'subscription' => $activeSubscription ? [
                        'plan_name' => $activeSubscription->plan->name,
                        'end_date' => $activeSubscription->end_date->format('M d, Y')
                    ] : null
                ],
                'recent_activities' => $recentActivities
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching professional dashboard data:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch dashboard data'
            ], 500);
        }
    }

    private function getRecentActivities($professionalId)
    {
        // Get hustle applications
        $hustleApplications = Hustle::with(['category'])
            ->where('assigned_professional_id', $professionalId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($hustle) {
                return [
                    'type' => 'hustle',
                    'title' => $hustle->title,
                    'category' => $hustle->category->name,
                    'status' => $hustle->status,
                    'amount' => $hustle->budget,
                    'date' => $hustle->created_at,
                ];
            });

        // Get hustle payments
        $hustlePayments = HustlePayment::where('professional_id', $professionalId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($payment) {
                return [
                    'type' => 'payment',
                    'title' => 'Hustle Payment',
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'date' => $payment->created_at,
                ];
            });

        // Get workstation activities
        $workstationPayments = WorkstationPayment::whereHas('subscription', function ($query) use ($professionalId) {
                $query->whereHas('user', function ($q) use ($professionalId) {
                    $q->whereHas('professional', function ($p) use ($professionalId) {
                        $p->where('id', $professionalId);
                    });
                });
            })
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($payment) {
                return [
                    'type' => 'workstation',
                    'title' => 'Workstation Payment',
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'date' => $payment->created_at,
                ];
            });

        // Merge all activities and sort by date
        return collect()
            ->concat($hustleApplications)
            ->concat($hustlePayments)
            ->concat($workstationPayments)
            ->sortByDesc('date')
            ->take(20)
            ->values()
            ->all();
    }

    public function getActivities(Request $request)
    {
        try {
            Log::info('Fetching activities with request:', [
                'filters' => $request->all(),
                'user_id' => Auth::id()
            ]);

            $professional = Auth::user()->professional;
            
            if (!$professional) {
                Log::warning('Professional profile not found for user:', [
                    'user_id' => Auth::id()
                ]);
                return response()->json([
                    'message' => 'Professional profile not found'
                ], 404);
            }

            Log::info('Found professional profile:', [
                'professional_id' => $professional->id
            ]);

            $perPage = 10;
            $query = collect();

            // Get hustle applications with filters
            $hustleQuery = Hustle::with(['category'])
                ->where('assigned_professional_id', $professional->id);

            if ($request->has('search')) {
                $hustleQuery->where('title', 'like', "%{$request->search}%");
            }

            if ($request->has('status') && $request->status !== 'all') {
                $hustleQuery->where('status', $request->status);
            }

            if ($request->has('from') && $request->has('to')) {
                $hustleQuery->whereBetween('created_at', [$request->from, $request->to]);
            }

            $hustles = $hustleQuery->get();
            Log::info('Found hustles:', [
                'count' => $hustles->count()
            ]);

            $hustles = $hustles->map(function ($hustle) {
                return [
                    'id' => $hustle->id,
                    'type' => 'hustle',
                    'title' => $hustle->title,
                    'category' => $hustle->category->name,
                    'status' => $hustle->status,
                    'amount' => $hustle->budget,
                    'date' => $hustle->created_at,
                ];
            });

            // Get hustle payments with filters
            $paymentsQuery = HustlePayment::where('professional_id', $professional->id);

            if ($request->has('status') && $request->status !== 'all') {
                $paymentsQuery->where('status', $request->status);
            }

            if ($request->has('from') && $request->has('to')) {
                $paymentsQuery->whereBetween('created_at', [$request->from, $request->to]);
            }

            $payments = $paymentsQuery->get();
            Log::info('Found payments:', [
                'count' => $payments->count()
            ]);

            $payments = $payments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'type' => 'payment',
                    'title' => 'Hustle Payment',
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'date' => $payment->created_at,
                ];
            });

            // Get workstation activities with filters
            $workstationQuery = WorkstationPayment::whereHas('subscription', function ($query) use ($professional) {
                $query->whereHas('user', function ($q) use ($professional) {
                    $q->whereHas('professional', function ($p) use ($professional) {
                        $p->where('id', $professional->id);
                    });
                });
            });

            if ($request->has('status') && $request->status !== 'all') {
                $workstationQuery->where('status', $request->status);
            }

            if ($request->has('from') && $request->has('to')) {
                $workstationQuery->whereBetween('created_at', [$request->from, $request->to]);
            }

            $workstationPayments = $workstationQuery->get();
            Log::info('Found workstation payments:', [
                'count' => $workstationPayments->count()
            ]);

            $workstationPayments = $workstationPayments->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'type' => 'workstation',
                    'title' => 'Workstation Payment',
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'date' => $payment->created_at,
                ];
            });

            // Merge all activities based on type filter
            if ($request->type === 'all' || !$request->has('type') || $request->type === 'hustle') {
                $query = $query->concat($hustles);
            }
            if ($request->type === 'all' || !$request->has('type') || $request->type === 'payment') {
                $query = $query->concat($payments);
            }
            if ($request->type === 'all' || !$request->has('type') || $request->type === 'workstation') {
                $query = $query->concat($workstationPayments);
            }

            // Sort by date
            $sortedActivities = $query->sortByDesc('date');

            // Apply search filter across all activities if present
            if ($request->has('search')) {
                $search = strtolower($request->search);
                $sortedActivities = $sortedActivities->filter(function ($activity) use ($search) {
                    return str_contains(strtolower($activity['title']), $search);
                });
            }

            // Apply status filter if not "all"
            if ($request->has('status') && $request->status !== 'all') {
                $sortedActivities = $sortedActivities->filter(function ($activity) use ($request) {
                    return $activity['status'] === $request->status;
                });
            }

            // Paginate the results
            $page = $request->get('page', 1);
            $offset = ($page - 1) * $perPage;
            $total = $sortedActivities->count();
            $activities = $sortedActivities->slice($offset, $perPage)->values();

            Log::info('Returning activities:', [
                'total' => $total,
                'current_page' => $page,
                'has_more' => ($offset + $perPage) < $total,
                'activities_count' => $activities->count()
            ]);

            return response()->json([
                'data' => $activities,
                'current_page' => (int)$page,
                'has_more' => ($offset + $perPage) < $total
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching professional activities:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch activities'
            ], 500);
        }
    }
} 