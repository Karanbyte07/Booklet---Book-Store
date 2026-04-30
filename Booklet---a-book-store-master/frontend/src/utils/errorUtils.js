export const getApiErrorMessage = (
  error,
  fallback = "We couldn't process your request. Please try again."
) => {
  const response = error?.response;
  const data = response?.data;

  const messageCandidates = [
    typeof data?.message === "string" ? data.message.trim() : "",
    typeof data?.error === "string" ? data.error.trim() : "",
    typeof data?.error?.message === "string" ? data.error.message.trim() : "",
  ];

  const backendMessage = messageCandidates.find(Boolean);
  if (backendMessage) return backendMessage;

  if (response?.status === 413) {
    return "Upload is too large. Reduce image size/count and try again.";
  }
  if (response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }
  if (response?.status === 403) {
    return "You do not have permission for this action.";
  }
  if (response?.status === 404) {
    return "Requested resource was not found.";
  }
  if (response?.status >= 500) {
    return "Server error. Please try again shortly.";
  }
  if (error?.message === "Network Error") {
    return "Unable to reach server. Check your internet connection.";
  }

  return fallback;
};
