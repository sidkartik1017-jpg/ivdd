"""Prediction + history endpoints."""
from flask import Blueprint, request, jsonify, g, current_app

from extensions import db
from models import Prediction
from auth_utils import login_required

bp = Blueprint("predict", __name__, url_prefix="/api")


@bp.post("/predict")
@login_required
def predict():
    data = request.get_json(silent=True) or {}
    form = data.get("form") or {}
    has_mri = bool(data.get("hasMri"))

    if not (form.get("name") or "").strip():
        return jsonify({"error": "Please enter your dog's name."}), 400
    if not (form.get("breed") or "").strip():
        return jsonify({"error": "Please select a breed."}), 400
    if not form.get("ageMonths"):
        return jsonify({"error": "Please enter your dog's age."}), 400

    result = current_app.predictor.predict(form, has_mri=has_mri)

    entry = Prediction(
        user_id=g.current_user.id,
        dog_name=form.get("name", "").strip(),
        breed=form.get("breed") or "Unknown",
        prob=result["prob"],
        level=result["level"],
        snapshot=form,
        result=result,
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify({"result": result, "entry": entry.to_dict()})


@bp.get("/history")
@login_required
def history():
    rows = (
        Prediction.query.filter_by(user_id=g.current_user.id)
        .order_by(Prediction.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify({"history": [r.to_dict() for r in rows]})
