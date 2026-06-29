import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 1,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://api.shop-demo.svc.cluster.local:8000";

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: "demo@shop.local", password: "demo1234" }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(loginRes, { "login ok": (r) => r.status === 200 });

  const token = loginRes.json("access_token");
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const productsRes = http.get(`${BASE_URL}/api/products`, authHeaders);
  check(productsRes, { "products ok": (r) => r.status === 200 });

  const products = productsRes.json();
  if (products && products.length > 0) {
    const product = products[0];
    const addRes = http.post(
      `${BASE_URL}/api/cart/items`,
      JSON.stringify({ product_id: product.id, quantity: 1 }),
      authHeaders
    );
    check(addRes, { "add to cart ok": (r) => r.status === 200 || r.status === 201 });
  }

  const cartRes = http.get(`${BASE_URL}/api/cart`, authHeaders);
  check(cartRes, { "cart ok": (r) => r.status === 200 });

  sleep(1);
}
