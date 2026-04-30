import React from "react";
import RatingStars from "./RatingStars";

const ReviewSummary = ({ averageRating = 0, totalReviews = 0, distribution = [] }) => (
  <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
    <div>
      <p className="text-5xl font-bold text-accent-600">
        {totalReviews > 0 ? averageRating.toFixed(1) : "0.0"}
      </p>
      <RatingStars value={averageRating} className="mt-2" />
      <p className="mt-2 text-sm text-primary-600">
        Based on {totalReviews} review{totalReviews === 1 ? "" : "s"}
      </p>
    </div>

    <div className="space-y-2">
      {distribution.map((rating) => (
        <div key={rating.stars} className="flex items-center gap-3">
          <span className="w-8 text-sm text-primary-600">{rating.stars}★</span>
          <div className="h-2 flex-1 rounded-full bg-primary-100">
            <div
              className="h-2 rounded-full bg-accent-500"
              style={{ width: `${rating.percent}%` }}
            ></div>
          </div>
          <span className="w-8 text-sm text-primary-600">{rating.count}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ReviewSummary;
