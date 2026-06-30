import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getCart } from "../api/shop";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  itemCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [itemCount, setItemCount] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!token) {
      setItemCount(0);
      return;
    }
    try {
      const cart = await getCart();
      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      setItemCount(count);
    } catch {
      setItemCount(0);
    }
  }, [token]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ itemCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
