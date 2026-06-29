import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Layout from "./components/Layout";
import CartPage from "./pages/Cart";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import Products from "./pages/Products";
import Register from "./pages/Register";
import "./styles.css";

function HomeRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? "/products" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
