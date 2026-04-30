import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout/Layout";
import { useWishlist } from "../context/wishlist";
import { useCart } from "../context/cart";
import { useLocationContext } from "../context/location";
import toast from "react-hot-toast";
import { FiTrash2, FiShoppingCart, FiArrowLeft, FiEye } from "react-icons/fi";
import { isProductAvailableInLocation } from "../utils/locationUtils";
import { useConfirm } from "../context/confirm";

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useWishlist();
  const [cart, setCart] = useCart();
  const { selectedLocation, selectedLocationLabel } = useLocationContext();
  const confirm = useConfirm();

  const removeFromWishlist = async (
    productId,
    { skipConfirm = false, silent = false, productName = "this product" } = {}
  ) => {
    if (!skipConfirm) {
      const shouldRemove = await confirm({
        title: "Remove from wishlist?",
        message: `Remove "${productName}" from your wishlist?`,
        confirmText: "Remove",
        cancelText: "Keep",
        tone: "danger",
      });
      if (!shouldRemove) return false;
    }

    const updatedWishlist = wishlist.filter((item) => item._id !== productId);
    setWishlist(updatedWishlist);
    if (!silent) toast.success("Removed from wishlist");
    return true;
  };

  const addToCart = async (product) => {
    if (!isProductAvailableInLocation(product, selectedLocation)) {
      toast.error(`Not available in ${selectedLocationLabel}`);
      return;
    }

    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      toast.error("Product already in cart");
    } else {
      setCart([...cart, product]);
      await removeFromWishlist(product._id, {
        skipConfirm: true,
        silent: true,
        productName: product?.name,
      });
      toast.success("Added to cart");
    }
  };

  const moveAllToCart = () => {
    if (wishlist.length === 0) {
      toast.error("Wishlist is empty");
      return;
    }
    const newCart = [...cart];
    const remainingWishlist = [];
    let movedCount = 0;

    wishlist.forEach((product) => {
      const isAvailable = isProductAvailableInLocation(product, selectedLocation);
      if (!isAvailable) {
        remainingWishlist.push(product);
        return;
      }

      if (!cart.find((item) => item._id === product._id)) {
        newCart.push(product);
        movedCount += 1;
      }
    });

    setCart(newCart);
    setWishlist(remainingWishlist);

    if (movedCount > 0 && remainingWishlist.length > 0) {
      toast.success(`${movedCount} item(s) moved. Some items are unavailable in ${selectedLocationLabel}.`);
      return;
    }
    if (movedCount > 0) {
      toast.success("All available items moved to cart");
      return;
    }
    toast.error(`No wishlist items are deliverable to ${selectedLocationLabel}`);
  };

  return (
    <Layout title={"Your Wishlist"}>
      <div className="pt-24 pb-16 bg-gradient-to-br from-primary-50 via-white to-accent-50 min-h-screen">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20">
          {/* Header */}
          <div className="mb-12">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700 font-semibold mb-6 transition-all hover:gap-3 group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-primary-900">
                <span className="text-red-600">❤️</span> My Wishlist
              </h1>
              <p className="text-lg text-primary-600 font-medium">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
              </p>
            </div>
          </div>

          {wishlist.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-primary-100 p-16 text-center backdrop-blur-sm">
              <div className="mb-6 inline-block text-7xl p-6 bg-gradient-to-br from-accent-50 to-primary-50 rounded-full">📚</div>
              <h2 className="text-3xl font-bold text-primary-900 mb-3">
                Your wishlist is empty
              </h2>
              <p className="text-primary-600 mb-8 text-lg max-w-md mx-auto">
                Start adding your favorite books to your wishlist and discover amazing reads!
              </p>
              <button
                onClick={() => navigate("/categories")}
                className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-10 py-3 rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-lg hover:shadow-xl inline-flex items-center gap-2 group"
              >
                Continue Shopping
                <FiArrowLeft className="rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="mb-8 flex gap-3 justify-between items-center">
                <div className="text-sm font-medium text-primary-600">
                  {wishlist.length} item{wishlist.length !== 1 ? "s" : ""} ready to shop
                </div>
                <button
                  onClick={moveAllToCart}
                  className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-8 py-3 rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold shadow-lg hover:shadow-xl inline-flex items-center gap-2 group"
                >
                  <FiShoppingCart className="group-hover:scale-110 transition-transform" /> Move All to Cart
                </button>
              </div>

              {/* Wishlist Grid */}
              <div className="responsive-card-grid">
                {wishlist.map((product) => (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-primary-100 hover:border-accent-300 flex flex-col group hover:scale-105"
                  >
                    {/* Product Image */}
                    <div className="relative h-56 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden">
                      <img
                        src={
                          product.imageUrl ||
                          `https://placehold.co/300x400/f5f0e8/826b4d?text=${encodeURIComponent(
                            product.name
                          )}`
                        }
                        alt={product.name}
                        className="w-full h-full object-contain p-3 transition-transform duration-300"
                      />
                      <div className="absolute top-4 right-4 bg-gradient-to-r from-accent-500 to-accent-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        ₹{product.price}
                      </div>
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3.5 flex flex-col flex-1">
                      <h3 className="font-bold text-primary-900 text-xs line-clamp-2 mb-1 leading-snug">
                        {product.name}
                      </h3>
                      <p className="text-xs text-primary-600 line-clamp-1 mb-2">
                        {product.description}
                      </p>

                      {/* Rating */}
                      {product.rating && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <div className="flex text-accent-400 text-sm">
                            {"⭐".repeat(Math.floor(product.rating))}
                          </div>
                          <span className="text-xs text-primary-500 font-medium">
                            ({product.ratingCount || 0})
                          </span>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-1.5 mt-auto pt-3 border-t border-primary-100">
                        <button
                          onClick={() => addToCart(product)}
                          className="bg-gradient-to-r from-accent-500 to-accent-600 text-white px-1.5 py-2 rounded-lg hover:from-accent-600 hover:to-accent-700 transition-all font-semibold text-xs flex items-center justify-center gap-0.5 whitespace-nowrap h-8 shadow-sm hover:shadow-md group"
                        >
                          <FiShoppingCart className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Cart</span>
                        </button>
                        <button
                          onClick={() =>
                            removeFromWishlist(product._id, {
                              productName: product?.name,
                            })
                          }
                          className="bg-red-50 text-red-600 px-1.5 py-2 rounded-lg hover:bg-red-100 transition-all font-semibold text-xs border border-red-200 flex items-center justify-center gap-0.5 whitespace-nowrap h-8 group"
                        >
                          <FiTrash2 className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                        <button
                          onClick={() => navigate(`/product/${product.slug}`)}
                          className="bg-primary-100 text-primary-700 px-1.5 py-2 rounded-lg hover:bg-primary-200 transition-all font-semibold text-xs border border-primary-300 flex items-center justify-center gap-0.5 whitespace-nowrap h-8 group"
                        >
                          <FiEye className="w-3.5 h-3.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline">View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <div className="mt-16 text-center">
                <button
                  onClick={() => navigate("/categories")}
                  className="text-accent-600 hover:text-accent-700 font-semibold text-lg transition-all hover:gap-2 inline-flex items-center gap-1 group"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> Continue Shopping
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default WishlistPage;
