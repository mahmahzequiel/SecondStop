<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
use App\Models\CategoryType;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getStats()
    {
        try {
            Log::info('Dashboard stats request received');
            
            DB::enableQueryLog();
            
            // Update this line to check both payment and delivery status
            $totalSales = Order::where('status', 'delivered')
                              ->where('payment_status', 'paid')
                              ->sum('total_amount');
            
            $pendingOrders = Order::where('status', 'pending')->count();
            $totalProducts = Product::count();
            $totalUsers = User::count();
            $cancelledOrders = Order::where('status', 'cancelled')->count();
            $refundedOrders = Order::where('status', 'refunded')->count();
            
            // Calculate total products sold
            $totalProductsSold = $this->calculateTotalProductsSold();
            
            $queries = DB::getQueryLog();
            Log::info('Dashboard stats queries', ['queries' => $queries]);
            
            return response()->json([
                'totalSales' => $totalSales,
                'pendingOrders' => $pendingOrders,
                'totalProducts' => $totalProducts,
                'totalUsers' => $totalUsers,
                'cancelledOrders' => $cancelledOrders,
                'refundedOrders' => $refundedOrders,
                'totalProductsSold' => $totalProductsSold
            ]);
        } catch (\Exception $e) {
            Log::error('Error in getStats', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Calculate the total number of products sold
     * 
     * @return int
     */
    private function calculateTotalProductsSold()
    {
        try {
            // Method 1: Using order_items relationship
            // This assumes you have a relationship set up between Order and OrderItem models
            $totalSold = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.status', 'delivered')
                ->where('orders.payment_status', 'paid')
                ->sum('order_items.quantity');
            
            Log::info('Total products sold calculation', ['total' => $totalSold]);
            
            return $totalSold;
        } catch (\Exception $e) {
            Log::error('Error calculating total products sold', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Fallback to a safer method if the above fails
            try {
                // Alternative approach using withSum on the Order model
                $totalSold = Order::where('status', 'delivered')
                    ->where('payment_status', 'paid')
                    ->with('order_items')
                    ->get()
                    ->sum(function ($order) {
                        return $order->order_items->sum('quantity');
                    });
                
                return $totalSold;
            } catch (\Exception $innerException) {
                Log::error('Error in fallback calculation for total products sold', [
                    'message' => $innerException->getMessage()
                ]);
                return 0; // Return 0 if both methods fail
            }
        }
    }

    /**
     * Get sales data for charts
     */
    public function getSalesData(Request $request)
    {
        try {
            Log::info('Sales data request received', ['request' => $request->all()]);
            
            $request->validate([
                'timeRange' => 'sometimes|in:week,month,quarter'
            ]);

            $timeRange = $request->input('timeRange', 'month');
            $now = Carbon::now();
            $data = [];
            
            DB::enableQueryLog();
            
            if ($timeRange === 'week') {
                for ($i = 6; $i >= 0; $i--) {
                    $date = $now->copy()->subDays($i);
                    $data[] = $this->getDailySalesData($date);
                }
            } elseif ($timeRange === 'month') {
                for ($i = 29; $i >= 0; $i--) {
                    $date = $now->copy()->subDays($i);
                    $data[] = $this->getDailySalesData($date);
                }
            } else { // quarter (90 days)
                for ($i = 89; $i >= 0; $i--) {
                    $date = $now->copy()->subDays($i);
                    $data[] = $this->getDailySalesData($date);
                }
            }
            
            $queries = DB::getQueryLog();
            Log::info('Sales data queries', ['queries' => $queries]);
            
            Log::info('Sales data response', ['data' => $data]);
            
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error in getSalesData', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Helper method to get daily sales data
     */
    private function getDailySalesData($date)
    {
        try {
            $sales = (float) Order::whereDate('created_at', $date)
                ->where('status', 'delivered')
                ->where('payment_status', 'paid')
                ->sum('total_amount');
                
            $orders = Order::whereDate('created_at', $date)
                ->where('status', 'delivered')
                ->where('payment_status', 'paid')
                ->count();
            
            return [
                'date' => $date->format('M d'),
                'sales' => $sales,
                'orders' => $orders
            ];
        } catch (\Exception $e) {
            Log::error('Error in getDailySalesData', [
                'date' => $date->format('Y-m-d'),
                'message' => $e->getMessage()
            ]);
            return [
                'date' => $date->format('M d'),
                'sales' => 0,
                'orders' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get order status distribution for pie chart
     */
    public function getOrderStatusDistribution()
    {
        try {
            Log::info('Order status distribution request received');
            
            DB::enableQueryLog();
            
            $statuses = [
                'pending', 'processing', 'shipped', 
                'delivered', 'cancelled', 'refunded'
            ];
            
            $data = [];
            
            foreach ($statuses as $status) {
                $count = Order::where('status', $status)->count();
                Log::info("Status count for '{$status}'", ['count' => $count]);
                
                if ($count > 0) {
                    $data[] = [
                        'name' => ucfirst(str_replace('_', ' ', $status)),
                        'value' => $count
                    ];
                }
            }
            
            $queries = DB::getQueryLog();
            Log::info('Order status queries', ['queries' => $queries]);
            
            Log::info('Order status response', ['data' => $data]);
            
            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Error in getOrderStatusDistribution', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get product category distribution for bar chart
     */
    public function getProductCategoryDistribution()
    {
        try {
            Log::info('Product category distribution request received');
            
            // Get categories with at least one product
            $categories = Category::has('products')
                ->withCount('products')
                ->get();
            
            // Format the data
            $data = $categories->map(function($category) {
                return [
                    'name' => $category->name ?? $category->category_name ?? 'Uncategorized',
                    'value' => $category->products_count
                ];
            });
            
            Log::info('Product category response', ['data' => $data]);
            
            return response()->json($data);
            
        } catch (\Exception $e) {
            Log::error('Error in getProductCategoryDistribution', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getProductCategoryTypeDistribution()
    {
        try {
            Log::info('Product category type distribution request received');

            // Get category types with at least one product
            $categoryTypes = CategoryType::has('products')
                ->withCount('products')
                ->get();

            // Format the data
            $data = $categoryTypes->map(function ($categoryType) {
                return [
                    'name' => $categoryType->category_type ?? 'Uncategorized',
                    'value' => $categoryType->products_count
                ];
            });

            Log::info('Product category type distribution response', ['data' => $data]);

            return response()->json($data);

        } catch (\Exception $e) {
            Log::error('Error in getProductCategoryTypeDistribution', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}