from flask import Flask, request
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)

def guardar_datos(temp, hum, timestamp=None):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS registros (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    temp REAL,
                    hum REAL,
                    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
                )''')
    
    if timestamp:
        # Si se manda desde el ESP32, usalo
        c.execute("INSERT INTO registros (temp, hum, fecha) VALUES (?, ?, ?)", (temp, hum, timestamp))
    else:
        # Si no, usá la hora local del servidor
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
    timestamp = data.get('timestamp')
    
    guardar_datos(temp, hum,timestamp)
    return {'status': 'ok'}, 200

@app.route('/api/registros', methods=['GET'])
def ver_registros():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT * FROM registros ORDER BY id DESC LIMIT 100")
    datos = c.fetchall()
    conn.close()

    return {'registros': datos}, 200


if __name__ == '__main__':
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

    port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port, debug=True)
