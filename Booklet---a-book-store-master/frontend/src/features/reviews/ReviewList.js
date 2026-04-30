import React from "react";
import RatingStars from "./RatingStars";
import { formatReviewDate, getReviewerInitials } from "./reviewUtils";

const ReviewList = ({ reviews = [], loading = false }) => {
  if (loading && reviews.length === 0) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-5 text-sm text-primary-600">
        Loading reviews...
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-primary-200 bg-white p-5 text-sm text-primary-600">
        No reviews yet. Be the first to write a review.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div
          key={review?._id || `${review?.user}-${review?.createdAt}`}
          className="border-b border-primary-100 pb-6"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700">
              {getReviewerInitials(review?.name)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-primary-900">
                  {review?.name || "User"}
                </span>
                <RatingStars value={Number(review?.rating || 0)} sizeClass="h-3.5 w-3.5" />
              </div>
              <p className="text-xs text-primary-500">
                {formatReviewDate(review?.updatedAt || review?.createdAt)}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-primary-700">{review?.comment}</p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
