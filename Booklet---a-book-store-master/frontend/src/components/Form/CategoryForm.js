import React from "react";

const CategoryForm = ({
  handleSubmit,
  value,
  setValue,
  placeholder = "Enter category name",
  buttonText = "Add Category",
  autoFocus = false,
}) => {
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
    >
      <input
        type="text"
        className="h-10 w-full rounded-lg border border-primary-200 bg-white px-3 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-300 focus:border-accent-300"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus={autoFocus}
      />
      <button
        type="submit"
        className="h-10 px-4 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold whitespace-nowrap"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default CategoryForm;
