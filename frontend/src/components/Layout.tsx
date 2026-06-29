import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="header">
        <Link to="/" className="logo">
          Shop Demo
        </Link>
        <nav>
          {user ? (
            <>
              <Link to="/products">Products</Link>
              <Link to="/cart">Cart</Link>
              {user.is_admin && <Link to="/admin/users">Users</Link>}
              <span className="user">{user.email}</span>
              <button type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
