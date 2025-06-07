export const CSRF = {
  getToken: () => {
    return localStorage.getItem("csrf_token");
  },

  setToken: (token) => {
    localStorage.setItem("csrf_token", token);
  },

  validateToken: (token) => {
    return token && token.length > 0;
  },

  handleError: (error) => {
    if (error.response?.status === 403) {
      localStorage.removeItem("csrf_token");
      return {
        error: true,
        message: "Session expired. Please try again.",
        shouldRetry: true,
      };
    }
    return {
      error: true,
      message: error.message || "An error occurred. Please try again.",
      shouldRetry: false,
    };
  },
};
