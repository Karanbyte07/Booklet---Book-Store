import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Spinner = ({ path = "login" }) => {
  const [count, setCount] = useState(3);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prevValue) => prevValue - 1);
    }, 1000);

    if (count === 0) {
      navigate(`/${path}`, {
        state: location.pathname,
      });
    }

    return () => clearInterval(interval);
  }, [count, navigate, location, path]);

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center gap-4 px-4">
      <h1 className="text-center text-lg sm:text-xl font-semibold text-primary-900">
        Redirecting you in {count} second{count === 1 ? "" : "s"}...
      </h1>
      <div
        className="h-10 w-10 rounded-full border-4 border-primary-200 border-t-accent-500 animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

export default Spinner;
