from fastapi.responses import JSONResponse
from flask import jsonify  # Import Flask's jsonify
import win32com.client
import pythoncom
import os
import sys
import json
import subprocess  # Import subprocess for restarting the backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.read_config import alm_url, mlidt_api_key, mlidt_secret_key, rbss_api_key, rbss_secret_key
import asyncio

class DQLConnector:
    def __init__(self):
        pass

    async def run_dql_in_alm(self, domain, project, query):
        retries = 2
        while retries > 0:
            try:
                pythoncom.CoInitialize()  # Initialize COM library
                tdc = win32com.client.Dispatch("TDApiOle80.TDConnection")
                # print(f"Connecting to HP ALM project: {project} in domain: {domain} and query: {query}")
                await asyncio.sleep(0.0005)
                if domain == 'MLIDT':
                    api_key = mlidt_api_key
                    secret_key = mlidt_secret_key
                elif domain == 'RBSS':
                    api_key = rbss_api_key
                    secret_key = rbss_secret_key
                else:
                    return JSONResponse(content={"error": "Invalid domain"}, status_code=400)
                auth = tdc.InitConnectionWithApiKeyEx(alm_url, api_key, secret_key)
                tdc.Connect(domain, project)
                if tdc.Connected:
                    message = f"Connected to HP ALM project: {project} in domain: {domain}"
                else:
                    message = "Failed to connect to HP ALM. Please check the connection details."

                command = tdc.Command
                command.CommandText = query
                recordset = command.Execute()
                RecCnt = recordset.RecordCount
                ColCnt = recordset.ColCount
                column_names = [recordset.ColName(col_index) for col_index in range(0, ColCnt)]
                result_set = []

                for row_index in range(RecCnt):
                    row = {}
                    for col_index in range(0, ColCnt):
                        cell_value = recordset.FieldValue(col_index)
                        row[column_names[col_index]] = cell_value
                    result_set.append(row)
                    recordset.Next() 
                tdc.Disconnect()
                # print(f"Result Set: {result_set}")  # Debug print
                return result_set
            except Exception as e:
                print(f"Error: {e}")
                if "(-2147352567, 'Exception occurred.', (0, None, None, None, 3473457, -2147418113), None)" in str(e):
                    print("Restarting backend due to specific error...")
                    subprocess.Popen([sys.executable, os.path.abspath(__file__)])  # Restart the backend
                    retries -= 1
                    if retries == 0:
                        return JSONResponse(content={"error": "Backend restarted multiple times. Please refresh the page."}, status_code=500)
                elif "(-2147352567, 'Exception occurred.', (0, None, None, None, 3145785, -2147418113), None)" in str(e):
                    print("Error occurred. Please refresh the page.")
                    return JSONResponse(content={"error": "Error occurred. Please refresh the page."}, status_code=500)
                else:
                    return JSONResponse(content={"error": str(e)}, status_code=500)
            finally:
                pythoncom.CoUninitialize()  # Uninitialize COM library

async def get_alm_database(domain, project):
    query = f"SELECT DB_NAME FROM qcsiteadmin_ALM116_db.dbo.projects WHERE PR_IS_ACTIVE='Y' AND DOMAIN_NAME='{domain}' AND PROJECT_NAME='{project}'"
    connector = DQLConnector()
    return await connector.run_dql_in_alm(domain, project, query)

async def run_dql(domain, project, query):
    connector = DQLConnector()
    return await connector.run_dql_in_alm(domain, project, query)
