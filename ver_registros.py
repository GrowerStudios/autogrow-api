import sqlite3

conn = sqlite3.connect('database.db')
cursor = conn.cursor()

cursor.execute("SELECT * FROM registros")
registros = cursor.fetchall()

for fila in registros:
    print(fila)

conn.close()
