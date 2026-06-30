import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { CartProvider } from "./components/CartContext";
import Layout from "./components/Layout";
import AddressFormPage from "./pages/AddressFormPage";
import Addresses from "./pages/Addresses";
import CartPage from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentMethodNew from "./pages/PaymentMethodNew";
import PaymentMethods from "./pages/PaymentMethods";
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
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/products" element={<Products />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/complete/:orderId" element={<OrderConfirmation />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/addresses/new" element={<AddressFormPage />} />
            <Route path="/addresses/:id/edit" element={<AddressFormPage />} />
            <Route path="/payment-methods" element={<PaymentMethods />} />
            <Route path="/payment-methods/new" element={<PaymentMethodNew />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
