import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { addToCart, getProducts } from "../api/shop";
import { useAuth } from "../components/AuthContext";
import { useCart } from "../components/CartContext";
import type { Product } from "../types";

export default function Products() {
  const { token } = useAuth();
  const { refreshCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (!token) return <Navigate to="/login" replace />;

  const handleAdd = async (productId: number) => {
    setMessage("");
    try {
      await addToCart(productId);
      await refreshCart();
      setMessage("Added to cart!");
    } catch {
      setMessage("Could not add to cart");
    }
  };

  if (loading) return <p>Loading products...</p>;

  return (
    <div>
      <h1>Products</h1>
      {message && <p className="message">{message}</p>}
      <div className="product-grid">
        {products.map((product) => (
          <article key={product.id} className="product-card">
            {product.image_url && (
              <img
                className="product-image"
                src={product.image_url}
                alt={product.name}
                loading="lazy"
              />
            )}
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p className="price">${product.price.toFixed(2)}</p>
            <p className="stock">In stock</p>
            <button type="button" onClick={() => handleAdd(product.id)}>
              Add to cart
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
