from fastapi import Header, HTTPException, status
from app.config import settings

async def verify_internal_token(x_internal_token: str = Header(None, alias="X-Internal-Token")):
    """
    Validates internal service-to-service communication token.
    Blocks unauthorized direct requests to the ML microservice.
    """
    if not x_internal_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Missing X-Internal-Token header"
        )
    if x_internal_token != settings.INTERNAL_SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid internal service token"
        )
    return True
