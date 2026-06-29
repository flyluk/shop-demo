import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://api.shop-demo.svc.cluster.local:8000";

export const options = {
  stages: [
    { duration: "1m", target: 10 },
    { duration: "2m", target: 100 },
    { duration: "2m", target: 50 },
    { duration: "1m", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export function setup() {
  const productsRes = http.get(`${BASE_URL}/api/products`);
  const productIds =
    productsRes.status === 200 ? productsRes.json().map((p) => p.id) : [1, 2, 3, 4, 5];

  const users = [];
  for (let i = 0; i < 50; i++) {
    const email = `loadtest-${i}@example.com`;
    const password = "testpass123";
    const registerRes = http.post(
      `${BASE_URL}/api/auth/register`,
      JSON.stringify({ email, password }),
      { headers: { "Content-Type": "application/json" } }
    );
    if (registerRes.status !== 201 && registerRes.status !== 409) {
      console.warn(`Failed to register ${email}: ${registerRes.status}`);
    }
    users.push({ email, password });
  }
  return { users, productIds };
}

export default function (data) {
  const user = data.users[(__VU - 1) % data.users.length];
  const productIds = data.productIds;

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: user.email, password: user.password }),
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

  const productId = productIds[Math.floor(Math.random() * productIds.length)] || 1;
  const addRes = http.post(
    `${BASE_URL}/api/cart/items`,
    JSON.stringify({ product_id: productId, quantity: 1 }),
    authHeaders
  );
  check(addRes, { "add to cart ok": (r) => r.status === 200 || r.status === 201 });

  const cartRes = http.get(`${BASE_URL}/api/cart`, authHeaders);
  check(cartRes, { "cart ok": (r) => r.status === 200 });

  sleep(Math.random() * 2 + 0.5);
}
