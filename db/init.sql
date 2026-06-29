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
