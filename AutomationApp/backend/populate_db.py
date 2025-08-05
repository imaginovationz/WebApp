"""
This script initializes and populates the SQLite database (`database.db`) with sample data.

- Creates a table named `options` if it does not already exist.
- Clears any existing data in the `options` table.
- Inserts predefined options into the `options` table.

Usage:
Run this script to reset and populate the database with default values.
"""

import sqlite3

conn = sqlite3.connect('database.db')
conn.execute('CREATE TABLE IF NOT EXISTS options (id INTEGER PRIMARY KEY, name TEXT)')
conn.execute("DELETE FROM options")
conn.executemany('INSERT INTO options (name) VALUES (?)', [
    ('Option A',),
    ('Option B',),
    ('Option C',)
])
conn.commit()
conn.close()
