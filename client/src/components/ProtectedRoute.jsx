import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({
  children,
  adminOnly = false,
}) => {
  const {
    user,
    loading,
    isAdmin,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (adminOnly) {
    if (!isAdmin) {
      return (
        <Navigate
          to="/"
          replace
        />
      );
    }

    return children;
  }

  if (isAdmin) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;