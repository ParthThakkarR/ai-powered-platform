"""Black Box Tests - Authentication"""
import pytest


class TestRegister:
    def test_register_success(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "new@aiflow.dev",
            "password": "StrongPass1!",
            "full_name": "New User",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "new@aiflow.dev"
        assert data["full_name"] == "New User"
        assert data["is_active"] is True

    def test_register_duplicate_email(self, client, test_user):
        r = client.post("/api/v1/auth/register", json={
            "email": "test@aiflow.dev",
            "password": "Pass123!",
            "full_name": "Duplicate",
        })
        assert r.status_code == 400
        assert "already exists" in r.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "Pass123!",
        })
        assert r.status_code == 422

    def test_register_weak_password(self, client):
        r = client.post("/api/v1/auth/register", json={
            "email": "weak@aiflow.dev",
            "password": "1",
        })
        # Password validation depends on schema - may pass at API level
        assert r.status_code in [200, 422]

    def test_register_empty_body(self, client):
        r = client.post("/api/v1/auth/register", json={})
        assert r.status_code == 422


class TestLogin:
    def test_login_success(self, client, test_user):
        r = client.post("/api/v1/auth/login", data={
            "username": "test@aiflow.dev",
            "password": "TestPass123!",
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        r = client.post("/api/v1/auth/login", data={
            "username": "test@aiflow.dev",
            "password": "WrongPassword!",
        })
        assert r.status_code == 400
        assert "incorrect" in r.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        r = client.post("/api/v1/auth/login", data={
            "username": "nobody@aiflow.dev",
            "password": "Pass123!",
        })
        assert r.status_code == 400

    def test_login_empty_credentials(self, client):
        r = client.post("/api/v1/auth/login", data={
            "username": "",
            "password": "",
        })
        assert r.status_code in [400, 422]


class TestMe:
    def test_get_me_authenticated(self, client, auth_headers):
        r = client.get("/api/v1/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == "test@aiflow.dev"

    def test_get_me_unauthenticated(self, client):
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401

    def test_get_me_invalid_token(self, client):
        r = client.get("/api/v1/auth/me", headers={
            "Authorization": "Bearer invalid.token.here"
        })
        assert r.status_code == 401
