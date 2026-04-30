import React, { useMemo } from "react";
import Layout from "./../components/Layout/Layout";
import { useCart } from "../context/cart";
import { useLocationContext } from "../context/location";
import { useNavigate } from "react-router-dom";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { isProductAvailableInLocation } from "../utils/locationUtils";
import { useConfirm } from "../context/confirm";

const formatCurrency = (value) => `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

const normalizedQty = (item) => {
  const qty = Number(item?.qty);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
};

const normalizedPrice = (item) => {
  const price = Number(item?.price);
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const CartPage = () => {
  const [cart, setCart] = useCart();
  const { selectedLocation, selectedLocationLabel, locationContext, isServiceable } =
    useLocationContext();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const cartItems = useMemo(
    () =>
      (cart || []).map((item) => ({
        ...item,
        qty: normalizedQty(item),
        price: normalizedPrice(item),
      })),
    [cart]
  );

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.qty, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cartItems]
  );

  const shipping = 0;
  const total = subtotal + shipping;

  const unavailableItems = useMemo(
    () =>
      cartItems.filter(
        (item) => !isProductAvailableInLocation(item, selectedLocation)
      ),
    [cartItems, selectedLocation]
  );
  const hasUnavailableItems = unavailableItems.length > 0;
  const hasLocationServiceConflict =
    Boolean(selectedLocation) &&
    Boolean(locationContext?.contextId) &&
    !isServiceable;
  const isProceedDisabled =
    !cartItems.length ||
    !selectedLocation ||
    hasUnavailableItems ||
    hasLocationServiceConflict;

  const persistCart = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
  };

  const clearCart = async () => {
    if (!cart.length) return;
    const shouldClear = await confirm({
      title: "Clear cart?",
      message: "This will remove all products from your cart.",
      confirmText: "Clear Cart",
      cancelText: "Keep Items",
      tone: "danger",
    });
    if (!shouldClear) return;

    persistCart([]);
    toast.success("Cart cleared");
  };

  const removeCartItem = async (product) => {
    if (!product?._id) return;

    const shouldRemove = await confirm({
      title: "Remove from cart?",
      message: `Remove "${product?.name || "this product"}" from your cart?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      tone: "danger",
    });
    if (!shouldRemove) return;

    try {
      const nextCart = cart.filter((item) => item._id !== product._id);
      persistCart(nextCart);
      toast.success("Item removed from cart");
    } catch (error) {
      console.log(error);
      toast.error("Unable to remove item");
    }
  };

  const updateQuantity = (pid, delta) => {
    const nextCart = cart.map((item) => {
      if (item._id !== pid) return item;
      const nextQty = Math.max(1, normalizedQty(item) + delta);
      return { ...item, qty: nextQty };
    });
    persistCart(nextCart);
  };

  return (
    <Layout title="Shopping Cart - Booklet">
      <section className="relative overflow-hidden bg-primary-50 min-h-screen pt-2 pb-24 md:pt-3 lg:pb-8">
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-accent-100/60 blur-3xl" />
        <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-primary-100/80 blur-3xl" />

        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10 mt-3">
          <div className="mb-3 sm:mb-4">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-primary-900 inline-flex items-center gap-2">
                <FiShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-accent-700" />
                Your Cart
              </h1>
              <p className="hidden sm:block text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">
                Review Items
              </p>
            </div>
            <div className="mt-1.5 h-px w-full bg-gradient-to-r from-accent-300 via-primary-200 to-transparent" />
            <p className="mt-1.5 text-xs sm:text-sm text-primary-700 leading-snug">
              Update quantities, remove items, then continue to checkout.
            </p>
            {selectedLocationLabel && (
              <p className="mt-1 text-xs text-primary-500">
                Delivering to: <span className="font-semibold text-primary-700">{selectedLocationLabel}</span>
              </p>
            )}
          </div>

          {cartItems.length === 0 ? (
            <div className="rounded-3xl border border-primary-200 bg-white shadow-sm text-center py-20 px-5">
              <div className="mx-auto h-16 w-16 rounded-2xl border border-accent-200 bg-accent-50 text-accent-700 flex items-center justify-center">
                <FiShoppingCart className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-xl font-semibold text-primary-900">Your cart is empty</h2>
              <p className="mt-1.5 text-sm text-primary-600">Add books to continue.</p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 h-10 px-5 rounded-lg border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100 text-sm font-semibold inline-flex items-center gap-2"
              >
                Continue Shopping
                <FiArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr,360px] gap-5 lg:gap-6 items-start">
              <div className="rounded-3xl border border-primary-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-primary-100 bg-primary-50/60 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-primary-900">Cart Items</h2>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="divide-y divide-primary-100">
                  {cartItems.map((product) => (
                    <div key={product._id} className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                      <img
                        src={
                          product.imageUrl ||
                          product.imageUrls?.[0] ||
                          "https://placehold.co/120x160/f5f0e8/826b4d?text=No+Image"
                        }
                        alt={product.name}
                        className="h-24 w-16 sm:h-28 sm:w-20 rounded-xl object-contain p-1 border border-primary-200 bg-primary-50"
                      />

                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() =>
                            product.slug
                              ? navigate(`/product/${product.slug}`)
                              : toast.error("Product details not available")
                          }
                          className="text-left w-full text-sm sm:text-base font-semibold text-primary-900 hover:text-accent-700 line-clamp-1"
                        >
                          {product.name}
                        </button>
                        <p className="mt-1 text-xs sm:text-sm text-primary-600 line-clamp-2">
                          {product.description || "No description available"}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          {isProductAvailableInLocation(product, selectedLocation) ? (
                            <div className="inline-flex items-center rounded-full border border-accent-200 bg-accent-50 px-2.5 py-1 text-[11px] font-semibold text-accent-700">
                              Available in your area
                            </div>
                          ) : (
                            <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                              Not deliverable to selected area
                            </div>
                          )}
                          <p className="text-xs text-primary-500">Unit: {formatCurrency(product.price)}</p>

                          <div className="inline-flex items-center rounded-lg border border-primary-200 bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product._id, -1)}
                              className="h-8 w-8 inline-flex items-center justify-center text-primary-700 hover:bg-primary-50"
                              aria-label="Decrease quantity"
                            >
                              <FiMinus className="h-3.5 w-3.5" />
                            </button>
                            <span className="h-8 min-w-[2rem] px-2 inline-flex items-center justify-center text-sm font-semibold text-primary-900 border-x border-primary-200">
                              {product.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product._id, 1)}
                              className="h-8 w-8 inline-flex items-center justify-center text-primary-700 hover:bg-primary-50"
                              aria-label="Increase quantity"
                            >
                              <FiPlus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-2">
                        <p className="text-sm sm:text-base font-bold text-accent-700 whitespace-nowrap">
                          {formatCurrency(product.price * product.qty)}
                        </p>
                        <button
                          onClick={() => removeCartItem(product)}
                          className="h-8 w-8 rounded-md border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center justify-center"
                          title="Remove item"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 bg-primary-50/50 border-t border-primary-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-primary-600">Need another title? Continue exploring catalog.</p>
                  <button
                    onClick={() => navigate("/")}
                    className="h-9 px-4 rounded-lg border border-primary-200 bg-white hover:bg-primary-50 text-primary-700 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    Continue Shopping
                    <FiArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-24">
                <div className="rounded-3xl border border-primary-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-primary-100 bg-primary-50/60">
                    <h3 className="text-sm font-semibold text-primary-900">Cart Summary</h3>
                  </div>
                  <div className="p-4 space-y-3.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600">Items</span>
                      <span className="font-semibold text-primary-900">{itemCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600">Subtotal</span>
                      <span className="font-semibold text-primary-900">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary-600">Shipping</span>
                      <span className="font-semibold text-green-700">
                        {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-primary-100 flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary-900">Total</span>
                      <span className="text-xl font-bold text-accent-700">{formatCurrency(total)}</span>
                    </div>

                    {hasUnavailableItems && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 inline-flex items-center gap-1.5">
                        <FiAlertTriangle className="h-4 w-4" />
                        {unavailableItems.length} item{unavailableItems.length === 1 ? "" : "s"} unavailable for {selectedLocationLabel}
                      </div>
                    )}

                    {!selectedLocation && (
                      <p className="text-[11px] text-red-600">
                        Select delivery location from header to continue.
                      </p>
                    )}
                    {hasLocationServiceConflict && (
                      <p className="text-[11px] text-red-600">
                        Delivery at this location is currently unavailable. Coming Soon.
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate("/checkout")}
                      disabled={isProceedDisabled}
                      className="h-11 w-full rounded-xl bg-accent-500 hover:bg-accent-600 disabled:bg-accent-300 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-primary-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_-8px_28px_-16px_rgba(90,74,56,0.35)]">
            <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-primary-500">
                  {itemCount} item{itemCount === 1 ? "" : "s"}
                  {selectedLocationLabel ? ` • ${selectedLocationLabel}` : ""}
                </p>
                <p className="text-base font-bold text-accent-700">{formatCurrency(total)}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                disabled={isProceedDisabled}
                className="h-11 px-4 rounded-xl bg-accent-500 hover:bg-accent-600 disabled:bg-accent-300 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default CartPage;
