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


class AddressCreate(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(default="US", min_length=2, max_length=100)
    is_preferred: bool = False


class AddressUpdate(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    line1: str = Field(min_length=1, max_length=255)
    line2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    postal_code: str = Field(min_length=1, max_length=20)
    country: str = Field(min_length=2, max_length=100)


class AddressResponse(BaseModel):
    id: int
    label: str
    line1: str
    line2: str | None
    city: str
    state: str
    postal_code: str
    country: str
    is_preferred: bool

    class Config:
        from_attributes = True


class PaymentMethodCreate(BaseModel):
    label: str = Field(min_length=1, max_length=100)
    card_number: str = Field(min_length=4, max_length=19)
    expiry_month: int = Field(ge=1, le=12)
    expiry_year: int = Field(ge=2024, le=2099)
    is_preferred: bool = False


class PaymentMethodResponse(BaseModel):
    id: int
    label: str
    type: str
    last_four: str
    expiry_month: int
    expiry_year: int
    is_preferred: bool

    class Config:
        from_attributes = True


class CheckoutRequest(BaseModel):
    address_id: int
    payment_method_id: int


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float
    product: ProductResponse

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    total: float
    address: AddressResponse
    payment_method: PaymentMethodResponse
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True
