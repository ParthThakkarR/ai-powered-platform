"""Black Box Tests - Comments, Labels, Search"""
import pytest


class TestComments:
    def test_create_comment(self, client, auth_headers, test_task):
        r = client.post(f"/api/v1/tasks/{test_task.id}/comments", headers=auth_headers, json={
            "content": "This is a test comment",
        })
        assert r.status_code == 200
        data = r.json()
        assert data["content"] == "This is a test comment"
        assert data["user_name"] == "Test User"

    def test_list_comments(self, client, auth_headers, test_task):
        # Create a comment first
        client.post(f"/api/v1/tasks/{test_task.id}/comments", headers=auth_headers, json={
            "content": "Comment 1",
        })
        r = client.get(f"/api/v1/tasks/{test_task.id}/comments", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_delete_own_comment(self, client, auth_headers, test_task):
        r = client.post(f"/api/v1/tasks/{test_task.id}/comments", headers=auth_headers, json={
            "content": "Delete me",
        })
        comment_id = r.json()["id"]
        r = client.delete(f"/api/v1/tasks/comments/{comment_id}", headers=auth_headers)
        assert r.status_code == 200

    def test_comment_on_nonexistent_task(self, client, auth_headers):
        r = client.post("/api/v1/tasks/99999/comments", headers=auth_headers, json={
            "content": "No task",
        })
        assert r.status_code == 404


class TestLabels:
    def test_create_label(self, client, auth_headers):
        r = client.post("/api/v1/labels/", headers=auth_headers, json={
            "name": "bug",
            "color": "#ef4444",
        })
        assert r.status_code == 200
        assert r.json()["name"] == "bug"

    def test_list_labels(self, client, auth_headers):
        client.post("/api/v1/labels/", headers=auth_headers, json={
            "name": "feature",
            "color": "#10b981",
        })
        r = client.get("/api/v1/labels/", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_add_label_to_task(self, client, auth_headers, test_task):
        label = client.post("/api/v1/labels/", headers=auth_headers, json={
            "name": "urgent",
            "color": "#f59e0b",
        }).json()
        r = client.post(f"/api/v1/labels/tasks/{test_task.id}/labels/{label['id']}", headers=auth_headers)
        assert r.status_code == 200

    def test_remove_label_from_task(self, client, auth_headers, test_task):
        label = client.post("/api/v1/labels/", headers=auth_headers, json={
            "name": "removable",
            "color": "#6366f1",
        }).json()
        client.post(f"/api/v1/labels/tasks/{test_task.id}/labels/{label['id']}", headers=auth_headers)
        r = client.delete(f"/api/v1/labels/tasks/{test_task.id}/labels/{label['id']}", headers=auth_headers)
        assert r.status_code == 200

    def test_duplicate_label_name(self, client, auth_headers):
        client.post("/api/v1/labels/", headers=auth_headers, json={"name": "dup", "color": "#000"})
        r = client.post("/api/v1/labels/", headers=auth_headers, json={"name": "dup", "color": "#000"})
        assert r.status_code == 400


class TestSearch:
    def test_search_found(self, client, auth_headers, test_task):
        r = client.get("/api/v1/search/?q=Test", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_search_not_found(self, client, auth_headers):
        r = client.get("/api/v1/search/?q=xyznonexistent", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] == 0

    def test_search_by_status(self, client, auth_headers, test_task):
        r = client.get("/api/v1/search/?status=TODO", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["total"] >= 1

    def test_search_empty_query(self, client, auth_headers):
        r = client.get("/api/v1/search/?q=", headers=auth_headers)
        assert r.status_code == 200
