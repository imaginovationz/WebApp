from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import mysql.connector
#from pyarrow._flight import endpoints
#import pyarrow.endpoints

from SQL_Initiatives import (  
    GET_ALL_OPTIONS, GET_OPTION_BY_ID, UPDATE_OPTION,
    GET_ALL_INITIATIVES, UPDATE_INITIATIVE
)



app = Flask(__name__)
CORS(app)

def get_db_connection():
    """
    1. Establishes a connection to the SQLite database (database.db).
    2. Sets the row_factory to sqlite3.Row to allow accessing rows as dictionaries.
    3. Returns the database connection object.
    """
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn


@app.route('/api/options', methods=['GET'])
def get_options():
    """
    1. HTTP GET endpoint at /api/options.
    2. Fetches all rows from the options table in the database.
    3. Returns a JSON response containing a list of dictionaries, where each dictionary represents a row with id and options.
    """
    
    conn = get_db_connection()
    rows = conn.execute(GET_ALL_OPTIONS).fetchall()
    conn.close()
    return jsonify([{'id': row['id'], 'options': row['options']} for row in rows])


@app.route('/api/details/<int:option_id>', methods=['GET'])
def get_option_details(option_id):
    """
    1. HTTP GET endpoint at /api/details/<int:option_id>.
    2. Fetches a specific row from the options table based on the provided option_id.
    3. If the row exists, returns a JSON response with the id and options of the row.
    4. If the row does not exist, returns a JSON error message with a 404 status code.
    """
    
    conn = get_db_connection()
    row = conn.execute(GET_OPTION_BY_ID, (option_id,)).fetchone()
    conn.close() 
    if row:
        return jsonify({'id': row['id'], 'options': row['options']})
    else:
        return jsonify({'error': 'Option not found'}), 404



@app.route('/api/update', methods=['POST'])
def update_option():
    """
    1. HTTP POST endpoint at /api/update.
    2. Expects a JSON payload with id, old_value, and new_value.
    3. Updates the options column in the options table where the id matches and the current value matches old_value.
    4. Returns a success message if the update is successful.
    5. If no matching record is found, returns a failure message with a 400 status code.
    """
    
    data = request.json
    option_id = data.get('id')
    old_value = data.get('old_value')
    new_value = data.get('new_value')

	#Here, we are updating the retrieved value based on both the value and the old value
	
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(UPDATE_OPTION, (new_value, option_id, old_value))
    conn.commit()
    updated = cursor.rowcount
    conn.close()

    if updated:
        return jsonify({'status': 'success', 'message': 'Value updated'})
    else:
        return jsonify({'status': 'fail', 'message': 'No matching record found'}), 400


#INITIATIVES END POINTS    
 
@app.route('/api/initiatives', methods=['GET'])
def getInitiative_options():
    try:
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM QEInitiatives_Summary").fetchall()
        conn.close()
        
         # Get available keys in the first row
        available_keys = rows[0].keys()
        print("Available keys in QEInitiatives_Summary:", available_keys)
        
        if not rows:
            return jsonify({'initiatives': []}), 200
        initiatives = []
        for row in rows:
            initiatives.append({
                "InitiativeName": row["IniName"] if "IniName" in available_keys else "",
                "InitiativeDescription": row["InitiativeDescription"] if "InitiativeDescription" in available_keys else "",
                "InitiativeStatus": row["InitiativeStatus"] if "InitiativeStatus" in available_keys else "",
                "InitiativeCommentary": row["InitiativeCommentary"] if "InitiativeCommentary" in available_keys else "",
                "InitiativeID": row["InitiativeID"] if "InitiativeID" in available_keys else None,
                "CumulativeROI": row["CumulativeROI"] if "CumulativeROI" in available_keys else ""
            })
        return jsonify({"initiatives": initiatives})
    
    except Exception as e:
        print(f"Error fetching initiatives: {e}")
        return jsonify({'error': 'Failed to fetch initiatives'}), 500
    
    
    
    
@app.route('/api/updateInitiatives', methods=['POST'])
def updateInitiative_options():
    """
    Updates the data in the QEInitiatives_Summary table based on the received JSON payload.
    Expects a list of initiatives with updated values.
    """
    data = request.json.get('initiatives', [])
    conn = get_db_connection()
    
    cursor = conn.cursor()

    for initiative in data:
        cursor.execute(UPDATE_INITIATIVE, (
            initiative['IniName'],
            initiative['InitiativeDescription'],
            initiative['InitiativeStatus'],
            initiative['InitiativeCommentary'],
            initiative['CumulativeROI'],
            #initiative['id']
            #initiative['InitiativeID']  # Use InitiativeId as the p
        ))

    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Initiatives updated successfully'})


#PROJECT ROI END POINTS


@app.route('/api/projectroi/<int:intake_number>', methods=['GET'])
def getProjectROI(intake_number):
    """
    Fetch ROI data for a given intake_number from projectroi table.
    """
    try:
        conn = get_db_connection()
        
        cursor = conn.cursor()
        query = "SELECT * FROM projectroi WHERE intake_number = ?"
        rows = cursor.execute(query, (intake_number,)).fetchall()
        conn.close()
        if not rows:
            return jsonify({'message': 'No ROI data found for this project'}), 404
        return jsonify([dict(row) for row in rows])
    except Exception as e:
        print(f"Error fetching ROI: {e}")
        return jsonify({'error': 'Failed to fetch ROI data'}), 500


