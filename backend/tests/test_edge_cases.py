"""White Box Tests - Rate Limiting, Edge Cases, Data Integrity"""
import pytest
import time


class TestRateLimiting:
    def test_login_rate_limit(self, client):
        """Login should rate-limit after 10 requests/minute"""
        limited = False
        for i in range(15):
            r = client.post("/api/v1/auth/login", data={
                "username": f"rate{i}@test.com",
                "password": "wrong",
            })
            if r.status_code == 429:
                limited = True
                break
        assert limited, "Rate limiting should trigger on login"

    def test_register_rate_limit(self, client):
        """Register should rate-limit after 5 requests/minute"""
        limited = False
        for i in range(10):
            r = client.post("/api/v1/auth/register", json={
                "email": f"rate{i}@test.com",
                "password": "Pass123!",
            })
            if r.status_code == 429:
                limited = True
                break
        assert limited, "Rate limiting should trigger on register"


class TestEdgeCases:
    def test_empty_database_queries(self, client, auth_headers):
        """Queries on empty DB should return empty lists, not errors"""
        r = client.get("/api/v1/projects/", headers=auth_headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_concurrent_task_creation(self, client, auth_headers, test_project):
        """Creating multiple tasks should not cause conflicts"""
        tasks = []
        for i in range(5):
            r = client.post("/api/v1/tasks/", headers=auth_headers, json={
                "title": f"Concurrent Task {i}",
                "project_id": test_project.id,
            })
            assert r.status_code == 200
            tasks.append(r.json())
        assert len(set(t["id"] for t in tasks)) == 5  # All unique IDs

    def test_special_characters_in_task_title(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "Task with <script>alert('xss')</script> & special chars",
            "project_id": test_project.id,
        })
        assert r.status_code == 200
        # Title should be stored as-is (sanitization is frontend's job)
        assert "<script>" in r.json()["title"]

    def test_unicode_in_task(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "日本語テスト 🚀 اردو",
            "project_id": test_project.id,
        })
        assert r.status_code == 200
        assert "日本語テスト" in r.json()["title"]

    def test_very_long_description(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "Long desc",
            "description": "x" * 10000,
            "project_id": test_project.id,
        })
        assert r.status_code == 200

    def test_null_optional_fields(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "Minimal Task",
            "project_id": test_project.id,
            "description": None,
            "due_date": None,
            "assignee_id": None,
        })
        assert r.status_code == 200

    def test_past_due_date_allowed(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "Overdue Task",
            "project_id": test_project.id,
            "due_date": "2020-01-01T00:00:00Z",
        })
        assert r.status_code == 200

    def test_task_update_partial(self, client, auth_headers, test_task):
        """Updating only one field should not affect others"""
        original_desc = test_task.description
        r = client.put(f"/api/v1/tasks/{test_task.id}", headers=auth_headers, json={
            "priority": "URGENT",
        })
        assert r.status_code == 200
        assert r.json()["priority"] == "URGENT"
        assert r.json()["description"] == original_desc

    def test_delete_cascades(self, client, auth_headers, test_project, test_task):
        """Deleting project should delete its tasks"""
        client.delete(f"/api/v1/projects/{test_project.id}", headers=auth_headers)
        r = client.get(f"/api/v1/tasks/{test_task.id}", headers=auth_headers)
        assert r.status_code == 404

    def test_comment_ordering(self, client, auth_headers, test_task):
        """Comments should be returned newest first"""
        for i in range(3):
            client.post(f"/api/v1/tasks/{test_task.id}/comments", headers=auth_headers, json={
                "content": f"Comment {i}",
            })
        r = client.get(f"/api/v1/tasks/{test_task.id}/comments", headers=auth_headers)
        comments = r.json()
        assert len(comments) >= 3
        # Newest first
        assert comments[0]["content"] == "Comment 2"
