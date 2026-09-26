import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Loader from "./components/Loader";

import Home from "./pages/Home";

const Products = lazy(() => import("./pages/Products"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Customizer = lazy(() => import("./pages/Customizer"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const OrderDetails = lazy(() => import("./pages/Orderdetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminDesigns = lazy(() => import("./pages/AdminDesigns"));
const AdminBanners = lazy(() => import("./pages/AdminBanners"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));

const PublicCustomerRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (!loading && user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<MainLayout />}>
                <Route
                  path="/"
                  element={
                    <PublicCustomerRoute>
                      <Home />
                    </PublicCustomerRoute>
                  }
                />

                <Route
                  path="/products"
                  element={
                    <PublicCustomerRoute>
                      <Products />
                    </PublicCustomerRoute>
                  }
                />

                <Route
                  path="/products/:slug"
                  element={
                    <PublicCustomerRoute>
                      <ProductDetails />
                    </PublicCustomerRoute>
                  }
                />

                <Route
                  path="/customize/:id"
                  element={
                    <ProtectedRoute>
                      <Customizer />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetails />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
              </Route>

              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />

                <Route
                  path="products"
                  element={<AdminProducts />}
                />

                <Route
                  path="categories"
                  element={<AdminCategories />}
                />

                <Route
                  path="designs"
                  element={<AdminDesigns />}
                />

                <Route
                  path="banners"
                  element={<AdminBanners />}
                />

                <Route
                  path="coupons"
                  element={<AdminCoupons />}
                />

                <Route
                  path="orders"
                  element={<AdminOrders />}
                />

                <Route
                  path="customers"
                  element={<AdminCustomers />}
                />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

export default App;