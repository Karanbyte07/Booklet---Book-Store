export const clampRating = (value, min = 0, max = 5) =>
  Math.min(max, Math.max(min, Number(value || 0)));

export const getReviewerInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const formatReviewDate = (value) => {
  if (!value) return "Just now";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return "Just now";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const buildRatingDistribution = (reviews = [], totalReviewCount = 0) =>
  [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter(
      (review) => Number(review?.rating || 0) === stars
    ).length;
    const percent = totalReviewCount
      ? Math.round((count / totalReviewCount) * 100)
      : 0;

    return { stars, count, percent };
  });
