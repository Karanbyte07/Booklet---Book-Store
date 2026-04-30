import axios from "../../config/axios";

export const fetchProductReviews = async (productId) => {
  const { data } = await axios.get(`/api/v1/review/product/${productId}`);
  return data;
};

export const createOrUpdateProductReview = async (productId, payload) => {
  const { data } = await axios.post(`/api/v1/review/product/${productId}`, payload);
  return data;
};
