from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.tank_drawings import TankDrawing
import os
from typing import Optional
import logging
import jwt
try:
    from app.models.users_model import User
except Exception:
    User = None
JWT_SECRET = os.getenv("JWT_SECRET", "change_this_in_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

from app.utils.upload_utils import save_uploaded_file, delete_file_if_exists
from app.utils.s3_utils import to_cdn_url

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_ROOT = os.getenv("UPLOAD_ROOT", os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
DRAWING_TYPE = "drawings"

# Max file size: 2 MB
MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg"}

def validate_jpeg(upload_file: UploadFile, field_label: str):
    """Validate that file is JPEG and ≤ 2 MB."""
    content_type = getattr(upload_file, "content_type", "") or ""
    if content_type.lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"{field_label}: Only JPEG/JPG images are allowed (got '{content_type}')."
        )
    # Read content to check size
    contents = upload_file.file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"{field_label}: File size exceeds 2 MB limit ({len(contents) // 1024} KB uploaded)."
        )
    # Reset file pointer so save_uploaded_file can read it aimage2in
    upload_file.file.seek(0)


def get_emp_id_from_token(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db),
) -> int:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    auth = authorization.strip()
    token = auth
    if len(auth) >= 6 and auth[:6].lower() == "bearer":
        token_part = auth[6:]
        token = token_part.lstrip(" :\t")
    token = token.strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token missing")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if User is None:
        emp_id = payload.get("emp_id")
        if not emp_id:
            raise HTTPException(status_code=401, detail="emp_id missing in token")
        try:
            return int(emp_id)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid emp_id in token")

    user_obj = None
    try:
        if "emp_id" in payload and payload["emp_id"] is not None:
            try:
                user_obj = db.query(User).filter(User.emp_id == int(payload["emp_id"])).first()
            except Exception:
                user_obj = db.query(User).filter(User.emp_id == payload["emp_id"]).first()
        elif "email" in payload and payload["email"]:
            user_obj = db.query(User).filter(User.email == payload["email"]).first()
        elif "sub" in payload and payload["sub"]:
            sub = payload["sub"]
            try:
                user_obj = db.query(User).filter((User.email == sub) | (User.emp_id == int(sub))).first()
            except Exception:
                user_obj = db.query(User).filter((User.email == sub) | (User.emp_id == sub)).first()
    except Exception:
        user_obj = None

    if user_obj is not None and getattr(user_obj, "emp_id", None) is not None:
        try:
            return int(user_obj.emp_id)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid emp_id in user record")

    emp_id = payload.get("emp_id")
    if not emp_id:
        raise HTTPException(status_code=401, detail="emp_id missing in token/user")
    try:
        return int(emp_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid emp_id in token")


# --- HELPER: Serialize Object ---
def serialize_drawing_obj(d):
    def to_url(raw):
        if not raw:
            return ""
        return to_cdn_url(raw) if "://" not in raw else raw

    return {
        "id": d.id,
        "pid_reference": d.pid_reference,
        "pid_drawing": to_url(getattr(d, "pid_drawing", None)),
        "pid_drawing_name": getattr(d, "pid_drawing_name", None),
        "image2_drawing_file": to_url(getattr(d, "image2_drawing_file", None)),
        "image2_drawing_file_name": getattr(d, "image2_drawing_file_name", None),
        "img3": to_url(getattr(d, "img3", None)),
        "img3_name": getattr(d, "img3_name", None),
        "img4": to_url(getattr(d, "img4", None)),
        "img4_name": getattr(d, "img4_name", None),
        "img5": to_url(getattr(d, "img5", None)),
        "img5_name": getattr(d, "img5_name", None),
        "img6": to_url(getattr(d, "img6", None)),
        "img6_name": getattr(d, "img6_name", None),
        "status": 0 if getattr(d, 'status', 1) == 0 else 1,
        "remarks": getattr(d, 'remarks', "") or "",
        "created_by": d.created_by,
        "updated_by": getattr(d, 'updated_by', None),
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


from sqlalchemy.orm import joinedload

# --- CREATE (Upload) ---
@router.post("/")
@router.post("/{path_tank_id}")
def upload_drawing(
    path_tank_id: Optional[int] = None,
    pid_reference: Optional[str] = Form(None),
    pid_drawing_file: Optional[UploadFile] = File(None),
    image2_drawing_file: Optional[UploadFile] = File(None),
    img3_file: Optional[UploadFile] = File(None),
    img4_file: Optional[UploadFile] = File(None),
    img5_file: Optional[UploadFile] = File(None),
    img6_file: Optional[UploadFile] = File(None),
    remarks: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    emp_id = "System"
    if authorization:
        try:
            emp_id = get_emp_id_from_token(authorization)
        except Exception:
            pass

    tank_number = "GLOBAL"

    # Validate & save uploaded files
    img_data = {}
    try:
        if pid_drawing_file and pid_drawing_file.filename:
            validate_jpeg(pid_drawing_file, "P&ID Drawing")
            path = save_uploaded_file(
                upload_file=pid_drawing_file,
                tank_number=tank_number,
                image_type='drawing_pid',
                upload_root=UPLOAD_ROOT
            )
            img_data["pid_drawing"] = path
            img_data["pid_drawing_name"] = pid_drawing_file.filename
        else:
            img_data["pid_drawing"] = None
            img_data["pid_drawing_name"] = None

        if image2_drawing_file and image2_drawing_file.filename:
            validate_jpeg(image2_drawing_file, "image2 Drawing")
            path = save_uploaded_file(
                upload_file=image2_drawing_file,
                tank_number=tank_number,
                image_type='drawing_image2',
                upload_root=UPLOAD_ROOT
            )
            img_data["image2_drawing_file"] = path
            img_data["image2_drawing_file_name"] = image2_drawing_file.filename
        else:
            img_data["image2_drawing_file"] = None
            img_data["image2_drawing_file_name"] = None

        # Additional 4 images
        for idx in range(3, 7):
            f_key = f"img{idx}_file"
            # We access from local variables, but in FastAPI they are individual args.
            # So I'll just write them out for clarity or use locals().
            f_obj = locals().get(f_key)
            if f_obj and f_obj.filename:
                validate_jpeg(f_obj, f"Image {idx}")
                path = save_uploaded_file(
                    upload_file=f_obj,
                    tank_number=tank_number,
                    image_type=f'drawing_img{idx}',
                    upload_root=UPLOAD_ROOT
                )
                img_data[f"img{idx}"] = path
                img_data[f"img{idx}_name"] = f_obj.filename
            else:
                img_data[f"img{idx}"] = None
                img_data[f"img{idx}_name"] = None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    if pid_reference:
        ref = pid_reference.strip()
        dup = db.query(TankDrawing).filter(TankDrawing.pid_reference == ref).first()
        if dup:
            raise HTTPException(status_code=400, detail="This P&ID Reference already exists.")

    try:
        db_drawing = TankDrawing(
            pid_reference=pid_reference.strip() if pid_reference and pid_reference.strip() else None,
            pid_drawing=img_data.get("pid_drawing"),
            pid_drawing_name=img_data.get("pid_drawing_name"),
            image2_drawing_file=img_data.get("image2_drawing_file"),
            image2_drawing_file_name=img_data.get("image2_drawing_file_name"),
            img3=img_data.get("img3"),
            img3_name=img_data.get("img3_name"),
            img4=img_data.get("img4"),
            img4_name=img_data.get("img4_name"),
            img5=img_data.get("img5"),
            img5_name=img_data.get("img5_name"),
            img6=img_data.get("img6"),
            img6_name=img_data.get("img6_name"),
            remarks=remarks.strip() if remarks and remarks.strip() else None,
            status=1,
            created_by=emp_id,
            updated_by=emp_id
        )
        db.add(db_drawing)
        db.commit()
        db.refresh(db_drawing)
    except Exception as e:
        for key in ["pid_drawing", "image2_drawing_file", "img3", "img4", "img5", "img6"]:
            p = img_data.get(key)
            if p:
                delete_file_if_exists(UPLOAD_ROOT, p)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {"message": "Drawing uploaded successfully", "data": serialize_drawing_obj(db_drawing)}


# --- READ (List All) ---
@router.get("/")
def get_all_drawings(db: Session = Depends(get_db)):
    drawings = db.query(TankDrawing).all()
    return [serialize_drawing_obj(d) for d in drawings]


# --- READ (List by Tank) ---
@router.get("/all")
def get_drawings_list(db: Session = Depends(get_db)):
    drawings = db.query(TankDrawing).all()
    return [serialize_drawing_obj(d) for d in drawings]


# --- DELETE ---
@router.delete("/{drawing_id}")
def delete_drawing(drawing_id: int, db: Session = Depends(get_db)):
    drawing = db.query(TankDrawing).filter(TankDrawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    for field in ["pid_drawing", "image2_drawing_file", "img3", "img4", "img5", "img6"]:
        p = getattr(drawing, field, None)
        if p:
            delete_file_if_exists(UPLOAD_ROOT, p)

    db.delete(drawing)
    db.commit()
    return {"message": "Drawing deleted successfully"}


# --- UPDATE (PUT) ---
@router.put("/{drawing_id}")
def update_drawing(
    drawing_id: int,
    pid_reference: Optional[str] = Form(None),
    status: Optional[int] = Form(None),
    pid_drawing_file: Optional[UploadFile] = File(None),
    image2_drawing_file: Optional[UploadFile] = File(None),
    img3_file: Optional[UploadFile] = File(None),
    img4_file: Optional[UploadFile] = File(None),
    img5_file: Optional[UploadFile] = File(None),
    img6_file: Optional[UploadFile] = File(None),
    remarks: Optional[str] = Form(None),
    clear_pid_drawing: Optional[str] = Form(None),
    clear_image2_drawing_file: Optional[str] = Form(None),
    clear_img3: Optional[str] = Form(None),
    clear_img4: Optional[str] = Form(None),
    clear_img5: Optional[str] = Form(None),
    clear_img6: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None)
):
    drawing = db.query(TankDrawing).filter(TankDrawing.id == drawing_id).first()
    if not drawing:
        raise HTTPException(status_code=404, detail="Drawing not found")

    emp_id = "System"
    if authorization:
        try:
            emp_id = get_emp_id_from_token(authorization)
        except Exception:
            pass

    if pid_reference is not None:
        ref = pid_reference.strip()
        # Check if reference is taken by another drawing
        other = db.query(TankDrawing).filter(TankDrawing.pid_reference == ref, TankDrawing.id != drawing_id).first()
        if other:
            raise HTTPException(status_code=400, detail="This P&ID Reference already exists.")
        drawing.pid_reference = ref if ref else None

    if status is not None:
        drawing.status = 1 if int(status) == 1 else 0

    if remarks is not None:
        drawing.remarks = remarks.strip() if remarks and remarks.strip() else None

    tank_number = "GLOBAL"

    try:
        # --- Handle clear requests ---
        if clear_pid_drawing == '1':
            if drawing.pid_drawing:
                delete_file_if_exists(UPLOAD_ROOT, drawing.pid_drawing)
            drawing.pid_drawing = None
            drawing.pid_drawing_name = None

        if clear_image2_drawing_file == '1':
            if drawing.image2_drawing_file:
                delete_file_if_exists(UPLOAD_ROOT, drawing.image2_drawing_file)
            drawing.image2_drawing_file = None
            drawing.image2_drawing_file_name = None

        if pid_drawing_file and pid_drawing_file.filename:
            validate_jpeg(pid_drawing_file, "P&ID Drawing")
            old = drawing.pid_drawing
            if old:
                delete_file_if_exists(UPLOAD_ROOT, old)
            new_path = save_uploaded_file(
                upload_file=pid_drawing_file,
                tank_number=tank_number,
                image_type='drawing_pid',
                upload_root=UPLOAD_ROOT
            )
            drawing.pid_drawing = new_path
            drawing.pid_drawing_name = pid_drawing_file.filename

        if image2_drawing_file and image2_drawing_file.filename:
            validate_jpeg(image2_drawing_file, "image2 Drawing")
            old = drawing.image2_drawing_file
            if old:
                delete_file_if_exists(UPLOAD_ROOT, old)
            new_path = save_uploaded_file(
                upload_file=image2_drawing_file,
                tank_number=tank_number,
                image_type='drawing_image2',
                upload_root=UPLOAD_ROOT
            )
            drawing.image2_drawing_file = new_path
            drawing.image2_drawing_file_name = image2_drawing_file.filename

        # Additional 4 images
        for idx in range(3, 7):
            f_key = f"img{idx}_file"
            clear_key = f"clear_img{idx}"
            col_key = f"img{idx}"
            name_key = col_key + "_name"

            # Clear
            if locals().get(clear_key) == '1':
                old = getattr(drawing, col_key)
                if old:
                    delete_file_if_exists(UPLOAD_ROOT, old)
                setattr(drawing, col_key, None)
                setattr(drawing, name_key, None)

            # Upload
            f_obj = locals().get(f_key)
            if f_obj and f_obj.filename:
                validate_jpeg(f_obj, f"Image {idx}")
                old = getattr(drawing, col_key)
                if old:
                    delete_file_if_exists(UPLOAD_ROOT, old)
                new_path = save_uploaded_file(
                    upload_file=f_obj,
                    tank_number=tank_number,
                    image_type=f'drawing_img{idx}',
                    upload_root=UPLOAD_ROOT
                )
                setattr(drawing, col_key, new_path)
                setattr(drawing, name_key, f_obj.filename)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File update failed: {str(e)}")

    drawing.updated_by = emp_id
    db.commit()
    db.refresh(drawing)

    return {"message": "Drawing updated successfully", "data": serialize_drawing_obj(drawing)}
