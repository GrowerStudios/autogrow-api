from flask import Flask, request
from datetime import datetime
import sqlite3
import os
from flask_cors import CORS
import json

app = Flask(__name__)

# Allow all origins (development)
CORS(app)

def guardar_datos(temp, hum, timestamp=None):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS registros (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    temp REAL,
                    hum REAL,
                    fecha TEXT DEFAULT CURRENT_TIMESTAMP
                )''')
    
    if timestamp:
        # Si se manda desde el ESP32, usalo
        c.execute("INSERT INTO registros (temp, hum, fecha) VALUES (?, ?, ?)", (temp, hum, timestamp))
    else:
        # Si no, usá la hora local del servidor
        c.execute("INSERT INTO registros (temp, hum) VALUES (?, ?)", (temp, hum))
    
    conn.commit()
    conn.close()
    
@app.route('/api/setpoint', methods=['GET'])
def get_setpoint():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    c.execute("SELECT max_temp_set, min_temp_set, max_hum_set, min_hum_set FROM setpoints WHERE id = 1")
    row = c.fetchone()
    conn.close()
    
    if row:
        return {
        'max_temp_set': row[0],
        'min_temp_set': row[1],
        'max_hum_set': row[2],
        'min_hum_set': row[3]
    }, 200
    else:
        return {'error': 'Setpoint no encontrado'}, 404
    
@app.route('/api/setpoint', methods=['PUT'])
def update_setpoint():
    data = request.get_json()
    max_temp_set = data.get('max_temp_set')
    min_temp_set = data.get('min_temp_set')
    max_hum_set = data.get('max_hum_set')
    min_hum_set = data.get('min_hum_set')
    

    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    # Asegurar que la tabla existe
    c.execute('''CREATE TABLE IF NOT EXISTS setpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            max_temp_set REAL,
            min_temp_set REAL,
            max_hum_set REAL,
            min_hum_set REAL,
            fecha TEXT DEFAULT CURRENT_TIMESTAMP
            )''')

    # Verificar si ya hay un setpoint
    c.execute("SELECT 1 FROM setpoints WHERE id = 1")
    exists = c.fetchone()

    if exists:
        c.execute("UPDATE setpoints SET max_temp_set = ?, min_temp_set = ?, max_hum_set = ?, min_hum_set = ?, fecha = datetime('now') WHERE id = 1",
                  (max_temp_set, min_temp_set,max_hum_set, min_hum_set))
    else:
        c.execute("INSERT INTO setpoints (id, max_temp_set, min_temp_set, max_hum_set, min_hum_set, fecha) VALUES (1, ?, ?, ?, ?, datetime('now'))",
                  (max_temp_set, min_temp_set,max_hum_set, min_hum_set))

    conn.commit()
    conn.close()

    return {
        'status': f'Setpoint actualizado a: Temperatura Máxima: {max_temp_set} Humedad Máxima: {max_hum_set} Temperatura Mínima: {min_temp_set} Humedad Mínima: {min_hum_set}',
    }, 200





@app.route('/api/log', methods=['POST'])
def log_data():
    data = request.get_json()
    temp = data.get('temperatura')
    hum = data.get('humedad')
    timestamp = data.get('fecha')
    
    guardar_datos(temp, hum,timestamp)
    return {'status': 'ok'}, 200

@app.route('/api/log', methods=['GET'])
def read_logs():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT * FROM registros ORDER BY id DESC LIMIT 100")
    datos = c.fetchall()
    conn.close()

    return {'registros': datos}, 200

@app.route('/api/log/<int:log_id>', methods=['PUT'])
def update_log(log_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    data = request.get_json()
    new_temp = data.get('temperatura')
    new_hum = data.get('humedad')
    new_timestamp = data.get('fecha')

    c.execute("UPDATE registros SET temp = ?, hum = ?, fecha = ? WHERE id = ?",
              (new_temp, new_hum, new_timestamp, log_id))

    conn.commit()
    conn.close()

    return {'status': 'registro actualizado'}, 200

@app.route('/api/log/<int:log_id>', methods=['DELETE'])
def delete_log(log_id):
    conn = sqlite3.connect('database.db')
    c = conn.cursor()

    c.execute("DELETE FROM registros WHERE id = ?", (log_id,))

    conn.commit()
    conn.close()

    return {'status': 'registro eliminado'}, 200

@app.route('/')
def home():
    return "Api RabbiTotem OK"


if __name__ == '__main__':
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     

    port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port, debug=True)
