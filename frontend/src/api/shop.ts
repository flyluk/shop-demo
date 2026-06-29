import api from "./client";
import type { Cart, Product, User } from "../types";

export async function login(email: string, password: string): Promise<string> {
  const { data } = await api.post<{ access_token: string }>("/auth/login", { email, password });
  return data.access_token;
}

export async function register(email: string, password: string): Promise<User> {
  const { data } = await api.post<User>("/auth/register", { email, password });
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/products");
  return data;
}

export async function getCart(): Promise<Cart> {
  const { data } = await api.get<Cart>("/cart");
  return data;
}

export async function addToCart(productId: number, quantity = 1): Promise<void> {
  await api.post("/cart/items", { product_id: productId, quantity });
}

export async function updateCartItem(itemId: number, quantity: number): Promise<void> {
  await api.patch(`/cart/items/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: number): Promise<void> {
  await api.delete(`/cart/items/${itemId}`);
}

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/admin/users");
  return data;
}

export async function createUser(
  email: string,
  password: string,
  isAdmin = false,
): Promise<User> {
  const { data } = await api.post<User>("/admin/users", {
    email,
    password,
    is_admin: isAdmin,
  });
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/admin/users/${userId}`);
}
