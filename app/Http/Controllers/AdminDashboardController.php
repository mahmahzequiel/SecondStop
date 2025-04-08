<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Models\Category;
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
            
            // Log DB queries for debugging
            DB::enableQueryLog();
            
            $totalSales = Order::where('status', 'completed')->sum('total_amount');
            $pendingOrders = Order::where('status', 'pending')->count();
            $totalProducts = Product::count();
            $totalUsers = User::count();
            $cancelledOrders = Order::where('status', 'cancelled')->count();
            $refundedOrders = Order::where('status', 'refunded')->count();
            
            $queries = DB::getQueryLog();
            Log::info('Dashboard stats queries', ['queries' => $queries]);
            
            Log::info('Dashboard stats response', [
                'totalSales' => $totalSales,
                'pendingOrders' => $pendingOrders,
                'totalProducts' => $totalProducts,
                'totalUsers' => $totalUsers,
                'cancelledOrders' => $cancelledOrders,
                'refundedOrders' => $refundedOrders
            ]);
            
            return response()->json([
                'totalSales' => $totalSales,
                'pendingOrders' => $pendingOrders,
                'totalProducts' => $totalProducts,
                'totalUsers' => $totalUsers,
                'cancelledOrders' => $cancelledOrders,
                'refundedOrders' => $refundedOrders
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
                ->where('status', 'delivered')  // Note: using 'delivered' here but 'completed' in getStats()
                ->sum('total_amount');
                
            $orders = Order::whereDate('created_at', $date)->count();
            
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
            
            DB::enableQueryLog();
            
            // First check if there are any categories
            $categoryCount = Category::count();
            Log::info('Total category count', ['count' => $categoryCount]);
            
            // Then check Product count
            $productCount = Product::count();
            Log::info('Total product count', ['count' => $productCount]);
            
            $data = Category::withCount('products')
                ->get();
                
            Log::info('Categories with product counts', ['categories' => $data->toArray()]);
            
            $formattedData = $data->map(function($category) {
                // Check if category_name exists, if not log the entire category object
                if (!isset($category->category_name)) {
                    Log::warning('Category is missing category_name property', ['category' => $category->toArray()]);
                    // Use name or id as fallback
                    $name = $category->name ?? ('Category ' . $category->id);
                } else {
                    $name = $category->category_name;
                }
                
                return [
                    'name' => $name,
                    'value' => $category->products_count
                ];
            })->toArray();
            
            // Filter out categories with zero products
            $filteredData = array_filter($formattedData, function($item) {
                return $item['value'] > 0;
            });
            
            $queries = DB::getQueryLog();
            Log::info('Product category queries', ['queries' => $queries]);
            
            Log::info('Product category response', [
                'rawData' => $formattedData,
                'filteredData' => $filteredData,
                'isEmpty' => empty($filteredData)
            ]);
            
            return response()->json($filteredData);
        } catch (\Exception $e) {
            Log::error('Error in getProductCategoryDistribution', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}