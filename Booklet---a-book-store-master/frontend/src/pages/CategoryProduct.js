import React, { useState, useEffect } from "react";
import Layout from "../components/Layout/Layout";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { useCart } from "../context/cart";
import { useWishlist } from "../context/wishlist";
import { useLocationContext } from "../context/location";
import toast from "react-hot-toast";
import { FiArrowLeft, FiShoppingCart, FiStar, FiHeart, FiMapPin } from "react-icons/fi";
import { isProductAvailableInLocation } from "../utils/locationUtils";
const CategoryProduct = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useCart();
  const [wishlist, setWishlist] = useWishlist();
  const { selectedLocation, selectedLocationLabel } = useLocationContext();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (params?.slug) getPrductsByCat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.slug, selectedLocation]);

  const getPrductsByCat = async () => {
    try {
      const { data } = await axios.get(
        `/api/v1/product/product-category/${params.slug}?location=${encodeURIComponent(
          selectedLocation || ""
        )}`
      );
      setProducts(data?.products);
      setCategory(data?.category);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout title={`${category?.name || "Category"} - Booklet`}>
      <div className="min-h-screen bg-white">
        {/* Header with Background */}
        <div className="bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 border-b border-primary-100">
          <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-accent-600 hover:text-accent-700 mb-6 font-medium transition-all hover:gap-3"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>

            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-primary-900 mb-3">
                {category?.name}
              </h1>
              <p className="text-lg text-primary-600">
                <span className="font-semibold text-accent-600">{products?.length}</span> {products?.length === 1 ? "book" : "books"} available
              </p>
              {selectedLocationLabel && (
                <p className="mt-2 text-sm text-primary-700 inline-flex items-center gap-1.5">
                  <FiMapPin className="h-4 w-4 text-accent-700" />
                  Showing stock for {selectedLocationLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12">
          {products?.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-primary-200 text-7xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-primary-900 mb-2">
                No books found
              </h3>
              <p className="text-primary-600 mb-6">
                This category doesn't have any books yet.
              </p>
              <button
                onClick={() => navigate("/")}
                className="bg-accent-100 text-accent-700 px-6 py-3 rounded-lg hover:bg-accent-200 transition-all font-medium border border-accent-200"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="responsive-card-grid">
              {products?.map((p) => (
                <div
                  key={p._id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group border border-primary-100 flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-primary-50">
                    <img
                      src={p.imageUrl || `https://placehold.co/300x400/f5f0e8/826b4d?text=${encodeURIComponent(p.name)}`}
                      alt={p.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-accent-100 text-accent-700 px-2 py-1 rounded-full text-xs font-bold shadow-sm border border-accent-200">
                      ✨ New
                    </div>
                  </div>
                  <div className="p-3 flex-grow flex flex-col">
                    <h3 className="text-sm font-semibold text-primary-900 line-clamp-2 mb-1 h-9">
                      {p.name}
                    </h3>
                    <p className="text-xs text-primary-600 line-clamp-2 mb-2 flex-grow">
                      {p.description}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FiStar
                          key={i}
                          className={`w-3 h-3 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="text-xs text-primary-600 ml-1">(128)</span>
                    </div>

                    <div className="mb-3">
                      <span className="text-lg font-bold text-accent-600">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/product/${p.slug}`)}
                        className="flex-1 bg-primary-100 text-primary-800 py-2 px-2 rounded-lg hover:bg-primary-200 transition-all font-medium text-xs hover:shadow-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => {
                          const existingItem = wishlist.find(item => item._id === p._id);
                          if (existingItem) {
                            setWishlist(wishlist.filter(item => item._id !== p._id));
                            toast.success("Removed from wishlist");
                          } else {
                            setWishlist([...wishlist, p]);
                            toast.success("Added to wishlist");
                          }
                        }}
                        className={`px-2 py-2 rounded-lg transition-all font-medium text-xs border ${
                          wishlist.find(item => item._id === p._id)
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                        }`}
                        title="Add to wishlist"
                      >
                        <FiHeart className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (!isProductAvailableInLocation(p, selectedLocation)) {
                            toast.error(`Not available in ${selectedLocationLabel}`);
                            return;
                          }
                          setCart([...cart, p]);
                          localStorage.setItem(
                            "cart",
                            JSON.stringify([...cart, p])
                          );
                          toast.success("Item Added to cart");
                        }}
                        className="flex-1 bg-accent-100 text-accent-700 py-2 px-2 rounded-lg hover:bg-accent-200 transition-all font-medium text-xs flex items-center justify-center gap-1 border border-accent-200"
                      >
                        <FiShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CategoryProduct;
