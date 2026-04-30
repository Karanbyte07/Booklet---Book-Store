import { useCallback, useMemo, useState } from "react";
import { getApiErrorMessage } from "../../utils/errorUtils";
import {
  createOrUpdateProductReview,
  fetchProductReviews,
} from "./reviewApi";
import { buildRatingDistribution } from "./reviewUtils";

const EMPTY_SUMMARY = {
  rating: 0,
  numReviews: 0,
};

const normalizeSummary = (summary, reviews = []) => {
  const totalReviews = Number(summary?.numReviews || reviews.length || 0);
  const averageRating = Number(summary?.rating || 0);

  return {
    rating: Number.isFinite(averageRating) ? averageRating : 0,
    numReviews: Number.isFinite(totalReviews) ? totalReviews : 0,
  };
};

const useProductReviews = ({ productId = "", userId = "" } = {}) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const resetReviewsState = useCallback(() => {
    setReviews([]);
    setSummary(EMPTY_SUMMARY);
  }, []);

  const loadReviews = useCallback(async () => {
    if (!productId) {
      resetReviewsState();
      return { reviews: [], summary: EMPTY_SUMMARY };
    }

    try {
      setLoading(true);
      const data = await fetchProductReviews(productId);
      const nextReviews = Array.isArray(data?.reviews) ? data.reviews : [];
      const nextSummary = normalizeSummary(data?.summary, nextReviews);

      setReviews(nextReviews);
      setSummary(nextSummary);

      return { reviews: nextReviews, summary: nextSummary };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Unable to load reviews"));
    } finally {
      setLoading(false);
    }
  }, [productId, resetReviewsState]);

  const submitReview = useCallback(
    async ({ rating, comment }) => {
      if (!productId) {
        throw new Error("Invalid product");
      }

      try {
        setSubmitting(true);
        const data = await createOrUpdateProductReview(productId, {
          rating,
          comment,
        });
        await loadReviews();
        return data;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Unable to submit review"));
      } finally {
        setSubmitting(false);
      }
    },
    [loadReviews, productId]
  );

  const myReview = useMemo(() => {
    if (!userId) return null;

    return (
      reviews.find((review) => String(review?.user) === String(userId)) || null
    );
  }, [reviews, userId]);

  const averageRating = Number(summary?.rating || 0);
  const totalReviews = Number(summary?.numReviews || reviews.length || 0);

  const ratingDistribution = useMemo(
    () => buildRatingDistribution(reviews, totalReviews),
    [reviews, totalReviews]
  );

  return {
    reviews,
    summary,
    loading,
    submitting,
    myReview,
    averageRating,
    totalReviews,
    ratingDistribution,
    loadReviews,
    submitReview,
  };
};

export default useProductReviews;
