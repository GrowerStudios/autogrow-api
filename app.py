from flask import Flask, request
from datetime import datetime
import sqlite3

app = Flask(__name__)

def guardar_datos(temp, hum):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS registros (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    temp REAL,
                    hum REAL,
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )''')
    c.execute("INSERT INTO registros (temp, hum) VALUES (?, ?)", (temp, hum))
    conn.commit()
    conn.close()

@app.route('/')
def home():
    return "API AutoGrow OK"

@app.route('/api/log', methods=['POST'])
def log_data():
    data = request.get_json()
    temp = data.get('temperatura')
    hum = data.get('humedad')
    guardar_datos(temp, hum)
    return {'status': 'ok'}, 200

if __name__ == '__main__':
    app.run(debug=True)