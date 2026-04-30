import React from "react";
import { useSearch } from "../../context/search";
import axios from "../../config/axios";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { useLocationContext } from "../../context/location";

const SearchInput = () => {
  const [values, setValues] = useSearch();
  const { selectedLocation } = useLocationContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.get(
        `/api/v1/product/search/${values.keyword}?location=${encodeURIComponent(
          selectedLocation || ""
        )}`
      );
      setValues({ ...values, results: data });
      navigate("/search");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center">
        <input
          type="search"
          placeholder="Search for books..."
          aria-label="Search"
          value={values.keyword}
          onChange={(e) => setValues({ ...values, keyword: e.target.value })}
          className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors bg-gray-50 focus:bg-white"
        />
        <button
          type="submit"
          className="absolute right-2 p-2 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <FiSearch className="text-lg" />
        </button>
      </div>
    </form>
  );
};

export default SearchInput;
