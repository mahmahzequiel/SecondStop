<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StoreReviews;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\Auth;

class StoreReviewsController extends Controller
{
    /**
     * Store a new review.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'order_id' => [
            'required',
            'exists:orders,id',
            function ($attribute, $value, $fail) {
                $order = Order::find($value);
                
                if (!$order) {
                    $fail('The selected order id is invalid.');
                    return;
                }
                
                if ($order->user_id != Auth::id()) {
                    $fail('This order does not belong to you.');
                }
                
                // Check if order status is suitable for review
                if ($order->status != 'delivered' && $order->status != 'completed') {
                    $fail('You can only review orders that have been delivered or completed.');
                }
            }
        ],
        'rating' => 'required|integer|min:1|max:5',
        'review_text' => 'required|string|min:10|max:1000',
        'product_id' => [
            'nullable',
            'exists:products,id',
            function ($attribute, $value, $fail) use ($request) {
                // If product_id is provided, check if it's part of the order
                if ($value) {
                    $orderItem = OrderItem::where('order_id', $request->order_id)
                        ->where('product_id', $value)
                        ->first();
                    
                    if (!$orderItem) {
                        $fail('The selected product is not part of this order.');
                    }
                    
                    // Check if review already exists for this product and order
                    $existingReview = StoreReviews::where('order_id', $request->order_id)
                        ->where('product_id', $value)
                        ->first();
                        
                    if ($existingReview) {
                        $fail('You have already reviewed this product for this order.');
                    }
                }
            }
        ]
    ]);

    // Create the review
    $review = new StoreReviews();
    $review->user_id = Auth::id();
    $review->order_id = $validated['order_id'];
    $review->rating = $validated['rating'];
    $review->review_text = $validated['review_text'];
    
    if (isset($validated['product_id'])) {
        $review->product_id = $validated['product_id'];
    }
    
    $review->save();

    return response()->json([
        'message' => 'Review submitted successfully!',
        'review' => $review->load('user'),
    ], 201);
}
    /**
     * Get all reviews.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $reviews = StoreReviews::with('user')->latest()->get();

        return response()->json([
            'reviews' => $reviews,
        ]);
    }

    /**
     * Get a single review.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $review = StoreReviews::with('user')->findOrFail($id);

        return response()->json([
            'review' => $review,
        ]);
    }

    /**
     * Update a review.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Validate the request
        $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'review_text' => 'sometimes|string|max:1000',
        ]);

        // Find the review
        $review = StoreReviews::findOrFail($id);

        // Check if the authenticated user owns the review
        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'You are not authorized to update this review.',
            ], 403);
        }

        // Update the review
        $review->update($request->only(['rating', 'review_text']));

        return response()->json([
            'message' => 'Review updated successfully!',
            'review' => $review,
        ]);
    }

    /**
     * Delete a review.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        // Find the review
        $review = StoreReviews::findOrFail($id);

        // Check if the authenticated user owns the review
        if ($review->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'You are not authorized to delete this review.',
            ], 403);
        }

        // Delete the review
        $review->delete();

        return response()->json([
            'message' => 'Review deleted successfully!',
        ]);
    }
}