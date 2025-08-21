# alm_connector.py
import requests

# Example HP ALM REST details (replace with actual connection)
ALM_BASE_URL = "http://alm-server:8080/qcbin"
ALM_DOMAIN = "DEFAULT_DOMAIN"
ALM_PROJECT = "DEFAULT_PROJECT"
ALM_USERNAME = "your_user"
ALM_PASSWORD = "your_pass"

def fetch_tc_count(query=None):
    """
    Fetch Total Test Case count from ALM.
    Query should be constructed as needed (folder, test type, etc.).
    Returns an integer count.
    """
    try:
        # Authenticate (simplified example, adjust to your ALM setup)
        auth_url = f"{ALM_BASE_URL}/authentication-point/authenticate"
        session = requests.Session()
        session.auth = (ALM_USERNAME, ALM_PASSWORD)
        resp = session.get(auth_url)
        if resp.status_code != 200:
            return {"error": "Auth failed with ALM"}

        # Example query (adapt this to your ALM fields)
        tests_url = f"{ALM_BASE_URL}/rest/domains/{ALM_DOMAIN}/projects/{ALM_PROJECT}/tests"
        params = {"query": query or ""}
        resp = session.get(tests_url, params=params, headers={"Accept": "application/json"})

        if resp.status_code != 200:
            return {"error": "Failed to fetch test cases"}

        data = resp.json()
        count = len(data.get("entities", [])) if "entities" in data else 0
        return {"count": count}
    except Exception as e:
        return {"error": str(e)}
