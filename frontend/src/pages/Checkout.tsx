import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  checkout,
  getCart,
  listAddresses,
  listPaymentMethods,
} from "../api/shop";
import { useAuth } from "../components/AuthContext";
import { useCart } from "../components/CartContext";
import { formatAddress } from "../utils/format";
import type { Address, Cart, PaymentMethod } from "../types";

export default function Checkout() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [addressId, setAddressId] = useState<number | "">("");
  const [paymentId, setPaymentId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getCart(), listAddresses(), listPaymentMethods()])
      .then(([cartData, addressData, methodData]) => {
        setCart(cartData);
        setAddresses(addressData);
        setMethods(methodData);
        const preferredAddress = addressData.find((a) => a.is_preferred);
        const preferredMethod = methodData.find((m) => m.is_preferred);
        setAddressId(preferredAddress?.id ?? addressData[0]?.id ?? "");
        setPaymentId(preferredMethod?.id ?? methodData[0]?.id ?? "");
      })
      .finally(() => setLoading(false));
  }, []);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <p>Loading checkout...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div>
        <h1>Checkout</h1>
        <p>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!addressId || !paymentId) {
      setError("Select an address and payment method.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const order = await checkout(addressId, paymentId);
      await refreshCart();
      navigate(`/checkout/complete/${order.id}`, { state: { order } });
    } catch {
      setError("Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Checkout</h1>
      {error && <p className="error">{error}</p>}

      <section className="checkout-section">
        <h2>Order summary</h2>
        <ul className="checkout-items">
          {cart.items.map((item) => (
            <li key={item.id}>
              <span>
                {item.product.name} × {item.quantity}
              </span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="cart-total">Total: ${cart.total.toFixed(2)}</p>
      </section>

      <form onSubmit={handleSubmit} className="checkout-form">
        <section className="checkout-section">
          <div className="section-header">
            <h2>Shipping address</h2>
            <Link to="/addresses/new">Add address</Link>
          </div>
          {addresses.length === 0 ? (
            <p>
              No addresses on file. <Link to="/addresses/new">Add an address</Link> to continue.
            </p>
          ) : (
            <div className="option-list">
              {addresses.map((address) => (
                <label key={address.id} className="option-card">
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === address.id}
                    onChange={() => setAddressId(address.id)}
                  />
                  <div>
                    <strong>
                      {address.label}
                      {address.is_preferred && <span className="badge">Preferred</span>}
                    </strong>
                    <p className="muted">{formatAddress(address)}</p>
                    <Link to={`/addresses/${address.id}/edit`}>Edit</Link>
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        <section className="checkout-section">
          <div className="section-header">
            <h2>Payment method</h2>
            <Link to="/payment-methods/new">Add payment method</Link>
          </div>
          {methods.length === 0 ? (
            <p>
              No payment methods on file.{" "}
              <Link to="/payment-methods/new">Add a payment method</Link> to continue.
            </p>
          ) : (
            <div className="option-list">
              {methods.map((method) => (
                <label key={method.id} className="option-card">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentId === method.id}
                    onChange={() => setPaymentId(method.id)}
                  />
                  <div>
                    <strong>
                      {method.label}
                      {method.is_preferred && <span className="badge">Preferred</span>}
                    </strong>
                    <p className="muted">
                      Card ending in {method.last_four} · Expires {method.expiry_month}/
                      {method.expiry_year}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </section>

        <div className="form-actions">
          <button
            type="submit"
            disabled={submitting || addresses.length === 0 || methods.length === 0}
          >
            {submitting ? "Placing order..." : "Place order"}
          </button>
          <Link to="/cart">Back to cart</Link>
        </div>
      </form>
    </div>
  );
}
