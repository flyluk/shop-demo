from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import PaymentMethod, User
from app.schemas import PaymentMethodCreate, PaymentMethodResponse

router = APIRouter(prefix="/api/payment-methods", tags=["payment-methods"])


def _clear_preferred(db: Session, user_id: int) -> None:
    db.query(PaymentMethod).filter(
        PaymentMethod.user_id == user_id, PaymentMethod.is_preferred.is_(True)
    ).update({PaymentMethod.is_preferred: False})


@router.get("", response_model=list[PaymentMethodResponse])
def list_payment_methods(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return (
        db.query(PaymentMethod)
        .filter(PaymentMethod.user_id == current_user.id)
        .order_by(PaymentMethod.is_preferred.desc(), PaymentMethod.id)
        .all()
    )


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED)
def create_payment_method(
    payload: PaymentMethodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    digits = "".join(ch for ch in payload.card_number if ch.isdigit())
    if len(digits) < 4:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid card number")

    is_preferred = payload.is_preferred
    if not db.query(PaymentMethod).filter(PaymentMethod.user_id == current_user.id).first():
        is_preferred = True
    if is_preferred:
        _clear_preferred(db, current_user.id)

    method = PaymentMethod(
        user_id=current_user.id,
        label=payload.label,
        type="card",
        last_four=digits[-4:],
        expiry_month=payload.expiry_month,
        expiry_year=payload.expiry_year,
        is_preferred=is_preferred,
    )
    db.add(method)
    db.commit()
    db.refresh(method)
    return method


@router.post("/{method_id}/preferred", response_model=PaymentMethodResponse)
def set_preferred_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    method = _get_user_method(db, current_user.id, method_id)
    _clear_preferred(db, current_user.id)
    method.is_preferred = True
    db.commit()
    db.refresh(method)
    return method


@router.delete("/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_method(
    method_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    method = _get_user_method(db, current_user.id, method_id)
    was_preferred = method.is_preferred
    db.delete(method)
    db.commit()

    if was_preferred:
        next_method = (
            db.query(PaymentMethod)
            .filter(PaymentMethod.user_id == current_user.id)
            .order_by(PaymentMethod.id)
            .first()
        )
        if next_method:
            next_method.is_preferred = True
            db.commit()


def _get_user_method(db: Session, user_id: int, method_id: int) -> PaymentMethod:
    method = (
        db.query(PaymentMethod)
        .filter(PaymentMethod.id == method_id, PaymentMethod.user_id == user_id)
        .first()
    )
    if not method:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")
    return method
