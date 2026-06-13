"""Black Box Tests - Projects CRUD"""
import pytest


class TestProjects:
    def test_list_projects(self, client, auth_headers, test_project):
        r = client.get("/api/v1/projects/", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert data[0]["name"] == "Test Project"

    def test_get_project(self, client, auth_headers, test_project):
        r = client.get(f"/api/v1/projects/{test_project.id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "Test Project"

    def test_get_project_not_found(self, client, auth_headers):
        r = client.get("/api/v1/projects/99999", headers=auth_headers)
        assert r.status_code == 404

    def test_create_project(self, client, auth_headers, test_org):
        r = client.post("/api/v1/projects/", headers=auth_headers, json={
            "name": "New Project",
            "description": "Created via test",
            "organization_id": test_org.id,
        })
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == "New Project"
        assert data["id"] is not None

    def test_update_project(self, client, auth_headers, test_project):
        r = client.put(f"/api/v1/projects/{test_project.id}", headers=auth_headers, json={
            "name": "Updated Project",
        })
        assert r.status_code == 200
        assert r.json()["name"] == "Updated Project"

    def test_delete_project(self, client, auth_headers, test_project):
        r = client.delete(f"/api/v1/projects/{test_project.id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "deleted"
        # Verify deleted
        r = client.get(f"/api/v1/projects/{test_project.id}", headers=auth_headers)
        assert r.status_code == 404

    def test_delete_project_not_found(self, client, auth_headers):
        r = client.delete("/api/v1/projects/99999", headers=auth_headers)
        assert r.status_code == 404

    def test_unauthenticated_access(self, client, test_project):
        r = client.get("/api/v1/projects/")
        assert r.status_code == 401
