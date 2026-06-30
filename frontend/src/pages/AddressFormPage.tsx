import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { createAddress, getAddress, updateAddress } from "../api/shop";
import { useAuth } from "../components/AuthContext";
import type { AddressInput } from "../types";

const emptyForm: AddressInput = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
};

export default function AddressFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const { token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getAddress(Number(id))
      .then((address) =>
        setForm({
          label: address.label,
          line1: address.line1,
          line2: address.line2 ?? "",
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: address.country,
        }),
      )
      .catch(() => setError("Address not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <p>Loading...</p>;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const payload = {
      label: form.label,
      line1: form.line1,
      line2: form.line2?.trim() || undefined,
      city: form.city,
      state: form.state,
      postal_code: form.postal_code,
      country: form.country,
    };
    try {
      if (isNew) {
        await createAddress({ ...payload, is_preferred: form.is_preferred });
      } else {
        await updateAddress(Number(id), payload);
      }
      navigate("/addresses");
    } catch {
      setError("Could not save address.");
    }
  };

  const set = (field: keyof AddressInput, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="auth-card form-card">
      <h1>{isNew ? "Add address" : "Edit address"}</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Label
          <input value={form.label} onChange={(e) => set("label", e.target.value)} required />
        </label>
        <label>
          Address line 1
          <input value={form.line1} onChange={(e) => set("line1", e.target.value)} required />
        </label>
        <label>
          Address line 2
          <input value={form.line2} onChange={(e) => set("line2", e.target.value)} />
        </label>
        <label>
          City
          <input value={form.city} onChange={(e) => set("city", e.target.value)} required />
        </label>
        <label>
          State / Province
          <input value={form.state} onChange={(e) => set("state", e.target.value)} required />
        </label>
        <label>
          Postal code
          <input value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} required />
        </label>
        <label>
          Country
          <input value={form.country} onChange={(e) => set("country", e.target.value)} required />
        </label>
        {isNew && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={form.is_preferred ?? false}
              onChange={(e) => setForm((prev) => ({ ...prev, is_preferred: e.target.checked }))}
            />
            Set as preferred address
          </label>
        )}
        <div className="form-actions">
          <button type="submit">{isNew ? "Add address" : "Save changes"}</button>
          <Link to="/addresses">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
