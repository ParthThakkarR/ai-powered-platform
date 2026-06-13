"""Black Box Tests - Tasks CRUD + Validation"""
import pytest


class TestTasks:
    def test_list_tasks_by_project(self, client, auth_headers, test_task):
        r = client.get(f"/api/v1/tasks/project/{test_task.project_id}", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_get_task(self, client, auth_headers, test_task):
        r = client.get(f"/api/v1/tasks/{test_task.id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["title"] == "Test Task"

    def test_get_task_not_found(self, client, auth_headers):
        r = client.get("/api/v1/tasks/99999", headers=auth_headers)
        assert r.status_code == 404

    def test_create_task(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "New Task",
            "description": "Created via test",
            "priority": "HIGH",
            "project_id": test_project.id,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["title"] == "New Task"
        assert data["priority"] == "HIGH"

    def test_update_task_status(self, client, auth_headers, test_task):
        r = client.put(f"/api/v1/tasks/{test_task.id}", headers=auth_headers, json={
            "status": "IN_PROGRESS",
        })
        assert r.status_code == 200
        assert r.json()["status"] == "IN_PROGRESS"

    def test_update_task_priority(self, client, auth_headers, test_task):
        r = client.put(f"/api/v1/tasks/{test_task.id}", headers=auth_headers, json={
            "priority": "URGENT",
        })
        assert r.status_code == 200
        assert r.json()["priority"] == "URGENT"

    def test_delete_task(self, client, auth_headers, test_task):
        r = client.delete(f"/api/v1/tasks/{test_task.id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "deleted"

    def test_unauthenticated_create(self, client, test_project):
        r = client.post("/api/v1/tasks/", json={
            "title": "Should Fail",
            "project_id": test_project.id,
        })
        assert r.status_code == 401


class TestTaskValidation:
    def test_invalid_status(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "Bad Status",
            "status": "INVALID_STATUS",
            "project_id": test_project.id,
        })
        assert r.status_code == 422

    def test_invalid_priority(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "Bad Priority",
            "priority": "MEGA_URGENT",
            "project_id": test_project.id,
        })
        assert r.status_code == 422

    def test_empty_title(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "",
            "project_id": test_project.id,
        })
        assert r.status_code == 422

    def test_title_too_long(self, client, auth_headers, test_project):
        r = client.post("/api/v1/tasks/", headers=auth_headers, json={
            "title": "x" * 300,
            "project_id": test_project.id,
        })
        assert r.status_code == 422

    def test_valid_all_statuses(self, client, auth_headers, test_project):
        for status in ["TODO", "IN_PROGRESS", "REVIEW", "DONE"]:
            r = client.post("/api/v1/tasks/", headers=auth_headers, json={
                "title": f"Task {status}",
                "status": status,
                "project_id": test_project.id,
            })
            assert r.status_code == 200, f"Status {status} should be valid"

    def test_valid_all_priorities(self, client, auth_headers, test_project):
        for priority in ["LOW", "MEDIUM", "HIGH", "URGENT"]:
            r = client.post("/api/v1/tasks/", headers=auth_headers, json={
                "title": f"Task {priority}",
                "priority": priority,
                "project_id": test_project.id,
            })
            assert r.status_code == 200, f"Priority {priority} should be valid"