@app.route('/api/projectroiupdate', methods=['POST'])
def updateProjectROI():
    """
    Update ROI data for a project in projectroi table.
    Expects JSON payload with ROI fields.
    """
    try:
        data = request.json
        intake_number = data.get('intake_number')

        conn = get_db_connection()
        cursor = conn.cursor()

        update_query = """
        INSERT INTO projectroi (
        FY,ROIReportingQr,ROIReportingMonth,Portfolio,Application,Amount,AutomationFramework,TransformationInitiative,FP,DealCount,TestCaseDesign,TestUpdated,TestCaseExecuted,ROISheet,Lead,Comment,intake_number
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        cursor.execute(update_query, (
            data.get('FY'),
            data.get('ROIReportingQr'),
            data.get('ROIReportingMonth'),
            data.get('Portfolio'),
            data.get('Application'),
            data.get('Amount'),
            data.get('AutomationFramework'),
            data.get('TransformationInitiative'),
            data.get('FP'),
            data.get('DealCount'),
            data.get('TestCaseDesign'),
            data.get('TestUpdated'),
            data.get('TestCaseExecuted'),
            data.get('ROISheet'),
            data.get('Lead'),
            data.get('Comment'),
            intake_number
        ))

        conn.commit()
        updated = cursor.rowcount
        conn.close()

        if updated:
            return jsonify({'status': 'success', 'message': 'ROI data updated successfully'})
        else:
            return jsonify({'status': 'fail', 'message': 'No matching project found'}), 400
    except Exception as e:
        print(f"Error updating ROI: {e}")
        return jsonify({'error': 'Failed to update ROI data'}), 500



@app.route('/api/projects/search', methods=['GET'])
def search_projects():
    """
    Fetch all projects from 'projects' table (intake_number + intake_name).
    """
    try:
        
        #query = "SELECT intake_number, intake_name,  FROM Project"
        query = request.args.get('query', '')
        if not query or len(query) < 3:
            return jsonify([])
    
        conn = get_db_connection()
        cursor = conn.cursor()
        
        #query = "SELECT * FROM Project"
        sql = """
        SELECT intake_number, intake_name
        FROM Project
        WHERE intake_number LIKE ? OR intake_name LIKE ?
        LIMIT 10
        """
    
        like_query = f"%{query}%"
        rows = cursor.execute(sql, (like_query, like_query)).fetchall()
        conn.close()
        return jsonify([dict(row) for row in rows])
        #print(jsonify([dict(row) for row in rows]))
        #rows = cursor.execute(query).fetchall()
        #conn.close()

        if not rows:
            return jsonify({'message': 'No projects found'}), 404

        # Convert rows to JSON list of dicts
        #project_list = [dict(row) for row in rows]
        #return jsonify(project_list)

    except Exception as e:
        print(f"Error fetching projects: {e}")
        return jsonify({'error': 'Failed to fetch projects'}), 500


@app.route('/api/projects/<string:intake_number>', methods=['GET'])
def get_project_details(intake_number):
    """
    Fetch details for a single project by intake_number.
    Called when 'Go' is clicked on frontend.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = "SELECT * FROM Project WHERE intake_number = ?"
        row = cursor.execute(sql, (intake_number,)).fetchone()
        conn.close()
        if not row:
            return jsonify({'message': 'Project not found'}), 404
        return jsonify(dict(row))
    except Exception as e:
        print(f"Error fetching project details: {e}")
        return jsonify({'error': 'Failed to fetch project details'}), 500
    





#PROJECT ROI ENTRY CODE

@app.route('/api/projectroientry', methods=['POST'])
def save_project_roi_entry():
    """
    Save one or more Project ROI Entry rows into ProjectROIEntry table.
    Expects a JSON payload with a list of rows.
    """
    try:
        data = request.json.get('entries', [])
        if not data:
            return jsonify({'status': 'fail', 'message': 'No data provided'}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        insert_query = """
        INSERT INTO ProjectROIEntry (
            intake_number,
            Release,
            ROIMonth,
            SavingsCategory,
            AutomationFmk,
            TotalTCsCount,
            ManualTCsPD,
            AutomatedTCCreatedPD,
            NumberofCycles,
            ProjectName,
            AutomationLead
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        for entry in data:
            cursor.execute(insert_query, (
                entry.get('intake_number'),
                entry.get('Release'),
                entry.get('ROIMonth'),
                entry.get('SavingsCategory'),
                entry.get('AutomationFmk'),
                entry.get('TotalTCsCount'),
                entry.get('ManualTCsPD'),
                entry.get('AutomatedTCCreatedPD'),
                entry.get('NumberofCycles'),
                entry.get('ProjectName'),
                entry.get('AutomationLead')
            ))

        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Entries saved successfully'}), 201
    except Exception as e:
        print(f"Error saving Project ROI Entry: {e}")
        return jsonify({'error': 'Failed to save entries'}), 500


    
#ALM CONNECTOR 
@app.route('/api/fetch_tc_count', methods=['GET'])
def get_tc_count():
    query = request.args.get("query", "")
    result = fetch_tc_count(query)
    return jsonify(result)


   
if __name__ == '__main__':
    #app.run(debug=True)
    app.run(debug=False, threaded=True)
