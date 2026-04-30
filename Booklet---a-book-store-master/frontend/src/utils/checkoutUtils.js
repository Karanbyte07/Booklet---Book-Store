const BUY_NOW_CHECKOUT_KEY = "buyNowCheckoutItem";

export const setBuyNowCheckoutItem = (item) => {
  if (typeof window === "undefined" || !item) return;

  try {
    window.sessionStorage.setItem(BUY_NOW_CHECKOUT_KEY, JSON.stringify(item));
  } catch (error) {
    console.log("Unable to persist buy now checkout item:", error);
  }
};

export const getBuyNowCheckoutItem = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawItem = window.sessionStorage.getItem(BUY_NOW_CHECKOUT_KEY);
    if (!rawItem) return null;

    const parsedItem = JSON.parse(rawItem);
    if (!parsedItem?._id) return null;
    return parsedItem;
  } catch (error) {
    console.log("Unable to read buy now checkout item:", error);
    return null;
  }
};

export const clearBuyNowCheckoutItem = () => {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(BUY_NOW_CHECKOUT_KEY);
  } catch (error) {
    console.log("Unable to clear buy now checkout item:", error);
  }
};

