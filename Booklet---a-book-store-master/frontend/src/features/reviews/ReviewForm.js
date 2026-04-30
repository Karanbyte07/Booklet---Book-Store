import React from "react";
import RatingStars from "./RatingStars";

const ReviewForm = ({
  rating = 0,
  comment = "",
  submitting = false,
  hasExistingReview = false,
  onRatingChange,
  onCommentChange,
  onCancel,
  onSubmit,
}) => (
  <form
    onSubmit={onSubmit}
    className="mb-8 rounded-2xl border border-primary-200 bg-white/90 p-4 sm:p-5"
  >
    <p className="text-sm font-semibold text-primary-900">
      {hasExistingReview ? "Update your review" : "Share your experience"}
    </p>

    <RatingStars
      value={rating}
      onChange={onRatingChange}
      className="mt-3"
      sizeClass="h-5 w-5"
      filledClass="fill-current text-accent-500"
      emptyClass="text-primary-300"
    />

    <textarea
      value={comment}
      onChange={onCommentChange}
      placeholder="Write what you liked, quality, delivery experience, etc."
      rows={4}
      maxLength={1200}
      className="mt-3 w-full rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm text-primary-800 focus:border-accent-300 focus:outline-none"
    />
    <p className="mt-1 text-xs text-primary-500">{comment.length}/1200 characters</p>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="submit"
        disabled={submitting}
        className="h-10 rounded-xl bg-accent-500 px-4 text-sm font-semibold text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting
          ? "Submitting..."
          : hasExistingReview
            ? "Update Review"
            : "Submit Review"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-xl border border-primary-200 bg-white px-4 text-sm font-semibold text-primary-700 hover:bg-primary-50"
      >
        Cancel
      </button>
    </div>
  </form>
);

export default ReviewForm;
