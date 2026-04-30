import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiShoppingCart } from "react-icons/fi";
import toast from "react-hot-toast";
import Layout from "./../components/Layout/Layout";
import { useSearch } from "../context/search";
import { useCart } from "../context/cart";
import { useLocationContext } from "../context/location";
import { isProductAvailableInLocation } from "../utils/locationUtils";

const Search = () => {
  const [values] = useSearch();
  const [cart, setCart] = useCart();
  const { selectedLocation, selectedLocationLabel } = useLocationContext();
  const navigate = useNavigate();

  const results = React.useMemo(
    () =>
      (values?.results || []).filter((product) =>
        isProductAvailableInLocation(product, selectedLocation)
      ),
    [selectedLocation, values?.results]
  );

  const addToCart = (product) => {
    if (!isProductAvailableInLocation(product, selectedLocation)) {
      toast.error(`Not available in ${selectedLocationLabel}`);
      return;
    }

    const alreadyInCart = cart?.some((item) => item._id === product?._id);
    if (alreadyInCart) {
      toast("Already in cart");
      return;
    }

    const nextCart = [...cart, { ...product, qty: 1 }];
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
    toast.success("Added to cart");
  };

  return (
    <Layout title="Search results">
      <section className="bg-primary-50 min-h-screen py-6 sm:py-8">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="rounded-2xl border border-primary-200 bg-white shadow-sm p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-primary-900 mb-1">
              Search Results
            </h1>
            <p className="text-sm text-primary-600 m-0">
              {results.length < 1 ? "No products found" : `Found ${results.length} product${results.length === 1 ? "" : "s"}`}
            </p>
            {selectedLocationLabel && (
              <p className="mt-1 text-xs text-primary-500">
                Results for {selectedLocationLabel}
              </p>
            )}
          </div>

          {results.length < 1 ? (
            <div className="mt-5 rounded-2xl border border-primary-200 bg-white shadow-sm text-center px-5 py-14">
              <p className="text-primary-700 m-0">
                Try searching with another keyword.
              </p>
            </div>
          ) : (
            <div className="mt-5 responsive-card-grid">
              {results.map((product) => (
                <article
                  key={product._id}
                  className="rounded-2xl border border-primary-200 bg-white shadow-sm overflow-hidden flex flex-col"
                >
                  <img
                    src={product.imageUrl || "https://placehold.co/600x800/f5f0e8/826b4d?text=No+Image"}
                    alt={product.name}
                    className="h-56 w-full object-contain bg-primary-50 p-3"
                  />

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h2 className="text-base font-semibold text-primary-900 line-clamp-1 m-0">
                        {product.name}
                      </h2>
                      <p className="mt-1 text-sm text-primary-600 line-clamp-2 m-0">
                        {product.description}
                      </p>
                    </div>

                    <p className="text-lg font-bold text-accent-700 m-0">₹{product.price}</p>

                    <div className="flex items-center gap-2 mt-auto">
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${product.slug}`)}
                        className="h-10 flex-1 rounded-lg border border-primary-200 bg-white hover:bg-primary-50 text-primary-700 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                      >
                        More Details
                        <FiArrowRight className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="h-10 flex-1 rounded-lg bg-accent-500 hover:bg-accent-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                      >
                        <FiShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Search;
