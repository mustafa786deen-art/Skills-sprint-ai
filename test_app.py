"""
SkillSprint AI - Unit and Integration Test Suite
Tests for storage backend, Flask API endpoints, and ground-truth verification engine.
"""

import os
import json
import pytest
import storage
import setup
from app import app


@pytest.fixture(autouse=True)
def clean_storage():
    """Ensure a clean database state before each test run."""
    storage.clear_storage()
    yield
    storage.clear_storage()


@pytest.fixture
def client():
    """Flask test client fixture."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ==========================================
# 1. STORAGE BACKEND TESTS
# ==========================================

def test_storage_add_and_retrieve():
    storage.add_chunk(
        doc_id="SOP-07",
        text="Sales onboarding SOP guidelines.",
        page_number=1,
        section="Page 1",
        heading="Sales SOP",
        filename="sales_sop.txt",
        file_format="txt"
    )
    assert storage.count_chunks() == 1
    assert "SOP-07" in storage.get_all_doc_ids()

    chunks = storage.get_all_chunks()
    assert len(chunks) == 1
    assert chunks[0]["doc_id"] == "SOP-07"
    assert chunks[0]["text"] == "Sales onboarding SOP guidelines."


def test_storage_search_keyword():
    storage.add_chunk(doc_id="POL-01", text="Customer support policy details.")
    storage.add_chunk(doc_id="SEC-03", text="Software security architecture.")

    support_results = storage.find_chunks("support")
    assert len(support_results) == 1
    assert support_results[0]["doc_id"] == "POL-01"

    sec_results = storage.find_chunks("security")
    assert len(sec_results) == 1
    assert sec_results[0]["doc_id"] == "SEC-03"


def test_storage_clear():
    storage.add_chunk(doc_id="DOC-1", text="Sample text")
    assert storage.count_chunks() == 1
    storage.clear_storage()
    assert storage.count_chunks() == 0
    assert len(storage.get_all_doc_ids()) == 0


# ==========================================
# 2. GROUND-TRUTH VERIFICATION ENGINE TESTS
# ==========================================

def test_genai_accuracy_verified():
    storage.add_chunk(doc_id="SOP-07", text="Sales onboarding procedures.")

    sample_ai_json = {
        "role": "Sales Executive",
        "employee": "John Doe",
        "modules": [
            {
                "req_id": "R001",
                "module_title": "Sales Process SOP",
                "mandatory": True,
                "source_doc_id": "SOP-07",
                "source_section": "Page 1"
            }
        ]
    }

    results = setup.genai_accuracy("Sales Executive", sample_ai_json)
    assert results["score"] == 100.0
    assert results["fake_docs_count"] == 0
    assert results["status"] == "PASSED ALL CHECKS"


def test_genai_accuracy_hallucinated_doc():
    storage.add_chunk(doc_id="SOP-07", text="Sales onboarding procedures.")

    sample_ai_json = {
        "role": "Sales Executive",
        "employee": "John Doe",
        "modules": [
            {
                "req_id": "R001",
                "module_title": "Sales Process SOP",
                "mandatory": True,
                "source_doc_id": "FAKE-DOC-99",
                "source_section": "Page 1"
            }
        ]
    }

    results = setup.genai_accuracy("Sales Executive", sample_ai_json)
    assert results["score"] == 100.0
    assert results["fake_docs_count"] == 1
    assert results["status"] == "NEEDS HUMAN REVIEW"


# ==========================================
# 3. FLASK API ENDPOINT TESTS
# ==========================================

def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "online"
    assert "endpoints" in data


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"


def test_auth_login_endpoint(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@skillsprint.com",
        "roleMode": "admin"
    })
    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["user"]["role"] == "admin"


def test_auth_me_endpoint(client):
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer mock-jwt-token-admin"})
    assert response.status_code == 200
    data = response.get_json()
    assert "user" in data
    assert data["user"]["role"] == "admin"


def test_manage_documents_get_and_delete(client):
    storage.add_chunk(doc_id="POL-01", text="Customer policy text")

    get_res = client.get("/api/documents")
    assert get_res.status_code == 200
    data = get_res.get_json()
    assert data["total_chunks"] == 1
    assert "POL-01" in data["doc_ids"]

    del_res = client.delete("/api/documents")
    assert del_res.status_code == 200
    assert storage.count_chunks() == 0


def test_upload_txt_file(client, tmp_path):
    txt_file = tmp_path / "sop-07.txt"
    txt_file.write_text("Sales Executive SOP content for onboarding.")

    with open(txt_file, "rb") as f:
        data = {"file": (f, "sop-07.txt")}
        response = client.post("/api/upload", data=data, content_type="multipart/form-data")

    assert response.status_code == 200
    res_data = response.get_json()
    assert res_data["doc_id"] == "SOP-07"
    assert res_data["chunks_stored"] == 1
    assert storage.count_chunks() == 1


def test_generate_plan_empty_db_error(client):
    response = client.post("/api/generate-plan", json={"employee_name": "Alice", "role": "Sales Executive"})
    assert response.status_code == 400
    assert "upload an SOP" in response.get_json()["error"]


def test_generate_plan_missing_payload(client):
    storage.add_chunk(doc_id="SOP-07", text="Sales onboarding")
    response = client.post("/api/generate-plan", json={})
    assert response.status_code == 400
    assert "required in the JSON payload" in response.get_json()["error"]
