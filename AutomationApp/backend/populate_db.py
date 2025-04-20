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
