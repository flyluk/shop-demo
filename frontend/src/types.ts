export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export interface User {
  id: number;
  email: string;
  is_admin: boolean;
}

export interface Address {
  id: number;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_preferred: boolean;
}

export interface AddressInput {
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_preferred?: boolean;
}

export interface PaymentMethod {
  id: number;
  label: string;
  type: string;
  last_four: string;
  expiry_month: number;
  expiry_year: number;
  is_preferred: boolean;
}

export interface PaymentMethodInput {
  label: string;
  card_number: string;
  expiry_month: number;
  expiry_year: number;
  is_preferred?: boolean;
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: number;
  total: number;
  address: Address;
  payment_method: PaymentMethod;
  items: OrderItem[];
}
