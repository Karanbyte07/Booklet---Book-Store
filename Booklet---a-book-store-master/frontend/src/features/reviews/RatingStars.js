import React from "react";
import { FiStar } from "react-icons/fi";
import { clampRating } from "./reviewUtils";

const RatingStars = ({
  value = 0,
  onChange,
  sizeClass = "h-4 w-4",
  className = "",
  filledClass = "fill-current text-accent-400",
  emptyClass = "text-primary-200",
}) => {
  const normalizedValue = clampRating(value);
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {stars.map((starValue) => {
        const isFilled = starValue <= Math.round(normalizedValue);
        const iconClass = `${sizeClass} ${isFilled ? filledClass : emptyClass}`;

        if (typeof onChange === "function") {
          return (
            <button
              key={starValue}
              type="button"
              onClick={() => onChange(starValue)}
              className="rounded-md p-1"
              aria-label={`Rate ${starValue} star${starValue === 1 ? "" : "s"}`}
            >
              <FiStar className={iconClass} />
            </button>
          );
        }

        return <FiStar key={starValue} className={iconClass} />;
      })}
    </div>
  );
};

export default RatingStars;
