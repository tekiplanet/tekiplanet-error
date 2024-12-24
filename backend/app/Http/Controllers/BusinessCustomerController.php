<?php

namespace App\Http\Controllers;

use App\Models\BusinessCustomer;
use App\Models\BusinessProfile;
use App\Models\BusinessInvoicePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class BusinessCustomerController extends Controller
{
    public function index()
    {
        try {
            // Get the business profile first
            $businessProfile = BusinessProfile::where('user_id', Auth::id())->first();

            if (!$businessProfile) {
                return response()->json([
                    'message' => 'Business profile not found'
                ], 404);
            }

            $customers = BusinessCustomer::where('business_id', $businessProfile->id)
                ->get()
                ->map(function ($customer) {
                    return [
                        'id' => $customer->id,
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'phone' => $customer->phone,
                        'address' => $customer->address,
                        'city' => $customer->city,
                        'state' => $customer->state,
                        'country' => $customer->country,
                        'currency' => $customer->currency,
                        'tags' => $customer->tags,
                        'notes' => $customer->notes,
                        'status' => $customer->status,
                        'total_spent' => $customer->getTotalSpent(), // Using the model method
                        'last_order_date' => null, // Update this when you have orders
                        'created_at' => $customer->created_at,
                        'updated_at' => $customer->updated_at
                    ];
                });

            \Log::info('Fetched customers:', [
                'count' => $customers->count(),
                'business_id' => $businessProfile->id,
                'customers' => $customers->toArray()
            ]);

            return response()->json($customers);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch customers:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to fetch customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|min:2',
                'email' => 'required|email',
                'phone' => 'required|string|min:10',
                'currency' => 'required|string|size:3',
                'address' => 'nullable|string',
                'tags' => 'nullable|array',
                'tags.*' => 'string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $businessProfile = BusinessProfile::where('user_id', Auth::id())->first();

            $customer = BusinessCustomer::create([
                'business_id' => $businessProfile->id,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'currency' => $request->currency,
                'address' => $request->address,
                'tags' => $request->tags ?? []
            ]);

            return response()->json([
                'message' => 'Customer created successfully',
                'data' => $customer
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating customer:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $customer = BusinessCustomer::with(['business'])
                ->where('id', $id)
                ->firstOrFail();

            // Check if user owns the business
            if ($customer->business->user_id !== Auth::id()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Calculate total spent from invoice payments
            $totalSpent = BusinessInvoicePayment::whereHas('invoice', function ($query) use ($customer) {
                $query->where('customer_id', $customer->id);
            })->sum('amount');

            // Add total spent to customer data
            $customer->total_spent = $totalSpent;

            return response()->json($customer);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            // Get the business profile first
            $businessProfile = BusinessProfile::where('user_id', Auth::id())->first();

            if (!$businessProfile) {
                return response()->json([
                    'message' => 'Business profile not found'
                ], 404);
            }

            $customer = BusinessCustomer::where('business_id', $businessProfile->id)
                ->where('id', $id)
                ->firstOrFail();

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'city' => 'required|string|max:100',
                'state' => 'required|string|max:100',
                'country' => 'required|string|max:100',
                'currency' => 'required|string|size:3',
                'tags' => 'nullable|array',
                'notes' => 'nullable|string',
                'status' => 'nullable|in:active,inactive'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $customer->update($request->all());

            \Log::info('Customer updated successfully:', $customer->toArray());

            return response()->json([
                'message' => 'Customer updated successfully',
                'customer' => $customer
            ]);

        } catch (\Exception $e) {
            \Log::error('Error updating customer:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            // Get the business profile first
            $businessProfile = BusinessProfile::where('user_id', Auth::id())->first();

            if (!$businessProfile) {
                return response()->json([
                    'message' => 'Business profile not found'
                ], 404);
            }

            // Find the customer that belongs to this business
            $customer = BusinessCustomer::where('business_id', $businessProfile->id)
                ->where('id', $id)
                ->first();

            if (!$customer) {
                return response()->json([
                    'message' => 'Customer not found'
                ], 404);
            }

            // Check if customer has any invoices
            $hasInvoices = $customer->invoices()->exists();
            if ($hasInvoices) {
                return response()->json([
                    'message' => 'Cannot delete customer with existing invoices. Please delete all invoices first.',
                    'type' => 'has_invoices'
                ], 422);
            }

            \Log::info('Deleting customer:', [
                'customer_id' => $id,
                'business_id' => $businessProfile->id,
                'customer_data' => $customer->toArray()
            ]);

            // Delete the customer
            $customer->delete();

            return response()->json([
                'message' => 'Customer deleted successfully'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error deleting customer:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete customer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $search = $request->input('search');
            
            if (strlen($search) < 3) {
                return response()->json([]);
            }

            $customers = BusinessCustomer::where('business_id', $request->user()->businessProfile->id)
                ->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                })
                ->select('id', 'name', 'email', 'phone', 'currency')
                ->orderBy('name')
                ->limit(10)
                ->get();

            return response()->json($customers->toArray());

        } catch (\Exception $e) {
            Log::error('Error searching customers:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([]);
        }
    }
} 