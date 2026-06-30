import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { getCart, removeCartItem, updateCartItem } from "../api/shop";
import { useAuth } from "../components/AuthContext";
import { useCart } from "../components/CartContext";
import type { Cart } from "../types";

export default function CartPage() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await getCart();
      setCart(data);
      await refreshCart();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const handleQuantity = async (itemId: number, quantity: number) => {
    await updateCartItem(itemId, quantity);
    await refresh();
  };

  const handleRemove = async (itemId: number) => {
    await removeCartItem(itemId);
    await refresh();
  };

  if (loading) return <p>Loading cart...</p>;

  return (
    <div>
      <h1>Shopping Cart</h1>
      {!cart || cart.items.length === 0 ? (
        <p>
          Your cart is empty. <Link to="/products">Browse products</Link>
        </p>
      ) : (
        <>
          <ul className="cart-list">
            {cart.items.map((item) => (
              <li key={item.id} className="cart-item">
                {item.product.image_url && (
                  <img
                    className="cart-item-image"
                    src={item.product.image_url}
                    alt={item.product.name}
                  />
                )}
                <div>
                  <strong>{item.product.name}</strong>
                  <p>${item.product.price.toFixed(2)} each</p>
                </div>
                <div className="cart-actions">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleQuantity(item.id, Number(e.target.value))}
                  />
                  <button type="button" onClick={() => handleRemove(item.id)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="cart-total">Total: ${cart.total.toFixed(2)}</p>
          <div className="cart-footer">
            <Link to="/checkout" className="btn-primary">
              Proceed to checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
