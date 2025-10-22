from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import os
import json
import sys
import pythoncom
from sqlalchemy.future import select
from sqlalchemy import text
import mysql.connector

# Ensure the parent directory of backend is in the PYTHONPATH
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.read_config import debug, alm_port
from alm import get_alm_database, run_dql, DQLConnector

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Update the SQLALCHEMY_DATABASE_URI to use MySQL
DATABASE_URL = 'mysql+aiomysql://root:root@10.239.43.100:3306/cbpt_automation_db'
engine = create_async_engine(DATABASE_URL, echo=True)
async_session = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

@app.middleware("http")
async def db_session_middleware(request: Request, call_next):
    response = JSONResponse(content={"message": "Internal server error"}, status_code=500)
    try:
        request.state.db = async_session()
        response = await call_next(request)
    finally:
        await request.state.db.close()
    return response

@app.get("/alm_database")
async def get_alm_database_endpoint(domain: str, project: str):
    try:
        if not domain or not project:
            raise HTTPException(status_code=400, detail="Missing domain or project parameter")
        temp = await get_alm_database(domain, project)
        if temp is not None:
            return JSONResponse(content=temp)
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch alm_database data from the database")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alm_only_release")
async def get_alm_only_release(domain: str, project: str):
    try:
        print(f"Domain: {domain}, Project: {project}")
        if not domain or not project:
            raise HTTPException(status_code=400, detail="Missing domain or project parameter")
        temp = await get_alm_database(domain, project)
        if temp is not None:
            db_name = ""
            for item in temp:
                db_name = item.get("DB_NAME")
            if db_name:
                query = f"SELECT REL_NAME FROM {db_name}.dbo.RELEASES ORDER BY REL_NAME"
                release_det = await run_dql(domain, project, query)
                if release_det is not None:
                    return JSONResponse(content=release_det)
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch alm_database data from the database")
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch alm_only_release data from the database")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alm_run_dql_2")
async def get_alm_daily_coverage(domain: str, project: str, release: str, dql_name: str):
    try:
        if not domain or not project:
            raise HTTPException(status_code=400, detail="Missing domain or project parameter")
        temp = await get_alm_database(domain, project)
        if temp is not None:
            db_name = ""
            rel_id = ""
            for item in temp:
                db_name = item.get("DB_NAME")
            if db_name:
                query = f"SELECT REL_ID FROM {db_name}.dbo.RELEASES WHERE REL_NAME = '{release}'"
                release_det = await run_dql(domain, project, query)
                if release_det is not None:
                    for item in release_det:
                        rel_id = item.get("REL_ID")
                    with open(f'./dql/{dql_name}', 'r') as file:
                        sql_query = file.read()
                    query = sql_query.replace("<DB_NAME>", db_name).replace("<SelectedReleaseID>", rel_id)
                    release_det = await run_dql(domain, project, query)
                    if release_det is not None:
                        return JSONResponse(content=release_det)
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch alm_database data from the database")
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch alm_only_release data from the database")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alm_run_dql")
async def get_alm_daily_coverage(domain: str, project: str, release: str, dql_name: str):
    try:
        if not domain or not project:
            raise HTTPException(status_code=400, detail="Missing domain or project parameter")
        
        # Try up to 3 times to handle session disconnections
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                temp = await get_alm_database(domain, project)
                if temp is not None:
                    db_name = ""
                    rel_id = ""
                    for item in temp:
                        db_name = item.get("DB_NAME")
                    if db_name:
                        query = f"SELECT REL_ID FROM {db_name}.dbo.RELEASES WHERE REL_NAME = '{release}'"
                        release_det = await run_dql(domain, project, query)
                        if release_det is not None:
                            for item in release_det:
                                rel_id = item.get("REL_ID")
                            with open(f'./dql/{dql_name}', 'r') as file:
                                sql_query = file.read()
                            query = sql_query.replace("<DB_NAME>", db_name).replace("<SelectedReleaseID>", rel_id)
                            release_det = await run_dql(domain, project, query)
                            if release_det is not None:
                                return JSONResponse(content=release_det)
                    else:
                        raise HTTPException(status_code=500, detail="Failed to fetch alm_database data from the database")
                else:
                    raise HTTPException(status_code=500, detail="Failed to fetch alm_only_release data from the database")
                break
                
            except Exception as inner_e:
                error_str = str(inner_e).lower()
                if "session has been disconnected" in error_str or "quality center session" in error_str:
                    retry_count += 1
                    if retry_count >= max_retries:
                        raise
                    print(f"ALM session disconnected. Retry attempt {retry_count} of {max_retries}...")
                    import asyncio
                    await asyncio.sleep(2)
                    pythoncom.CoInitialize()
                else:
                    raise
        
    except Exception as e:
        print(f"Error in alm_run_dql: {str(e)}")
        try:
            pythoncom.CoUninitialize()
        except:
            pass
        raise HTTPException(status_code=400, detail=str(e))
    
@app.get("/alm_run_sql")
async def get_alm_run_sql(domain: str, project: str, query: str):
    try:
        if not domain or not project or not query:
            raise HTTPException(status_code=400, detail="Missing domain, project, or query parameter")
        sql_response = await run_dql(domain, project, query)
        if sql_response is not None:
            return JSONResponse(content=sql_response)
        else:
            raise HTTPException(status_code=500, detail="Failed to fetch alm_database data from the database")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alm_query_user")
