import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiExternalLink,
  FiHeart,
  FiMinus,
  FiPlus,
  FiShoppingCart,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useCart } from "../../context/cart";
import { useWishlist } from "../../context/wishlist";
import { useLocationContext } from "../../context/location";
import { useConfirm } from "../../context/confirm";
import { isProductAvailableInLocation } from "../../utils/locationUtils";

const formatCurrency = (value) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN")}`;

const normalizedQty = (item) => {
  const qty = Number(item?.qty);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
};

const normalizedPrice = (item) => {
  const price = Number(item?.price);
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const drawerTabClass = (isActive) =>
  `h-8 rounded-full px-3 text-xs font-semibold transition-colors ${
    isActive
      ? "bg-accent-500 text-white"
      : "bg-primary-100 text-primary-700 hover:bg-primary-200"
  }`;

const CartWishlistDrawer = ({ panel, onClose, onSetPanel }) => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [cart, setCart] = useCart();
  const [wishlist, setWishlist] = useWishlist();
  const { selectedLocation, selectedLocationLabel } = useLocationContext();

  const isOpen = Boolean(panel);
  const isCartPanel = panel === "cart";

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

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

  const unavailableItems = useMemo(
    () =>
      cartItems.filter(
        (item) => !isProductAvailableInLocation(item, selectedLocation)
      ),
    [cartItems, selectedLocation]
  );
  const hasUnavailableItems = unavailableItems.length > 0;

  const persistCart = (nextCart) => {
    setCart(nextCart);
    localStorage.setItem("cart", JSON.stringify(nextCart));
  };

  const persistWishlist = (nextWishlist) => {
    setWishlist(nextWishlist);
    localStorage.setItem("wishlist", JSON.stringify(nextWishlist));
  };

  const clearCart = async () => {
    if (!cartItems.length) return;
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

    const nextCart = cart.filter((item) => item._id !== product._id);
    persistCart(nextCart);
    toast.success("Item removed from cart");
  };

  const updateQuantity = (pid, delta) => {
    const nextCart = cart.map((item) => {
      if (item._id !== pid) return item;
      const nextQty = Math.max(1, normalizedQty(item) + delta);
      return { ...item, qty: nextQty };
    });
    persistCart(nextCart);
  };

  const removeFromWishlist = async (product) => {
    if (!product?._id) return;

    const shouldRemove = await confirm({
      title: "Remove from wishlist?",
      message: `Remove "${product?.name || "this product"}" from your wishlist?`,
      confirmText: "Remove",
      cancelText: "Keep",
      tone: "danger",
    });
    if (!shouldRemove) return;

    const nextWishlist = wishlist.filter((item) => item._id !== product._id);
    persistWishlist(nextWishlist);
    toast.success("Removed from wishlist");
  };

  const addWishlistToCart = async (product) => {
    if (!product?._id) return;

    if (!isProductAvailableInLocation(product, selectedLocation)) {
      toast.error(`Not available in ${selectedLocationLabel || "selected area"}`);
      return;
    }

    const existingItem = cart.find((item) => item._id === product._id);
    if (existingItem) {
      toast.error("Product already in cart");
      return;
    }

    const nextCart = [...cart, { ...product, qty: normalizedQty(product) }];
    const nextWishlist = wishlist.filter((item) => item._id !== product._id);
    persistCart(nextCart);
    persistWishlist(nextWishlist);
    toast.success("Added to cart");
  };

  const moveAllToCart = () => {
    if (!wishlist.length) {
      toast.error("Wishlist is empty");
      return;
    }

    const nextCart = [...cart];
    const remainingWishlist = [];
    let movedCount = 0;

    wishlist.forEach((product) => {
      if (!isProductAvailableInLocation(product, selectedLocation)) {
        remainingWishlist.push(product);
        return;
      }

      if (!nextCart.find((item) => item._id === product._id)) {
        nextCart.push({ ...product, qty: normalizedQty(product) });
        movedCount += 1;
      }
    });

    persistCart(nextCart);
    persistWishlist(remainingWishlist);

    if (movedCount > 0 && remainingWishlist.length > 0) {
      toast.success(
        `${movedCount} item(s) moved. Some items are unavailable in ${
          selectedLocationLabel || "selected area"
        }.`
      );
      return;
    }
    if (movedCount > 0) {
      toast.success("All available items moved to cart");
      return;
    }
    toast.error(
      `No wishlist items are deliverable to ${selectedLocationLabel || "selected area"}`
    );
  };

  const openProduct = (product) => {
    if (!product?.slug) {
      toast.error("Product details not available");
      return;
    }
    onClose();
    navigate(`/product/${product.slug}`);
  };

  const proceedCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  const continueShopping = () => {
    onClose();
    navigate("/");
  };

  return (
    <div
      className={`fixed inset-0 z-[120] transition-opacity duration-300 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-primary-900/35 backdrop-blur-[1px]"
        aria-label="Close panel"
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-[min(94vw,440px)] flex-col border-l border-primary-200 bg-white shadow-[-18px_0_48px_-26px_rgba(54,43,33,0.55)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="border-b border-primary-100 bg-gradient-to-r from-white via-primary-50 to-accent-50 px-4 py-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-500">
                Quick Access
              </p>
              <h2 className="text-lg font-bold text-primary-900">
                {isCartPanel ? "Your Cart" : "Your Wishlist"}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-primary-200 bg-white text-primary-700 hover:border-primary-300 hover:text-primary-900"
              aria-label="Close"
            >
              <FiX className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-3 inline-flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSetPanel("wishlist")}
              className={drawerTabClass(panel === "wishlist")}
            >
              Wishlist ({wishlist.length})
            </button>
            <button
              type="button"
              onClick={() => onSetPanel("cart")}
              className={drawerTabClass(panel === "cart")}
            >
              Cart ({itemCount})
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isCartPanel ? (
            cartItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <FiShoppingCart className="h-9 w-9 text-primary-400" />
                <p className="mt-3 text-sm font-semibold text-primary-900">
                  Your cart is empty
                </p>
                <button
                  type="button"
                  onClick={continueShopping}
                  className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-accent-200 bg-accent-50 px-3 text-xs font-semibold text-accent-700 hover:bg-accent-100"
                >
                  Continue Shopping
                  <FiArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-primary-600">
                    {itemCount} item{itemCount === 1 ? "" : "s"}
                  </p>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Clear Cart
                  </button>
                </div>

                {selectedLocationLabel && (
                  <p className="text-[11px] text-primary-500">
                    Delivering to{" "}
                    <span className="font-semibold text-primary-700">
                      {selectedLocationLabel}
                    </span>
                  </p>
                )}

                <div className="divide-y divide-primary-100">
                  {cartItems.map((product) => (
                    <article key={product._id} className="flex gap-3 py-3">
                      <img
                        src={
                          product.imageUrl ||
                          product.imageUrls?.[0] ||
                          "https://placehold.co/120x160/f5f0e8/826b4d?text=No+Image"
                        }
                        alt={product.name}
                        className="h-20 w-14 border border-primary-200 bg-primary-50 object-contain p-1"
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openProduct(product)}
                          className="line-clamp-1 text-left text-sm font-semibold text-primary-900 hover:text-accent-700"
                        >
                          {product.name}
                        </button>
                        <p className="mt-0.5 text-xs text-primary-600">
                          {formatCurrency(product.price)} each
                        </p>
                        {!isProductAvailableInLocation(product, selectedLocation) && (
                          <p className="mt-1 text-[11px] font-semibold text-red-600">
                            Unavailable for selected location
                          </p>
                        )}
                        <div className="mt-2 inline-flex items-center border border-primary-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product._id, -1)}
                            className="inline-flex h-7 w-7 items-center justify-center text-primary-700 hover:bg-primary-50"
                          >
                            <FiMinus className="h-3.5 w-3.5" />
                          </button>
                          <span className="inline-flex h-7 min-w-[1.9rem] items-center justify-center border-x border-primary-200 px-1 text-xs font-semibold text-primary-900">
                            {product.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product._id, 1)}
                            className="inline-flex h-7 w-7 items-center justify-center text-primary-700 hover:bg-primary-50"
                          >
                            <FiPlus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <p className="text-sm font-bold text-accent-700">
                          {formatCurrency(product.price * product.qty)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeCartItem(product)}
                          className="inline-flex h-7 w-7 items-center justify-center border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )
          ) : wishlist.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <FiHeart className="h-9 w-9 text-primary-400" />
              <p className="mt-3 text-sm font-semibold text-primary-900">
                Wishlist is empty
              </p>
              <button
                type="button"
                onClick={continueShopping}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md border border-accent-200 bg-accent-50 px-3 text-xs font-semibold text-accent-700 hover:bg-accent-100"
              >
                Discover Books
                <FiArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-primary-600">
                  {wishlist.length} item{wishlist.length === 1 ? "" : "s"} saved
                </p>
                <button
                  type="button"
                  onClick={moveAllToCart}
                  className="text-xs font-semibold text-accent-700 hover:text-accent-800"
                >
                  Move all to cart
                </button>
              </div>

              {selectedLocationLabel && (
                <p className="text-[11px] text-primary-500">
                  Delivery location:{" "}
                  <span className="font-semibold text-primary-700">
                    {selectedLocationLabel}
                  </span>
                </p>
              )}

              <div className="divide-y divide-primary-100">
                {wishlist.map((product) => (
                  <article key={product._id} className="flex gap-3 py-3">
                    <img
                      src={
                        product.imageUrl ||
                        product.imageUrls?.[0] ||
                        "https://placehold.co/120x160/f5f0e8/826b4d?text=No+Image"
                      }
                      alt={product.name}
                      className="h-20 w-14 border border-primary-200 bg-primary-50 object-contain p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openProduct(product)}
                        className="line-clamp-1 text-left text-sm font-semibold text-primary-900 hover:text-accent-700"
                      >
                        {product.name}
                      </button>
                      <p className="mt-0.5 text-xs text-primary-600">
                        {formatCurrency(product.price)}
                      </p>
                      {!isProductAvailableInLocation(product, selectedLocation) && (
                        <p className="mt-1 text-[11px] font-semibold text-red-600">
                          Not available in selected area
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => addWishlistToCart(product)}
                          className="inline-flex h-7 items-center gap-1 border border-accent-200 bg-accent-50 px-2 text-[11px] font-semibold text-accent-700 hover:bg-accent-100"
                        >
                          <FiShoppingCart className="h-3.5 w-3.5" />
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => openProduct(product)}
                          className="inline-flex h-7 items-center gap-1 border border-primary-200 bg-primary-50 px-2 text-[11px] font-semibold text-primary-700 hover:bg-primary-100"
                        >
                          <FiExternalLink className="h-3.5 w-3.5" />
                          View
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromWishlist(product)}
                      className="inline-flex h-7 w-7 items-center justify-center border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        {isCartPanel && cartItems.length > 0 && (
          <div className="border-t border-primary-100 bg-white px-4 py-3">
            {hasUnavailableItems && (
              <p className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
                <FiAlertTriangle className="h-3.5 w-3.5" />
                {unavailableItems.length} item
                {unavailableItems.length === 1 ? "" : "s"} unavailable for delivery
              </p>
            )}
            {!selectedLocation && (
              <p className="mb-2 text-[11px] font-medium text-red-600">
                Select delivery location from header to continue.
              </p>
            )}
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary-700">Total</span>
              <span className="text-xl font-bold text-accent-700">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={proceedCheckout}
              disabled={!selectedLocation || hasUnavailableItems}
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-gradient-to-r from-accent-500 to-accent-600 text-sm font-semibold text-white transition-colors hover:from-accent-600 hover:to-accent-700 disabled:cursor-not-allowed disabled:from-accent-300 disabled:to-accent-300"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
};

export default CartWishlistDrawer;
