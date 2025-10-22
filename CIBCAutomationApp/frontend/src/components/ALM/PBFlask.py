from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('/alm_run_sql', methods=['GET'])
def alm_run_sql():
    domain = request.args.get('domain')
    project = request.args.get('project')
    release = request.args.get('release')
    sql_query_name = request.args.get('sql_query_name')
    # Load SQL template
    sql_file_path = os.path.join('dql', sql_query_name)
    
    if not os.path.exists(sql_file_path):
        return jsonify({"error": "SQL template not found"}), 404
    with open(sql_file_path, 'r') as f:
        sql_query = f.read()
    
    # Substitute placeholders
    sql_query = sql_query.replace('<DB_NAME>', project).replace('<SelectedReleaseID>', release)
    # Here: connect to ALM DB and execute query (pseudo-code)
    # result = execute_sql(sql_query)
    # For demonstration, return mock result
    result = [{
        "Folder": "Regression",
        "TotalTestCases": 100,
        "Executed": 80,
        "Passed": 70,
        "Failed": 5,
        "Blocked": 5,
        "Deferred": 0,
        "AutomationCount": 30,
    }]
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)