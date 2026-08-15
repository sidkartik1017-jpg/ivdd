"""Database models: application users and their saved risk assessments."""
from datetime import datetime, timezone

from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False, default="")
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=_utcnow)

    predictions = db.relationship(
        "Prediction",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan",
        order_by="Prediction.created_at.desc()",
    )

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "email": self.email, "name": self.name}


class Prediction(db.Model):
    __tablename__ = "predictions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    dog_name = db.Column(db.String(120), nullable=False, default="")
    breed = db.Column(db.String(120), nullable=False, default="Unknown")

    prob = db.Column(db.Float, nullable=False)
    level = db.Column(db.String(20), nullable=False)  # Low / Moderate / High

    # Full form snapshot + full result, stored as JSON so the frontend can
    # reload a past assessment exactly as it was submitted.
    snapshot = db.Column(db.JSON, nullable=False, default=dict)
    result = db.Column(db.JSON, nullable=False, default=dict)

    created_at = db.Column(db.DateTime, default=_utcnow, index=True)

    def to_dict(self):
        return {
            "id": "h" + str(self.id),
            "name": self.dog_name,
            "breed": self.breed,
            "level": self.level,
            "prob": round(self.prob),
            "color": self.result.get("color") if self.result else None,
            "time": self.created_at.isoformat() if self.created_at else None,
            "snapshot": self.snapshot,
            "result": self.result,
        }
