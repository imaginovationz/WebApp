from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/api/options', methods=['GET'])
def get_options():
    conn = get_db_connection()
    rows = conn.execute('SELECT id, options FROM options').fetchall()
    conn.close()
    return jsonify([{'id': row['id'], 'options': row['options']} for row in rows])

@app.route('/api/details/<int:option_id>', methods=['GET'])
def get_option_details(option_id):
    conn = get_db_connection()
    row = conn.execute('SELECT id, options FROM options WHERE id = ?', (option_id,)).fetchone()
    conn.close()
    if row:
        return jsonify({'id': row['id'], 'options': row['options']})
    else:
        return jsonify({'error': 'Option not found'}), 404

@app.route('/api/update', methods=['POST'])
def update_option():
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
