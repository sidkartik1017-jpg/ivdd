"""Authentication endpoints: sign up and sign in."""
import re

from flask import Blueprint, request, jsonify

from extensions import db
from models import User
from auth_utils import make_token

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@bp.post("/signup")
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()

    if not EMAIL_RE.match(email):
        return jsonify({"error": "Enter a valid email address."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(email=email, name=name or email.split("@")[0])
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"token": make_token(user), "user": user.to_dict()}), 201


@bp.post("/signin")
def signin():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not EMAIL_RE.match(email):
        return jsonify({"error": "Enter a valid email address."}), 400
    if not password:
        return jsonify({"error": "Password is required."}), 400

    user = User.query.filter_by(email=email).first()

    if user is None:
        # Convenience for demos: create the account on first sign-in.
        # Disable by setting AUTO_SIGNUP=0 in the environment.
        import os
        if os.getenv("AUTO_SIGNUP", "1") != "1":
            return jsonify({"error": "Incorrect email or password."}), 401
        user = User(email=email, name=email.split("@")[0])
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
    elif not user.check_password(password):
        return jsonify({"error": "Incorrect email or password."}), 401

    return jsonify({"token": make_token(user), "user": user.to_dict()})
