<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\StoreReview;
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
        // Validate the request
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review_text' => 'required|string|max:1000',
        ]);

        // Create the review
        $review = StoreReview::create([
            'user_id' => Auth::id(), // Get the authenticated user's ID
            'rating' => $request->rating,
            'review_text' => $request->review_text,
        ]);

        // Return a success response
        return response()->json([
            'message' => 'Review submitted successfully!',
            'review' => $review,
        ], 201);
    }

    /**
     * Get all reviews.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $reviews = StoreReview::with('user')->latest()->get();

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
        $review = StoreReview::with('user')->findOrFail($id);

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
        $review = StoreReview::findOrFail($id);

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
        $review = StoreReview::findOrFail($id);

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