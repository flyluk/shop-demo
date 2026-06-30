import api from "./client";
import type {
  Address,
  AddressInput,
  Cart,
  Order,
  PaymentMethod,
  PaymentMethodInput,
  Product,
  User,
} from "../types";

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

export async function listAddresses(): Promise<Address[]> {
  const { data } = await api.get<Address[]>("/addresses");
  return data;
}

export async function getAddress(addressId: number): Promise<Address> {
  const { data } = await api.get<Address>(`/addresses/${addressId}`);
  return data;
}

export async function createAddress(payload: AddressInput): Promise<Address> {
  const { data } = await api.post<Address>("/addresses", payload);
  return data;
}

export async function updateAddress(addressId: number, payload: AddressInput): Promise<Address> {
  const { data } = await api.put<Address>(`/addresses/${addressId}`, payload);
  return data;
}

export async function setPreferredAddress(addressId: number): Promise<Address> {
  const { data } = await api.post<Address>(`/addresses/${addressId}/preferred`);
  return data;
}

export async function deleteAddress(addressId: number): Promise<void> {
  await api.delete(`/addresses/${addressId}`);
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const { data } = await api.get<PaymentMethod[]>("/payment-methods");
  return data;
}

export async function createPaymentMethod(payload: PaymentMethodInput): Promise<PaymentMethod> {
  const { data } = await api.post<PaymentMethod>("/payment-methods", payload);
  return data;
}

export async function setPreferredPaymentMethod(methodId: number): Promise<PaymentMethod> {
  const { data } = await api.post<PaymentMethod>(`/payment-methods/${methodId}/preferred`);
  return data;
}

export async function deletePaymentMethod(methodId: number): Promise<void> {
  await api.delete(`/payment-methods/${methodId}`);
}

export async function checkout(addressId: number, paymentMethodId: number): Promise<Order> {
  const { data } = await api.post<Order>("/checkout", {
    address_id: addressId,
    payment_method_id: paymentMethodId,
  });
  return data;
}
