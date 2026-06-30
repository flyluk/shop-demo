from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Address, User
from app.schemas import AddressCreate, AddressResponse, AddressUpdate

router = APIRouter(prefix="/api/addresses", tags=["addresses"])


def _clear_preferred(db: Session, user_id: int) -> None:
    db.query(Address).filter(Address.user_id == user_id, Address.is_preferred.is_(True)).update(
        {Address.is_preferred: False}
    )


@router.get("", response_model=list[AddressResponse])
def list_addresses(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(Address)
        .filter(Address.user_id == current_user.id)
        .order_by(Address.is_preferred.desc(), Address.id)
        .all()
    )


@router.post("", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_preferred = payload.is_preferred
    if not db.query(Address).filter(Address.user_id == current_user.id).first():
        is_preferred = True
    if is_preferred:
        _clear_preferred(db, current_user.id)

    address = Address(user_id=current_user.id, **payload.model_dump())
    address.is_preferred = is_preferred
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.get("/{address_id}", response_model=AddressResponse)
def get_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = _get_user_address(db, current_user.id, address_id)
    return address


@router.put("/{address_id}", response_model=AddressResponse)
def update_address(
    address_id: int,
    payload: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = _get_user_address(db, current_user.id, address_id)
    for key, value in payload.model_dump().items():
        setattr(address, key, value)
    db.commit()
    db.refresh(address)
    return address


@router.post("/{address_id}/preferred", response_model=AddressResponse)
def set_preferred_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = _get_user_address(db, current_user.id, address_id)
    _clear_preferred(db, current_user.id)
    address.is_preferred = True
    db.commit()
    db.refresh(address)
    return address


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = _get_user_address(db, current_user.id, address_id)
    was_preferred = address.is_preferred
    db.delete(address)
    db.commit()

    if was_preferred:
        next_address = (
            db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.id).first()
        )
        if next_address:
            next_address.is_preferred = True
            db.commit()


def _get_user_address(db: Session, user_id: int, address_id: int) -> Address:
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user_id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address
