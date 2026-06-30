CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url VARCHAR(512),
    stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    UNIQUE (user_id, product_id)
);

INSERT INTO products (name, description, price, image_url, stock)
SELECT v.name, v.description, v.price, v.image_url, v.stock
FROM (VALUES
    ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, '/images/mouse.jpg', 20000),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX switches', 89.99, '/images/keyboard.jpg', 20000),
    ('USB-C Hub', '7-in-1 USB-C hub with HDMI and SD card reader', 49.99, '/images/hub.jpg', 20000),
    ('Monitor Stand', 'Adjustable aluminum monitor stand', 39.99, '/images/stand.jpg', 20000),
    ('Webcam HD', '1080p webcam with built-in microphone', 59.99, '/images/webcam.jpg', 20000),
    ('Desk Lamp', 'LED desk lamp with adjustable brightness', 34.99, '/images/lamp.jpg', 20000),
    ('Laptop Sleeve', '13-inch neoprene laptop sleeve', 24.99, '/images/sleeve.jpg', 20000),
    ('Bluetooth Speaker', 'Portable waterproof Bluetooth speaker', 44.99, '/images/speaker.jpg', 20000),
    ('Phone Stand', 'Adjustable phone and tablet stand', 14.99, '/images/phone-stand.jpg', 20000),
    ('Cable Organizer', 'Set of 10 reusable cable ties', 9.99, '/images/cables.jpg', 20000)
) AS v(name, description, price, image_url, stock)
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);

-- Demo user password is demo1234 (bcrypt hash generated at app startup if missing)
-- Placeholder hash; app register endpoint creates users with proper bcrypt hashes

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

CREATE TABLE IF NOT EXISTS addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    line1 VARCHAR(255) NOT NULL,
    line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'card',
    last_four VARCHAR(4) NOT NULL,
    expiry_month INTEGER NOT NULL,
    expiry_year INTEGER NOT NULL,
    is_preferred BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id INTEGER NOT NULL REFERENCES addresses(id),
    payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
