from flask import jsonify
import win32com.client
import pythoncom
from read_config import alm_url, mlidt_api_key, mlidt_secret_key, rbss_api_key, rbss_secret_key

class DQLConnector:
    def __init__(self):
        pass

    def run_dql_in_alm(self, domain, project, query):
        try:
            pythoncom.CoInitialize()  # Initialize COM library
            tdc = win32com.client.Dispatch("TDApiOle80.TDConnection")
            # print(f"Query is {query}. {domain} and {project}")  
            if domain == 'MLIDT':
                api_key = mlidt_api_key
                secret_key = mlidt_secret_key
            elif domain == 'RBSS':
                api_key = rbss_api_key
                secret_key = rbss_secret_key
            else:
                return jsonify({"error": "Invalid domain"}), 400
            auth = tdc.InitConnectionWithApiKeyEx(alm_url, api_key, secret_key)
            tdc.Connect(domain, project)
            if tdc.Connected:
                message = f"Connected to HP ALM project: {project} in domain: {domain}"
                # print(message)
            else:
                message = "Failed to connect to HP ALM. Please check the connection details."
                print(message)

            command = tdc.Command
            command.CommandText = query
            recordset = command.Execute()
            RecCnt = recordset.RecordCount
            ColCnt = recordset.ColCount
            # print(f"Record Count: {RecCnt}, Column Count: {ColCnt}")
            column_names = [recordset.ColName(col_index) for col_index in range(0, ColCnt)]
            result_set = []

            for row_index in range(RecCnt):
                row = {}
                for col_index in range(0, ColCnt):
                    cell_value = recordset.FieldValue(col_index)
                    row[column_names[col_index]] = cell_value
                result_set.append(row)
                recordset.Next()  # Move to the next record
            tdc.Disconnect()
            # print(f"Result Set: {result_set}")  # Debug print
            return jsonify(result_set)
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({"error": str(e)}), 500
        finally:
            pythoncom.CoUninitialize()  # Uninitialize COM library

def get_alm_database(domain, project):
    query = f"SELECT DB_NAME FROM qcsiteadmin_ALM116_db.dbo.projects WHERE PR_IS_ACTIVE='Y' AND DOMAIN_NAME='{domain}' AND PROJECT_NAME='{project}'"
    connector = DQLConnector()
    return connector.run_dql_in_alm(domain, project, query)

def run_dql(domain, project, query):
    connector = DQLConnector()
    return connector.run_dql_in_alm(domain, project, query)
