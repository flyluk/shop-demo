import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { createPaymentMethod } from "../api/shop";
import { useAuth } from "../components/AuthContext";
import type { PaymentMethodInput } from "../types";

export default function PaymentMethodNew() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<PaymentMethodInput>({
    label: "",
    card_number: "",
    expiry_month: 1,
    expiry_year: new Date().getFullYear(),
    is_preferred: false,
  });
  const [error, setError] = useState("");

  if (!token) return <Navigate to="/login" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await createPaymentMethod(form);
      navigate("/payment-methods");
    } catch {
      setError("Could not save payment method.");
    }
  };

  return (
    <div className="auth-card form-card">
      <h1>Add payment method</h1>
      <p className="muted">Card numbers are not stored — only the last four digits are saved.</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Label
          <input
            value={form.label}
            onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
            placeholder="Personal Visa"
            required
          />
        </label>
        <label>
          Card number
          <input
            value={form.card_number}
            onChange={(e) => setForm((prev) => ({ ...prev, card_number: e.target.value }))}
            inputMode="numeric"
            autoComplete="cc-number"
            required
          />
        </label>
        <div className="form-row">
          <label>
            Expiry month
            <input
              type="number"
              min={1}
              max={12}
              value={form.expiry_month}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, expiry_month: Number(e.target.value) }))
              }
              required
            />
          </label>
          <label>
            Expiry year
            <input
              type="number"
              min={2024}
              max={2099}
              value={form.expiry_year}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, expiry_year: Number(e.target.value) }))
              }
              required
            />
          </label>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.is_preferred ?? false}
            onChange={(e) => setForm((prev) => ({ ...prev, is_preferred: e.target.checked }))}
          />
          Set as preferred payment method
        </label>
        <div className="form-actions">
          <button type="submit">Add payment method</button>
          <Link to="/payment-methods">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
