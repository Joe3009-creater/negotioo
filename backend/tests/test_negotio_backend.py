"""Negotio backend integration tests (real Claude calls -> generous timeouts)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://strategy-coach-11.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"
TOKEN = "negotio_test_token_static"
AUTH_HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


# ---------------- Scenarios (public) ----------------
class TestScenarios:
    def test_list_returns_8(self):
        r = requests.get(f"{API}/scenarios", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 8
        ids = {s["id"] for s in data}
        assert "salary-raise" in ids
        for s in data:
            for k in ["id", "title", "category", "difficulty", "role", "objective", "opponent", "opening"]:
                assert k in s, f"scenario missing {k}"

    def test_get_scenario_by_id(self):
        r = requests.get(f"{API}/scenarios/salary-raise", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == "salary-raise"

    def test_get_scenario_404(self):
        r = requests.get(f"{API}/scenarios/does-not-exist", timeout=15)
        assert r.status_code == 404


# ---------------- Auth ----------------
class TestAuth:
    def test_me_without_token_401(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_bearer(self):
        r = requests.get(f"{API}/auth/me", headers=AUTH_HEADERS, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["user_id"] == "test-user-negotio"
        assert data["email"] == "qa.negotio@example.com"

    def test_me_bad_token_401(self):
        r = requests.get(f"{API}/auth/me", headers={"Authorization": "Bearer garbage_token"}, timeout=15)
        assert r.status_code == 401


# ---------------- Full negotiation flow (real LLM) ----------------
@pytest.fixture(scope="module")
def created_session():
    r = requests.post(f"{API}/sessions", json={"scenario_id": "salary-raise"},
                      headers=AUTH_HEADERS, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


class TestNegotiationFlow:
    def test_create_session(self, created_session):
        s = created_session
        assert s["session_id"].startswith("sess_")
        assert s["status"] == "active"
        assert s["scenario_id"] == "salary-raise"
        assert len(s["messages"]) == 1
        assert s["messages"][0]["role"] == "opponent"

    def test_get_session(self, created_session):
        sid = created_session["session_id"]
        r = requests.get(f"{API}/sessions/{sid}", headers=AUTH_HEADERS, timeout=15)
        assert r.status_code == 200
        assert r.json()["session_id"] == sid

    def test_send_message(self, created_session):
        sid = created_session["session_id"]
        payload = {"content": "I appreciate the context. I've delivered two flagship launches "
                              "this year that drove measurable revenue impact. Based on market data "
                              "and my impact, I'm targeting a base of $170k plus an equity refresh."}
        r = requests.post(f"{API}/sessions/{sid}/message", json=payload,
                          headers=AUTH_HEADERS, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "message" in data and "state" in data
        st = data["state"]
        for k in ["opponent_stance", "sentiment", "deal_health", "momentum",
                  "opponent_conceded", "deal_closed"]:
            assert k in st
        assert isinstance(st["deal_health"], int)
        assert isinstance(st["momentum"], int)
        assert data["message"]["role"] == "opponent"
        assert len(data["message"]["content"]) > 0

    def test_generate_report(self, created_session):
        sid = created_session["session_id"]
        # send one more so report has substance
        requests.post(f"{API}/sessions/{sid}/message",
                      json={"content": "If we can't get to $165k base, could we bridge with a "
                                       "$15k signing bonus and a 6-month review with a clear path "
                                       "to $170k tied to specific deliverables?"},
                      headers=AUTH_HEADERS, timeout=60)
        r = requests.post(f"{API}/sessions/{sid}/report", headers=AUTH_HEADERS, timeout=90)
        assert r.status_code == 200, r.text
        rep = r.json()
        for k in ["overall_score", "headline", "outcome", "dimensions", "strengths",
                  "weaknesses", "lost_leverage", "opponent_responded_to",
                  "strategic_decisions", "concessions", "coach_feedback",
                  "improvement_plan", "recommended_scenario_id"]:
            assert k in rep, f"report missing {k}"
        for d in ["persuasion", "clarity", "empathy", "strategy", "listening", "leverage"]:
            assert d in rep["dimensions"]
        assert 0 <= rep["overall_score"] <= 100

        # session should now be completed
        s = requests.get(f"{API}/sessions/{sid}", headers=AUTH_HEADERS, timeout=15).json()
        assert s["status"] == "completed"

    def test_message_after_complete_400(self, created_session):
        sid = created_session["session_id"]
        r = requests.post(f"{API}/sessions/{sid}/message",
                          json={"content": "should reject"},
                          headers=AUTH_HEADERS, timeout=30)
        assert r.status_code == 400


# ---------------- Lists / stats ----------------
class TestListsAndStats:
    def test_list_sessions(self):
        r = requests.get(f"{API}/sessions", headers=AUTH_HEADERS, timeout=15)
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list)
        assert len(arr) >= 1
        # 'messages' should be stripped, turns should be exposed
        assert "messages" not in arr[0]
        assert "turns" in arr[0]

    def test_stats(self):
        r = requests.get(f"{API}/stats", headers=AUTH_HEADERS, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ["streak", "momentum", "strongest", "weakest", "dimensions",
                  "win_rate", "deals_closed", "trend"]:
            assert k in data, f"stats missing {k}"

    def test_create_session_bad_scenario(self):
        r = requests.post(f"{API}/sessions", json={"scenario_id": "nope"},
                          headers=AUTH_HEADERS, timeout=15)
        assert r.status_code == 404
