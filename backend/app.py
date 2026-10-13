"""SpineGuard Flask backend — application factory and entrypoint."""
import logging

from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from predictor import Predictor

logging.basicConfig(level=logging.INFO)


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )

    db.init_app(app)

    # Load the ML model once at startup and hang it off the app.
    app.predictor = Predictor(app.config["MODEL_PATH"])

    # Register blueprints
    from routes_auth import bp as auth_bp
    from routes_predict import bp as predict_bp
    from routes_chat import bp as chat_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(chat_bp)

    # Import models so create_all sees them, then create tables. A transient
    # database outage here must not be fatal: under gunicorn this runs during
    # the master's import, so an exception kills the process and the platform
    # restarts it into the same failure. Log and boot instead -- /api/health
    # stays reachable (reporting db_ready) and the tables get created on the
    # next boot, while individual DB-backed requests surface their own errors.
    db_ready = True
    db_error = None
    with app.app_context():
        import models  # noqa: F401
        try:
            db.create_all()
        except Exception as exc:  # noqa: BLE001 - boot must not depend on the DB
            db_ready = False
            db_error = str(exc)
            logging.warning("db.create_all() failed at boot (%s); continuing.", exc)

        # Drop any connection create_all() left in the pool. Gunicorn runs with
        # --preload, so everything above happens in the master before forking;
        # a pooled socket inherited across fork would be shared by two
        # processes, which corrupts the protocol stream. Disposing here forces
        # each worker to open its own connections after the fork.
        db.engine.dispose()

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "model_mode": app.predictor.mode,
            "model_error": app.predictor.load_error,
            "groq_configured": bool(app.config["GROQ_API_KEY"]),
            "db_ready": db_ready,
            "db_error": db_error,
        })

    @app.get("/")
    def index():
        return jsonify({"service": "SpineGuard API", "health": "/api/health"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
