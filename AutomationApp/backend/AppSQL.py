from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from SQL_Initiatives import (  
    GET_ALL_OPTIONS, GET_OPTION_BY_ID, UPDATE_OPTION,
    GET_ALL_INITIATIVES, UPDATE_INITIATIVE
)

app = Flask(__name__)
CORS(app)

def get_db_connection():
    """
    Establishes a connection to the MySQL database.
    Returns the database connection object.
    """
    conn = mysql.connector.connect(
        host="localhost",        # 🔹 change to your MySQL server host
        user="your_username",    # 🔹 change to your MySQL username
        password="your_password",# 🔹 change to your MySQL password
        database="your_database" # 🔹 change to your MySQL database name
    )
    return conn

@app.route('/api/options', methods=['GET'])
def get_options():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_ALL_OPTIONS)
    rows = cursor.fetchall()
    conn.close()
    return jsonify(rows)

@app.route('/api/details/<int:option_id>', methods=['GET'])
def get_option_details(option_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(GET_OPTION_BY_ID, (option_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return jsonify(row)
    else:
        return jsonify({'error': 'Option not found'}), 404

@app.route('/api/update', methods=['POST'])
def update_option():
    data = request.json
    option_id = data.get('id')
    old_value = data.get('old_value')
    new_value = data.get('new_value')

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

@app.route('/api/initiatives', methods=['GET'])
def getInitiative_options():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(GET_ALL_INITIATIVES)
        rows = cursor.fetchall()
        conn.close()
        if not rows:
            return jsonify({'message': 'No data found'}), 404
        return jsonify(rows)
    except Exception as e:
        print(f"Error fetching initiatives: {e}")
        return jsonify({'error': 'Failed to fetch initiatives'}), 500

@app.route('/api/updateInitiatives', methods=['POST'])
def updateInitiative_options():
    data = request.json.get('initiatives', [])
    conn = get_db_connection()
    cursor = conn.cursor()

    for initiative in data:
        cursor.execute(UPDATE_INITIATIVE, (
            initiative['InitiativeName'],
            initiative['InitiativeDescription'],
            initiative['InitiativeStatus'],
            initiative['InitiativeCommentary'],
            initiative['InitiativeID']
        ))

    conn.commit()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Initiatives updated successfully'})

if __name__ == '__main__':
    app.run(debug=True)
