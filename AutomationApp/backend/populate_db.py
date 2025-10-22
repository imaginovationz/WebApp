import sqlite3
import csv

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

# Correct file path: 'files/projects.csv' (relative to root directory)
with open('../files/projects.csv', 'r', newline='', encoding='utf-8') as f:
    reader = csv.reader(f)
    # Optionally skip header row if CSV has headers
    next(reader, None)
    for row in reader:
        cursor.execute(
            'INSERT INTO projects VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            row
        )  # Adjust table name and number of placeholders to match your table
conn.commit()
conn.close()