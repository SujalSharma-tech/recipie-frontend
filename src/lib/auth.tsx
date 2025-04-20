import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import ApiClient from "./api";
import { toast } from "sonner";

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
  cover_image: string | null;
  joined_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

interface RegisterData {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        ApiClient.setToken(token);
        const response = await ApiClient.get<{ user: User }>("/auth/me");
        setUser(response.user);
      } catch (err) {
        // If token is invalid, clear it
        ApiClient.setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.post<{ user: User; token: string }>(
        "/auth/login",
        { email, password }
      );

      ApiClient.setToken(response.token);
      setUser(response.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
      toast.error("Login failed", {
        description: err.message || "Login failed",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ApiClient.post<{ user: User; token: string }>(
        "/auth/register",
        userData
      );

      ApiClient.setToken(response.token);
      setUser(response.user);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
      toast.error("Registration failed", {
        description: err.message || "Registration failed",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await ApiClient.post("/auth/logout", {});
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      ApiClient.setToken(null);
      setUser(null);
      setIsLoading(false);
      navigate("/auth/login");
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
