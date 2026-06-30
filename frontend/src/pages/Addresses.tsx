import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  deleteAddress,
  listAddresses,
  setPreferredAddress,
} from "../api/shop";
import { useAuth } from "../components/AuthContext";
import { formatAddress } from "../utils/format";
import type { Address } from "../types";

export default function Addresses() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = () =>
    listAddresses()
      .then(setAddresses)
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <p>Loading addresses...</p>;

  const handlePreferred = async (id: number) => {
    setMessage("");
    await setPreferredAddress(id);
    setMessage("Preferred address updated.");
    load();
  };

  const handleDelete = async (id: number) => {
    setMessage("");
    await deleteAddress(id);
    setMessage("Address removed.");
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Addresses</h1>
        <Link to="/addresses/new" className="btn-primary">
          Add address
        </Link>
      </div>
      {message && <p className="message">{message}</p>}
      {addresses.length === 0 ? (
        <p>
          No addresses saved. <Link to="/addresses/new">Add your first address</Link>
        </p>
      ) : (
        <ul className="card-list">
          {addresses.map((address) => (
            <li key={address.id} className="card-list-item">
              <div>
                <strong>
                  {address.label}
                  {address.is_preferred && <span className="badge">Preferred</span>}
                </strong>
                <p className="muted">{formatAddress(address)}</p>
              </div>
              <div className="card-list-actions">
                {!address.is_preferred && (
                  <button type="button" onClick={() => handlePreferred(address.id)}>
                    Set preferred
                  </button>
                )}
                <Link to={`/addresses/${address.id}/edit`}>Edit</Link>
                <button type="button" className="btn-danger" onClick={() => handleDelete(address.id)}>
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
