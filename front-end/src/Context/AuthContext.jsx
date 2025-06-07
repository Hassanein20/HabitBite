import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../API/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authAPI.getProfile();

        if (response && response.user) {
          setCurrentUser(response.user);
          localStorage.setItem("user", JSON.stringify(response.user));
        } else {
          throw new Error("Invalid profile response");
        }
      } catch (err) {
        console.error("Error checking login status:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setCurrentUser(null);
        } else {
          console.warn("Profile fetch failed but keeping existing user data");
        }
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);

      if (response && response.user) {
        setCurrentUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));
        return response.user;
      } else {
        throw new Error("Invalid login response");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setCurrentUser(null);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.register(userData);

      if (response && response.user) {
        setCurrentUser(response.user);
        localStorage.setItem("user", JSON.stringify(response.user));

        if (response.token) {
          localStorage.setItem("token", response.token);
        }

        return response;
      } else {
        console.error("Invalid registration response structure:", response);
        throw new Error("Invalid registration response");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.error || err.message || "Registration failed"
      );
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
  };

  if (loading) {
    return (
      <div
        className='d-flex justify-content-center align-items-center'
        style={{ height: "100vh" }}
      >
        <div className='spinner-border text-primary' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
