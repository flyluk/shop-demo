from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import Address, CartItem, Order, OrderItem, PaymentMethod, User
from app.schemas import CheckoutRequest, OrderResponse

router = APIRouter(prefix="/api/checkout", tags=["checkout"])


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = (
        db.query(Address)
        .filter(Address.id == payload.address_id, Address.user_id == current_user.id)
        .first()
    )
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    payment_method = (
        db.query(PaymentMethod)
        .filter(PaymentMethod.id == payload.payment_method_id, PaymentMethod.user_id == current_user.id)
        .first()
    )
    if not payment_method:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")

    cart_items = (
        db.query(CartItem)
        .options(joinedload(CartItem.product))
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    total = sum(float(item.product.price) * item.quantity for item in cart_items)

    order = Order(
        user_id=current_user.id,
        address_id=address.id,
        payment_method_id=payment_method.id,
        total=total,
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.product.price,
            )
        )
        db.delete(item)

    db.commit()

    order = (
        db.query(Order)
        .options(
            joinedload(Order.address),
            joinedload(Order.payment_method),
            joinedload(Order.items).joinedload(OrderItem.product),
        )
        .filter(Order.id == order.id)
        .first()
    )
    return order
