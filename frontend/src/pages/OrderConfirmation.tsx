import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { formatAddress } from "../utils/format";
import type { Order } from "../types";

export default function OrderConfirmation() {
  const { token } = useAuth();
  const location = useLocation();
  const order = location.state?.order as Order | undefined;

  if (!token) return <Navigate to="/login" replace />;
  if (!order) return <Navigate to="/products" replace />;

  return (
    <div className="checkout-section">
      <h1>Order placed</h1>
      <p className="message">Thank you! Your order #{order.id} has been confirmed.</p>
      <p className="cart-total">Total charged: ${order.total.toFixed(2)}</p>
      <p className="muted">
        Shipping to: {formatAddress(order.address)} ({order.address.label})
      </p>
      <p className="muted">
        Paid with {order.payment_method.label} ending in {order.payment_method.last_four}
      </p>
      <ul className="checkout-items">
        {order.items.map((item) => (
          <li key={item.id}>
            <span>
              {item.product.name} × {item.quantity}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <Link to="/products" className="btn-primary">
        Continue shopping
      </Link>
    </div>
  );
}
