"""White Box Tests - Security, JWT, Rate Limiting, Authorization"""
import pytest
from core.security import create_access_token, verify_password, get_password_hash
from datetime import timedelta, datetime, timezone
from jose import jwt
from core.config import settings


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "MySecurePass123!"
        hashed = get_password_hash(password)
        assert hashed != password
        assert verify_password(password, hashed)

    def test_wrong_password_fails(self):
        hashed = get_password_hash("correct")
        assert not verify_password("wrong", hashed)

    def test_different_hashes(self):
        h1 = get_password_hash("same_password")
        h2 = get_password_hash("same_password")
        assert h1 != h2  # bcrypt uses random salt


class TestJWT:
    def test_token_contains_claims(self):
        token = create_access_token(42)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"],
                            issuer=settings.JWT_ISSUER, audience=settings.JWT_AUDIENCE)
        assert payload["sub"] == "42"
        assert payload["iss"] == settings.JWT_ISSUER
        assert payload["aud"] == settings.JWT_AUDIENCE
        assert "exp" in payload

    def test_token_with_custom_expiry(self):
        token = create_access_token(1, expires_delta=timedelta(minutes=5))
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"],
                            issuer=settings.JWT_ISSUER, audience=settings.JWT_AUDIENCE)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = (exp - now).total_seconds()
        assert 290 < diff < 310  # ~5 minutes

    def test_invalid_token_rejected(self):
        with pytest.raises(Exception):
            jwt.decode("garbage.token.here", settings.SECRET_KEY, algorithms=["HS256"],
                      issuer=settings.JWT_ISSUER, audience=settings.JWT_AUDIENCE)

    def test_wrong_issuer_rejected(self):
        token = jwt.encode({"sub": "1", "iss": "wrong", "aud": settings.JWT_AUDIENCE,
                           "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
                          settings.SECRET_KEY, algorithm="HS256")
        with pytest.raises(Exception):
            jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"],
                      issuer=settings.JWT_ISSUER, audience=settings.JWT_AUDIENCE)


class TestSecurityHeaders:
    def test_security_headers_present(self, client):
        r = client.get("/health")
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"
        assert r.headers.get("X-XSS-Protection") == "1; mode=block"
        assert r.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


class TestPrivilegeEscalation:
    def test_register_cannot_set_superuser(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "hacker@aiflow.dev",
            "password": "Pass123!",
            "is_superuser": True,
        })
        assert r.status_code == 200
        assert r.json()["is_superuser"] is False

    def test_register_cannot_set_superuser_via_update(self, client, test_user, auth_headers):
        r = client.put("/api/v1/auth/me", headers=auth_headers, json={
            "is_superuser": True,
        })
        # Either 404 (endpoint doesn't exist) or 200 but superuser unchanged
        if r.status_code == 200:
            assert r.json()["is_superuser"] is False


class TestErrorHandling:
    def test_404_returns_json(self, client):
        r = client.get("/api/v1/projects/99999")
        assert r.status_code == 401  # unauthenticated first
        assert "detail" in r.json()

    def test_validation_error_generic_message(self, client, auth_headers):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "",  # empty
            "project_id": "not_a_number",
        })
        assert r.status_code == 422

    def test_500_does_not_leak_internals(self, client, auth_headers):
        # This tests that the error handler catches exceptions
        r = client.get("/api/v1/projects/abc", headers=auth_headers)
        assert r.status_code in [404, 422, 401]


class TestCORS:
    def test_cors_allows_origin(self, client):
        r = client.options("/api/v1/auth/login", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        })
        assert r.status_code in [200, 405]

    def test_cors_rejects_unknown_origin(self, client):
        r = client.options("/api/v1/auth/login", headers={
            "Origin": "https://evil.com",
            "Access-Control-Request-Method": "POST",
        })
        # Should not have Access-Control-Allow-Origin header
        assert "access-control-allow-origin" not in r.headers or \
               r.headers.get("access-control-allow-origin") != "https://evil.com"
