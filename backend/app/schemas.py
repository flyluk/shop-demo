import re
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_email(value: str) -> str:
    email = value.strip().lower()
    if not EMAIL_PATTERN.match(email):
        raise ValueError("Invalid email address")
    return email


Email = Annotated[str, BeforeValidator(normalize_email)]


class UserRegister(BaseModel):
    email: Email
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: Email
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: Email
    is_admin: bool = False

    class Config:
        from_attributes = True


class AdminUserCreate(BaseModel):
    email: Email
    password: str = Field(min_length=6)
    is_admin: bool = False


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: float
    image_url: str | None
    stock: int

    class Config:
        from_attributes = True


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: ProductResponse

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total: float
