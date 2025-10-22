# backend/almapp.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import pythoncom
from typing import List, Dict

# Reuse your existing config + ALM connector
from backend.read_config import alm_port, alm_url  # ports & ALM URL
from alm import get_alm_database, run_dql, DQLConnector

app = FastAPI(title="ALM Mini App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

def _read_sql(file_name: str) -> str:
    path = os.path.join(os.path.dirname(__file__), "dql", file_name)
    if not os.path.exists(path):
        raise FileNotFoundError(f"SQL file not found: {file_name}")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@app.get("/api/alm/connect")
async def connect_alm(domain: str, project: str):
    """
    1) Resolve the project DB name from SITEADMIN
    2) Make a lightweight connection to confirm access
    """
    try:
        # Resolve DB name used by project
        db_info = await get_alm_database(domain, project)
        if not db_info:
            raise HTTPException(status_code=404, detail="No DB mapping found for domain/project.")
        db_name = db_info[0].get("DB_NAME")

        # Try a cheap call to test connection
        connector = DQLConnector()
        test_query = f"SELECT TOP 1 * FROM {db_name}.dbo.RELEASES"
        _ = await connector.run_dql_in_alm(domain, project, test_query)

        return {"ok": True, "message": "Connected", "db_name": db_name}
    except Exception as e:
        try:
            pythoncom.CoUninitialize()
        except:
            pass
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/alm/releases")
async def list_releases(domain: str, project: str):
    """
    List releases from project's DB (nice for a chained UI if you need it).
    """
    temp = await get_alm_database(domain, project)
    if not temp:
        raise HTTPException(status_code=404, detail="Project DB not found")
    db_name = temp[0].get("DB_NAME")
    q = f"SELECT REL_ID, REL_NAME FROM {db_name}.dbo.RELEASES ORDER BY REL_NAME"
    rows = await run_dql(domain, project, q)
    return JSONResponse(content=rows or [])

@app.get("/api/alm/run_dql")
async def run_dql_endpoint(
    domain: str,
    project: str,
    dql_name: str = "ALM_connection.sql",
    release_name: str | None = None
):
    """
    Run a templated DQL/SQL file from backend/dql/<dql_name>.
    Replaces <DB_NAME> and <SelectedReleaseID> if a release_name is provided.
    """
    try:
        # Resolve DB name
        temp = await get_alm_database(domain, project)
        if not temp:
            raise HTTPException(status_code=404, detail="Project DB not found")
        db_name = temp[0].get("DB_NAME")

        # Resolve release id if provided
        rel_id = ""
        if release_name:
            q_rel = f"SELECT REL_ID FROM {db_name}.dbo.RELEASES WHERE REL_NAME = '{release_name}'"
            rel_rows = await run_dql(domain, project, q_rel)
            if not rel_rows:
                raise HTTPException(status_code=404, detail=f"Release not found: {release_name}")
            rel_id = str(rel_rows[0].get("REL_ID"))

        # Read and substitute the SQL template
        sql_query = _read_sql(dql_name)
        sql_query = sql_query.replace("<DB_NAME>", db_name)
        if "<SelectedReleaseID>" in sql_query:
            sql_query = sql_query.replace("<SelectedReleaseID>", rel_id)

        rows = await run_dql(domain, project, sql_query)
        return JSONResponse(content=rows or [])
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        try:
            pythoncom.CoUninitialize()
        except:
            pass
        raise HTTPException(status_code=400, detail=str(e))
