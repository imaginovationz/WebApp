from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

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
    rows = conn.execute('SELECT id, options FROM options').fetchall()
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
    row = conn.execute('SELECT id, options FROM options WHERE id = ?', (option_id,)).fetchone()
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
    cursor.execute('''
        UPDATE options
        SET options = ?
        WHERE id = ? AND options = ?
    ''', (new_value, option_id, old_value))
    conn.commit()
    updated = cursor.rowcount
    conn.close()

    if updated:
        return jsonify({'status': 'success', 'message': 'Value updated'})
    else:
        return jsonify({'status': 'fail', 'message': 'No matching record found'}), 400

if __name__ == '__main__':
    app.run(debug=True)
