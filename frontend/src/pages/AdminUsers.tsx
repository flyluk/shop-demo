import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createUser, deleteUser, listUsers } from "../api/shop";
import { useAuth } from "../components/AuthContext";
import type { User } from "../types";

export default function AdminUsers() {
  const { user, token, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const deletableUsers = users.filter((u) => u.id !== user?.id);
  const allSelected =
    deletableUsers.length > 0 && deletableUsers.every((u) => selectedIds.has(u.id));

  const loadUsers = () => {
    setLoading(true);
    listUsers()
      .then((data) => {
        setUsers(data);
        setSelectedIds(new Set());
      })
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token && user?.is_admin) {
      loadUsers();
    }
  }, [token, user?.is_admin]);

  if (authLoading) return <p>Loading...</p>;
  if (!token) return <Navigate to="/login" replace />;
  if (!user?.is_admin) return <Navigate to="/products" replace />;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await createUser(email, password, isAdmin);
      setEmail("");
      setPassword("");
      setIsAdmin(false);
      setMessage("User created.");
      loadUsers();
    } catch {
      setError("Failed to create user. Email may already be in use.");
    }
  };

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletableUsers.map((u) => u.id)));
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm("Delete this user? Their cart will also be removed.")) return;
    setError("");
    setMessage("");
    try {
      await deleteUser(userId);
      setMessage("User deleted.");
      loadUsers();
    } catch {
      setError("Failed to delete user.");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (!window.confirm(`Delete ${count} selected user${count > 1 ? "s" : ""}? Their carts will also be removed.`)) {
      return;
    }
    setError("");
    setMessage("");
    setDeleting(true);
    try {
      const results = await Promise.allSettled([...selectedIds].map((id) => deleteUser(id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        setError(`Failed to delete ${failed} of ${count} user${count > 1 ? "s" : ""}.`);
      } else {
        setMessage(`Deleted ${count} user${count > 1 ? "s" : ""}.`);
      }
      loadUsers();
    } catch {
      setError("Failed to delete selected users.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <h1>User Administration</h1>

      <section className="admin-section">
        <h2>Add user</h2>
        <form className="admin-form" onSubmit={handleCreate}>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
            Admin
          </label>
          <button type="submit">Add user</button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {message && <p className="message">{message}</p>}

      <section className="admin-section">
        <div className="admin-section-header">
          <h2>All users</h2>
          {selectedIds.size > 0 && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete selected (${selectedIds.size})`}
            </button>
          )}
        </div>
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th className="col-check">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    disabled={deletableUsers.length === 0}
                    aria-label="Select all users"
                  />
                </th>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="col-check">
                    {u.id === user.id ? (
                      <input type="checkbox" disabled checked={false} aria-label="Current user" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        aria-label={`Select ${u.email}`}
                      />
                    )}
                  </td>
                  <td>{u.id}</td>
                  <td>{u.email}</td>
                  <td>{u.is_admin ? "Admin" : "User"}</td>
                  <td>
                    {u.id === user.id ? (
                      <span className="muted">You</span>
                    ) : (
                      <button type="button" className="btn-danger" onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
