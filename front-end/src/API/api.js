import axios from "axios";
import { CSRF } from "../utils/csrf";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isAuthRequest =
      config.url === "/auth/login" || config.url === "/auth/register";

    if (config.method !== "get" && !isAuthRequest) {
      let csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("csrf_token="))
        ?.split("=")[1];

      if (!csrfToken) {
        csrfToken = CSRF.getToken();
      }

      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      } else {
        console.warn("No CSRF token found for request:", config.url);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const csrfToken =
      response.headers["x-csrf-token"] || response.headers["X-CSRF-Token"];

    return response;
  },
  (error) => {
    if (error.response?.status === 403) {
      const csrfError = CSRF.handleError(error);
      return Promise.reject(csrfError);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/SignIn")) {
        window.location.href = "/SignIn";
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      const { user, token } = response.data;
      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      const csrfToken = response.headers["x-csrf-token"];
      if (csrfToken) {
        CSRF.setToken(csrfToken);
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to sign in. Please check your credentials.");
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);

      const { token, user, message } = response.data;

      const userObject = user || response.data.user;

      if (!token || !userObject) {
        console.error(
          "Invalid registration response structure:",
          response.data
        );
        if (response.data && response.data.id) {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(response.data));
          return { user: response.data, token };
        }
        throw new Error(
          "Invalid response from server: missing token or user data"
        );
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userObject));
      return { user: userObject, token, message };
    } catch (error) {
      console.error("Registration error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to register. Please try again.");
    }
  },

  logout: async () => {
    try {
      const response = await api.post("/auth/logout");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to logout. Please try again.");
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/profile");

      const { user } = response.data;
      if (!user) {
        throw new Error("Invalid profile response");
      }

      localStorage.setItem("user", JSON.stringify(user));
      return response.data;
    } catch (error) {
      console.error("GetProfile error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get profile. Please try again.");
    }
  },

  getUserGoals: async () => {
    try {
      const response = await api.get("/user/goals");

      if (!response.data.goals) {
        throw new Error("Invalid goals response");
      }

      return response.data.goals;
    } catch (error) {
      console.error("Get user goals error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get user goals. Please try again.");
    }
  },

  updateUserGoals: async (goals) => {
    try {
      const response = await api.put("/user/goals", goals);

      return response.data.goals;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to update user goals. Please try again.");
    }
  },
};

