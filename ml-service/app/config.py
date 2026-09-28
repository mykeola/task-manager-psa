import os

def load_env(env_path="ml-service/.env"):
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env()

class Settings:
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    INTERNAL_SERVICE_TOKEN: str = os.getenv("INTERNAL_SERVICE_TOKEN", "psa_internal_ml_service_token_secure_2026")
    MODEL_PATH: str = os.getenv("MODEL_PATH", "ml-service/models/duration_model.joblib")
    PREPROCESSOR_PATH: str = os.getenv("PREPROCESSOR_PATH", "ml-service/models/preprocessor.joblib")
    MODEL_METADATA_PATH: str = os.getenv("MODEL_METADATA_PATH", "ml-service/models/model_metadata.json")

settings = Settings()