async def get_alm_query_user(request: Request):
    async with request.state.db as session:  # Correct usage of AsyncSession
        result = await session.execute(select(text('distinct username FROM stored_queries')))  # Corrected SQL syntax
        project_timeline = [dict(row) for row in result]
        return JSONResponse(content=project_timeline)

@app.get("/alm_query_stored_query/{username}")
async def get_alm_query_stored_query(username: str, request: Request):
    try:
        async with request.state.db as session:  # Correct usage of AsyncSession
            result = await session.execute(select(text(' sql_query_name FROM stored_queries WHERE username = :username')).params(username=username))
            project_timeline = [dict(row) for row in result]
            return JSONResponse(content=project_timeline)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alm_get_store_query/{sql_query_name}")
async def get_alm_get_store_query(sql_query_name: str, request: Request):
    try:
        async with request.state.db as session:  # Correct usage of AsyncSession
            result = await session.execute(select(text(' sql_query FROM stored_queries WHERE sql_query_name = :sql_query_name')).params(sql_query_name=sql_query_name))
            project_timeline = [dict(row) for row in result]
            return JSONResponse(content=project_timeline)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/store_sql_query")
async def store_sql_query(request: Request):
    try:
        data = await request.json()
        if not data.get('username') or not data.get('sql_query_name') or not data.get('sql_query'):
            raise HTTPException(status_code=400, detail="Missing username, sql_query_name, or sql_query parameter")
        async with request.state.db as session:  # Correct usage of AsyncSession
            await session.execute(
                text('INSERT INTO stored_queries (username, sql_query_name, sql_query) VALUES (:username, :sql_query_name, :sql_query)'),
                {
                    'username': data.get('username'),
                    'sql_query_name': data.get('sql_query_name'),
                    'sql_query': data.get('sql_query')
                }
            )
            await session.commit()
        return JSONResponse(content={'message': 'SQL query stored successfully'}, status_code=201)
    except Exception as e:
        await request.state.db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/alm_stored_query")
async def get_alm_stored_query(request: Request):
    async with request.state.db as session:  # Correct usage of AsyncSession
        result = await session.execute(select(text('username, sql_query_name, sql_query, insert_timestamp FROM stored_queries')))
        sql_data = [dict(row) for row in result]
        return JSONResponse(content=sql_data)





'''
@app.get("/updateALMSQLTable")
def    

#front end steps

#Step 1a React UI  - select project from UI = DONE
#step 1b. fetch sum data from alm, based on selecttion on UI = DONE

#update AlmProjectExecution.js,, to add a go button

#backend python steps / api end ppint step == SAHIB
#when you hit go
# Step 1. identify teh data fetched, is.e release name, project

# step 2. update that data that is fetched in the dummy SQL Table 
## Update table_name
# where project is <>

@app.route('/updateALMSQLTable/<int:id>', methods=['PUT'])
def update_mysqltabl(id):
    data = request.get_json()
    result = db.session.execute('UPDATE the table query WHERE id = :id', {'id': id})
    task = result.fetchone()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.execute(
        'UPDATE tasks SET title = :title, description = :description, status = :status WHERE id = :id',
        {'title': data['title'], 'description': data.get('description'), 'status': data['status'], 'id': id}
    )
    db.session.commit()
    return jsonify({'message': 'Task updated successfully'})

CREATE TABLE IF NOT EXISTS table_name (
    column_name INT
)

#step 3: will happen automatically - AMit

#Step 4. will happen automatically is,e power bi report will be adjusted = Auto
'''


config = {
    'host': '10.239.43.100',
    'user': 'sahib',
    'password': 'nigampwd',
    'database': 'cbpt_automation_db',
    'port': 3306
}    
 
@app.get("/updateALM_SQL_Table")
async def update_alm_sql_table(
    domain: str,
    alm_project: str,
    project: str,
    cycle: str,
):
    """
    1. Read the DQL template file.
    2. Replace placeholders with actual DB, project, and cycle info.
    3. Connect to ALM OTA (COM)
    4. Run query on data and count passed/failed test cases
    5. Store data in MySQL database
    """
    try:
        # 1. Read the ALM_connection.sql query
        alm_conn_path = os.path.join(
            os.path.dirname(__file__),
            "dql",
            "ALM_connection.sql"
        )
        with open(alm_conn_path, "r") as f:
            alm_conn_query = f.read()
 
        # 2. Execute the ALM query (your COM/OTA logic)
        connector = DQLConnector()
        alm_results = await connector.run_dql_in_alm(domain, project, alm_conn_query)
        if not alm_results:
            raise HTTPException(status_code=500, detail="Unable to connect to ALM")
 
        # 3. Store results in MySQL
        conn = mysql.connector.connect(**config)
        cur = conn.cursor(dictionary=True)
 
        # Create table if not exists
        cur.execute('''
            CREATE TABLE IF NOT EXISTS table_name (
                pass VARCHAR(255),
                fail VARCHAR(255)
            )
        ''')
        # Clear previous data
        cur.execute("DELETE FROM table_name")
 
        # Insert new data
        for row in alm_results:
            cur.execute(
                "INSERT INTO table_name (pass, fail) VALUES (%s, %s)",
                (str(row.get("Test Instance ID")), str(row.get("Test: Test Name")))
            )
 
        conn.commit()
        cur.close()
        conn.close()
 
        return {"message": "Data stored in MySQL successfully."}
 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
 
if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=alm_port, timeout_keep_alive=45)
