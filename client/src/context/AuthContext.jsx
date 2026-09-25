import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import authService from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initialToken = localStorage.getItem("token");

    if (!initialToken) {
      setLoading(false);
    } else {
      const loadUser = async () => {
        try {
          const response = await authService.getProfile();

          if (isMounted && localStorage.getItem("token") === initialToken) {
            setUser(response.user);
          }
        } catch (error) {
          console.warn("[AUTH TOKEN REMOVAL TRACE]", {
            source: "AuthContext.loadUser",
            reason: "profile request failed",
          });
        } finally {
          if (isMounted && localStorage.getItem("token") === initialToken) {
            setLoading(false);
          }
        }
      };

      loadUser();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login({
      email,
      password,
    });

    localStorage.setItem("token", response.token);
    setUser(response.user);
    setLoading(false);

    return response;
  }, []);

  const register = useCallback(async (userData) => {
    const response = await authService.register(userData);

    return response;
  }, []);

  const logout = useCallback(() => {
    console.warn("[AUTH TOKEN REMOVAL TRACE]", {
      source: "AuthContext.logout",
      reason: "explicit user logout action",
    });
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === "admin",
    }),
    [user, loading, login, register, logout, updateUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};