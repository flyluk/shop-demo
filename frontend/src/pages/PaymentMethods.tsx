import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  deletePaymentMethod,
  listPaymentMethods,
  setPreferredPaymentMethod,
} from "../api/shop";
import { useAuth } from "../components/AuthContext";
import type { PaymentMethod } from "../types";

export default function PaymentMethods() {
  const { token } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = () =>
    listPaymentMethods()
      .then(setMethods)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <p>Loading payment methods...</p>;

  const handlePreferred = async (id: number) => {
    setMessage("");
    await setPreferredPaymentMethod(id);
    setMessage("Preferred payment method updated.");
    load();
  };

  const handleDelete = async (id: number) => {
    setMessage("");
    await deletePaymentMethod(id);
    setMessage("Payment method removed.");
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Payment methods</h1>
        <Link to="/payment-methods/new" className="btn-primary">
          Add payment method
        </Link>
      </div>
      {message && <p className="message">{message}</p>}
      {methods.length === 0 ? (
        <p>
          No payment methods saved.{" "}
          <Link to="/payment-methods/new">Add your first card</Link>
        </p>
      ) : (
        <ul className="card-list">
          {methods.map((method) => (
            <li key={method.id} className="card-list-item">
              <div>
                <strong>
                  {method.label}
                  {method.is_preferred && <span className="badge">Preferred</span>}
                </strong>
                <p className="muted">
                  Card ending in {method.last_four} · Expires {method.expiry_month}/{method.expiry_year}
                </p>
              </div>
              <div className="card-list-actions">
                {!method.is_preferred && (
                  <button type="button" onClick={() => handlePreferred(method.id)}>
                    Set preferred
                  </button>
                )}
                <button type="button" className="btn-danger" onClick={() => handleDelete(method.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
