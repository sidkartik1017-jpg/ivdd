"""Create/upgrade database tables for the configured DATABASE_URL.

This app uses SQLAlchemy's `create_all` (no Alembic) — it creates any missing
tables and is safe to run repeatedly; it never drops or alters existing ones.

Usage:
    python migrate.py           # migrate the DB from .env / DATABASE_URL
    python migrate.py --reset    # DROP ALL tables first, then recreate (destructive!)
"""
import sys

from sqlalchemy import inspect

from app import create_app
from extensions import db
import models  # noqa: F401 - register models on the metadata


def main():
    reset = "--reset" in sys.argv
    app = create_app()
    with app.app_context():
        uri = app.config["SQLALCHEMY_DATABASE_URI"]
        # Mask credentials when echoing the target.
        shown = uri
        if "@" in uri and "//" in uri:
            head, tail = uri.split("//", 1)
            creds, host = tail.split("@", 1)
            shown = f"{head}//***@{host}"
        print(f"Target: {shown}")

        if reset:
            print("Dropping all tables (--reset)…")
            db.drop_all()

        print("Creating tables…")
        db.create_all()

        tables = inspect(db.engine).get_table_names()
        print("Tables now present:", tables)
        for t in ("users", "predictions"):
            if t in tables:
                n = db.session.execute(db.text(f"SELECT COUNT(*) FROM {t}")).scalar()
                print(f"  {t}: {n} rows")
        print("Migration complete.")


if __name__ == "__main__":
    main()