export const foodEntryAPI = {
  addFoodEntry: async (foodEntry) => {
    try {
      const requiredFields = [
        "foodId",
        "name",
        "amount",
        "date",
        "calories",
        "protein",
        "carbs",
        "fat",
      ];
      let missingFields = [];

      requiredFields.forEach((field) => {
        if (foodEntry[field] === undefined) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        console.error(`Missing required fields: ${missingFields.join(", ")}`);
        if (foodEntry.fats !== undefined && !foodEntry.fat) {
          console.warn('Found "fats" field but "fat" is required. Fixing...');
          foodEntry.fat = foodEntry.fats;
        }
      }

      const sanitizedEntry = {
        foodId: foodEntry.foodId,
        name: foodEntry.name,
        amount: foodEntry.amount,
        date: foodEntry.date,
        calories: foodEntry.calories,
        protein: foodEntry.protein,
        carbs: foodEntry.carbs,
        fat: foodEntry.fat || foodEntry.fats,
      };

      const response = await api.post("/consumed-foods", sanitizedEntry);
      return response.data;
    } catch (error) {
      console.error("Error adding food entry:", error);
      console.error("Request payload was:", JSON.stringify(foodEntry));
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to add food entry. Please try again.");
    }
  },

  getDailyEntries: async (date) => {
    try {
      const response = await api.get(`/consumed-foods/daily?date=${date}`);

      if (!response.data) {
        return [];
      }

      if (!Array.isArray(response.data)) {
        console.error("Non-array response for daily entries:", response.data);
        return [];
      }

      const mappedEntries = response.data.map((entry) => {
        let entryDate = entry.entry_date;
        let timestamp = "";

        try {
          if (entryDate) {
            const date = new Date(entryDate);
            if (!isNaN(date.getTime())) {
              timestamp = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          }
        } catch (err) {
          console.error("Error parsing entry date:", err, entryDate);
        }

        if (!timestamp) {
          timestamp = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        return {
          id: entry.id,
          name: entry.food_name,
          amount: entry.quantity,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          calories: entry.calories,
          date: new Date(entry.entry_date),
          timestamp: timestamp,
          grams: entry.quantity,
        };
      });

      return mappedEntries;
    } catch (error) {
      console.error("Error in getDailyEntries:", error);
      console.error("Response:", error.response?.data);
      console.error("Status:", error.response?.status);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get daily entries. Please try again.");
    }
  },

  getDailyNutrition: async (date) => {
    try {
      const response = await api.get(`/consumed-foods/nutrition?date=${date}`);
      return {
        total_calories: response.data.total_calories || 0,
        total_protein: response.data.total_protein || 0,
        total_carbs: response.data.total_carbs || 0,
        total_fats: response.data.total_fats || 0,
      };
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get daily nutrition. Please try again.");
    }
  },

  deleteFoodEntry: async (entryId) => {
    try {
      await api.delete(`/consumed-foods/${entryId}`);
      return true;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to delete food entry. Please try again.");
    }
  },

  getNutritionHistory: async (startDate, endDate) => {
    try {
      const url = `/consumed-foods/history?startDate=${startDate}&endDate=${endDate}&combineData=true`;
      const response = await api.get(url);

      if (!response.data) {
        console.warn("Empty nutrition history response, returning empty array");
        return [];
      }
      if (!Array.isArray(response.data)) {
        console.warn("Non-array nutrition history response:", response.data);

        if (response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map((entry) => ({
            date: entry.date,
            total_calories: Number(entry.total_calories || 0),
            total_protein: Number(entry.total_protein || 0),
            total_carbs: Number(entry.total_carbs || 0),
            total_fats: Number(entry.total_fats || 0),
          }));
        }

        return [];
      }

      const processedData = response.data.map((entry) => ({
        date: entry.date,
        total_calories: Number(entry.total_calories || 0),
        total_protein: Number(entry.total_protein || 0),
        total_carbs: Number(entry.total_carbs || 0),
        total_fats: Number(entry.total_fats || 0),
      }));

      return processedData;
    } catch (error) {
      console.error("Error fetching nutrition history:", error);
      console.error("Response data:", error.response?.data);
      console.error("Status:", error.response?.status);

      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get nutrition history. Please try again.");
    }
  },
};

export const foodAPI = {
  searchFoods: async (query) => {
    const response = await api.get(`/foods/search?q=${query}`);
    return response.data;
  },
  getFoodDetails: async (id) => {
    const response = await api.get(`/foods/${id}`);
    return response.data;
  },
};

export const dietitianAPI = {
  getDietitians: async () => {
    const response = await api.get("/dietitians");
    return response.data;
  },
  getDietitian: async (id) => {
    const response = await api.get(`/dietitians/${id}`);
    return response.data;
  },
  requestConsultation: async (dietitianId, data) => {
    const response = await api.post(
      `/dietitians/${dietitianId}/consultations`,
      data
    );
    return response.data;
  },
  getAvailableDietitians: async () => {
    try {
      const response = await api.get("/dietitians");
      return response.data;
    } catch (error) {
      console.error("Error fetching available dietitians:", error);
      throw new Error("Failed to fetch available dietitians. Please try again.");
    }
  },
  subscribeToDietitian: async (dietitianId) => {
    try {
      const response = await api.post(`/dietitians/${dietitianId}/subscribe`);
      return response.data;
    } catch (error) {
      console.error("Error subscribing to dietitian:", error);
      throw new Error("Failed to subscribe to dietitian. Please try again.");
    }
  },
  unsubscribeFromDietitian: async (dietitianId) => {
    try {
      const response = await api.delete(`/dietitians/${dietitianId}/subscribe`);
      return response.data;
    } catch (error) {
      console.error("Error unsubscribing from dietitian:", error);
      throw new Error("Failed to unsubscribe from dietitian. Please try again.");
    }
  },

  getSubscribedUsers: async () => {
    const response = await api.get(`/dietitian/users`);
    return response.data;
  },

  getUserProgress: async (userId) => {
    const response = await api.get(`/dietitian/users/${userId}/progress`);
    return response.data;
  },
  
  getUserGoals: async (userId) => {
    try {
      const response = await api.get(`/dietitian/users/${userId}/goals`);
      return response.data.goals;
    } catch (error) {
      console.error("Get user goals error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to get user goals. Please try again.");
    }
  },
  
  updateUserGoals: async (userId, goals) => {
    try {
      const response = await api.put(`/dietitian/users/${userId}/goals`, goals);
      return response.data.goals;
    } catch (error) {
      console.error("Update user goals error:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error("Failed to update user goals. Please try again.");
    }
  },
};

export const adminAPI = {
  getUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
  createUser: async (data) => {
    try {
      const response = await api.post("/admin/users", data);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
  updateUser: async (userId, data) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
  getAllUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data;
    } catch (error) {
      console.error("Error in getAllUsers:", error);
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  },
};

export const fetchCSRFToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/csrf`, {
      withCredentials: true,
    });

    const csrfToken =
      response.headers["x-csrf-token"] || response.headers["X-CSRF-Token"];

    if (csrfToken) {
      CSRF.setToken(csrfToken);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return false;
  }
};

export default api;
