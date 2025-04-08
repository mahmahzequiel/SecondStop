import React, { useState, useEffect } from "react";
import { StarFilled, StarOutlined } from "@ant-design/icons";
import axios from "axios";

const StoreReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reviews from the database
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://127.0.0.1:8000/api/store-reviews");
        setReviews(response.data.reviews);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews. Please try again later.");
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className="star-icon">
          {i <= rating ? <StarFilled style={{ color: "#e05d44" }} /> : <StarOutlined style={{ color: "#999" }} />}
        </span>
      );
    }
    return stars;
  };

  // Get the reviewer's initial safely
  const getReviewerInitial = (review) => {
    // Check if user exists and has a name
    if (review && review.user && review.user.username && review.user.username.length > 0) {
      return review.user.username.charAt(0).toUpperCase();
    }
    // Default fallback
    return "?";
  };

  // Get reviewer name safely
  const getReviewerName = (review) => {
    if (review && review.user && review.user.username) {
      return review.user.username;
    }
    return "Anonymous Reviewer";
  };

  // Display loading state
  if (loading) {
    return (
      <div className="store-reviews loading-state">
        <h2>Loading Reviews...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="store-reviews error-state">
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Display empty state
  if (reviews.length === 0) {
    return (
      <div className="store-reviews empty-state">
        <h2>No Reviews Yet</h2>
        <p>Be the first to share your experience with our products!</p>
      </div>
    );
  }

  return (
    <div className="store-reviews">
      <div className="reviews-header">
        <h2>Customer Reviews</h2>
        <p>See what our customers are saying about their shopping experience</p>
      </div>

      <div className="reviews-grid">
        {reviews.map((review, index) => (
          <div key={index} className="reviewer-card">
            <div className="reviewer-image">
              {review.user && review.user.avatar_url ? (
                <img src={review.user.avatar_url} alt={getReviewerName(review)} />
              ) : (
                <div className="reviewer-initial">
                  {getReviewerInitial(review)}
                </div>
              )}
            </div>
            <h3 className="reviewer-name">{getReviewerName(review)}</h3>
            <div className="review-rating">
              {renderStars(review.rating)}
            </div>
            <p className="review-text">"{review.review_text || "Great product!"}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreReviews;