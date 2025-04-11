<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StoreReviews;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class StoreReviewsController extends Controller
{
    /**
     * Store a new review.
     */
    /**
 * Store a new review.
 */
public function store(Request $request)
{
    Log::info('Review submission request:', [
        'has_file' => $request->hasFile('review_image'),
        'all_data' => $request->all()
    ]);

    $validated = $request->validate([
        'order_id' => [
            'required',
            'exists:orders,id',
            function ($attribute, $value, $fail) {
                $order = Order::find($value);
                
                if (!$order) {
                    return $fail('The selected order id is invalid.');
                }

                if ($order->user_id !== Auth::id()) {
                    return $fail('This order does not belong to you.');
                }

                if (!in_array($order->status, ['delivered', 'completed'])) {
                    return $fail('You can only review orders that have been delivered or completed.');
                }
            }
        ],
        'rating' => 'required|integer|min:1|max:5',
        'review_text' => 'required|string|min:10|max:1000',
        'product_id' => [
            'nullable',
            'exists:products,id',
            function ($attribute, $value, $fail) use ($request) {
                if ($value) {
                    $orderItem = OrderItem::where('order_id', $request->order_id)
                        ->where('product_id', $value)
                        ->first();
                    
                    if (!$orderItem) {
                        return $fail('The selected product is not part of this order.');
                    }

                    $existingReview = StoreReviews::where('order_id', $request->order_id)
                        ->where('product_id', $value)
                        ->first();

                    if ($existingReview) {
                        return $fail('You have already reviewed this product for this order.');
                    }
                }
            }
        ],
        'review_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    $review = new StoreReviews();
    $review->user_id = Auth::id();
    $review->order_id = $validated['order_id'];
    $review->rating = $validated['rating'];
    $review->review_text = $validated['review_text'];

    if (isset($validated['product_id'])) {
        $review->product_id = $validated['product_id'];
    }

    // Updated image handling logic based on ProductsController
    try {
        // Handle image upload if provided
        if ($request->hasFile('review_image') && $request->file('review_image')->isValid()) {
            $imagePath = $request->file('review_image')->store('review-images', 'public');
            $review->review_image = $imagePath;
            
            Log::info('Image stored successfully:', [
                'path' => $imagePath,
                'exists' => Storage::disk('public')->exists($imagePath)
            ]);
        }
        
        $review->save();
        Log::info('Review saved', ['review_id' => $review->id]);
        
    } catch (\Exception $e) {
        Log::error('Exception during review creation: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString()
        ]);

        return response()->json([
            'message' => 'Failed to save review. Please try again.',
            'error' => $e->getMessage()
        ], 500);
    }

    if ($review->review_image) {
        $review->review_image_url = asset('storage/' . $review->review_image);
    }

    return response()->json([
        'message' => 'Review submitted successfully!',
        'review' => $review->load('user'),
    ], 201);
}
    /**
     * Get all reviews.
     */
    public function index()
    {
        $reviews = StoreReviews::with('user')->latest()->get();

        $reviews->each(function ($review) {
            if ($review->review_image) {
                $review->review_image_url = asset('storage/' . $review->review_image);
            }
        });

        return response()->json(['reviews' => $reviews]);
    }

    /**
     * Get a single review.
     */
    public function show($id)
    {
        $review = StoreReviews::with('user')->findOrFail($id);

        if ($review->review_image) {
            $review->review_image_url = asset('storage/' . $review->review_image);
        }

        return response()->json(['review' => $review]);
    }

    /**
     * Update a review.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'review_text' => 'sometimes|string|max:1000',
            'review_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'remove_image' => 'nullable|boolean',
        ]);

        $review = StoreReviews::findOrFail($id);

        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'You are not authorized to update this review.',
            ], 403);
        }

        if ($request->has('rating')) {
            $review->rating = $request->rating;
        }

        if ($request->has('review_text')) {
            $review->review_text = $request->review_text;
        }

        if ($request->hasFile('review_image')) {
            if ($review->review_image) {
                Storage::disk('public')->delete($review->review_image);
            }

            $imagePath = $request->file('review_image')->store('review-images', 'public');
            $review->review_image = $imagePath;
        } elseif ($request->boolean('remove_image')) {
            if ($review->review_image) {
                Storage::disk('public')->delete($review->review_image);
                $review->review_image = null;
            }
        }

        $review->save();

        if ($review->review_image) {
            $review->review_image_url = asset('storage/' . $review->review_image);
        }

        return response()->json([
            'message' => 'Review updated successfully!',
            'review' => $review,
        ]);
    }

    /**
     * Delete a review.
     */
    public function destroy($id)
    {
        $review = StoreReviews::findOrFail($id);

        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'You are not authorized to delete this review.',
            ], 403);
        }

        if ($review->review_image) {
            Storage::disk('public')->delete($review->review_image);
        }

        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully!',
        ]);
    }
}
