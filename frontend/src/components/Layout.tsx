import { Link, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import CartIcon from "./CartIcon";
import { useCart } from "./CartContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();

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
              <Link to="/addresses">Addresses</Link>
              <Link to="/payment-methods">Payments</Link>
              <Link to="/cart" className="cart-link" aria-label={`Cart (${itemCount} items)`}>
                <CartIcon />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
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
