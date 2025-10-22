import sqlite3
from flask import jsonify

class SQLiteConnector:
    def __init__(self, db_path="\\\\Cbmcc-fn-00004f.ad.cibc.com\\33yshared\\it\\qat\\qc\\sqlitedatabase\\cbpt_automation_db.db"):
        self.db_path = db_path

    def connect(self):
        try:
            conn = sqlite3.connect(self.db_path)
#             print("Connection to SQLite has been established.")
            return conn
        except sqlite3.Error as e:
            print(f"Error: {e}")
            return None

    def query_database(self, sql):
        try:
            with self.connect() as conn:
                cursor = conn.cursor()
                cursor.execute(sql)
                if sql.strip().upper().startswith("SELECT") or sql.strip().upper().startswith("WITH"):
                    rows = cursor.fetchall()
                    columns = [description[0] for description in cursor.description]
                    return rows, columns
                conn.commit()
        except sqlite3.Error as e:
            print(f"Error: {e}")
        return None

# if __name__ == "__main__":
#     connector = SQLiteConnector()
#     query_sql = "PRAGMA foreign_keys = ON"
#     connector.query_database(query_sql)
#     query_sql = "PRAGMA foreign_keys"
#     connector.query_database(query_sql)
#     query_sql = "select * from CLASS_TDM"
#     connector.query_database(query_sql)

def get_class_tdm_data():
    connector = SQLiteConnector()
    query_sql = "select * from CLASS_TDM"
    return connector.query_database(query_sql)

def get_ecif_deal_data():
    connector = SQLiteConnector()
    query_sql = "select * from ECIF_Deals"
    return connector.query_database(query_sql)