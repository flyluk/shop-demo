import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { login } from "../api/shop";
import { useAuth } from "../components/AuthContext";

export default function Login() {
  const { token, setToken } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("demo@shop.local");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");

  if (token) return <Navigate to="/products" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const accessToken = await login(email, password);
      setToken(accessToken);
      navigate("/products");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="auth-card">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
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
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign in</button>
      </form>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
