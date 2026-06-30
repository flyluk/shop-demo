from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.database import SessionLocal, engine
from app.models import Base, Product, User
from app.routers import admin, auth, cart, products

DEFAULT_PRODUCTS = [
    {
        "name": "Wireless Mouse",
        "description": "Ergonomic wireless mouse with USB receiver",
        "price": 29.99,
        "image_url": "/images/mouse.svg",
        "stock": 20000,
    },
    {
        "name": "Mechanical Keyboard",
        "description": "RGB mechanical keyboard with Cherry MX switches",
        "price": 89.99,
        "image_url": "/images/keyboard.svg",
        "stock": 20000,
    },
    {
        "name": "USB-C Hub",
        "description": "7-in-1 USB-C hub with HDMI and SD card reader",
        "price": 49.99,
        "image_url": "/images/hub.svg",
        "stock": 20000,
    },
    {
        "name": "Monitor Stand",
        "description": "Adjustable aluminum monitor stand",
        "price": 39.99,
        "image_url": "/images/stand.svg",
        "stock": 20000,
    },
    {
        "name": "Webcam HD",
        "description": "1080p webcam with built-in microphone",
        "price": 59.99,
        "image_url": "/images/webcam.svg",
        "stock": 20000,
    },
    {
        "name": "Desk Lamp",
        "description": "LED desk lamp with adjustable brightness",
        "price": 34.99,
        "image_url": "/images/lamp.svg",
        "stock": 20000,
    },
    {
        "name": "Laptop Sleeve",
        "description": "13-inch neoprene laptop sleeve",
        "price": 24.99,
        "image_url": "/images/sleeve.svg",
        "stock": 20000,
    },
    {
        "name": "Bluetooth Speaker",
        "description": "Portable waterproof Bluetooth speaker",
        "price": 44.99,
        "image_url": "/images/speaker.svg",
        "stock": 20000,
    },
    {
        "name": "Phone Stand",
        "description": "Adjustable phone and tablet stand",
        "price": 14.99,
        "image_url": "/images/phone-stand.svg",
        "stock": 20000,
    },
    {
        "name": "Cable Organizer",
        "description": "Set of 10 reusable cable ties",
        "price": 9.99,
        "image_url": "/images/cables.svg",
        "stock": 20000,
    },
]


def migrate_schema():
    with engine.connect() as conn:
        conn.execute(
            text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE")
        )
        conn.execute(
            text("CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)")
        )
        conn.execute(
            text(
                "UPDATE products SET image_url = REPLACE(image_url, '.jpg', '.svg') "
                "WHERE image_url LIKE '%.jpg'"
            )
        )
        conn.commit()


def seed_products():
    db: Session = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            return
        db.add_all(Product(**item) for item in DEFAULT_PRODUCTS)
        db.commit()
    finally:
        db.close()


def seed_demo_user():
    db: Session = SessionLocal()
    try:
        demo = db.query(User).filter(User.email == "demo@shop.local").first()
        if not demo:
            db.add(
                User(
                    email="demo@shop.local",
                    password_hash=hash_password("demo1234"),
                    is_admin=True,
                )
            )
            db.commit()
        elif not demo.is_admin:
            demo.is_admin = True
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    migrate_schema()
    seed_products()
    seed_demo_user()
    yield


app = FastAPI(title="Shop Demo API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(products.router)
app.include_router(cart.router)


@app.get("/health")
def health():
    return {"status": "ok"}
