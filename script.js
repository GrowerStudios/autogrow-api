const API_BASE = "http://127.0.0.1:5000/api";

// ---------- HELPERS ----------
function safeDisplay(v) {
  // normaliza null / "null" / undefined -> ''
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' && v.toLowerCase() === 'null') return '';
  return v;
}
function toNumberFromInput(raw) {
  // acepta "44.22" o "44,22"
  if (typeof raw !== 'string') raw = String(raw || '');
  raw = raw.trim().replace(',', '.');
  if (raw === '') return NaN;
  const n = parseFloat(raw);
  return n;
}

// ---------- Último registro ----------
async function fetchLatestLog() {
  try {
    const res = await fetch(`${API_BASE}/log`);
    const data = await res.json();
    const registros = Array.isArray(data.registros) ? data.registros : []; 

    const tbody = document.getElementById('currentValuesBody');
    tbody.innerHTML = '';
    if (registros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">Sin registros</td></tr>';
      return;
    }

    // ordenar descendente y tomar el más reciente
    registros.sort((a,b) => b[0] - a[0]);
    const [id, tempRaw, humRaw, fechaRaw] = registros[0];

    const temp = safeDisplay(tempRaw);
    const hum  = safeDisplay(humRaw);
    const fecha = safeDisplay(fechaRaw);

    tbody.innerHTML = `<tr>
      <td>${temp}</td>
      <td>${hum}</td>
      <td>${fecha}</td>
    </tr>`;
  } catch (err) {
    console.error('fetchLatestLog error', err);
    document.getElementById('currentValuesBody').innerHTML = '<tr><td colspan="3">Error</td></tr>';
  }
}

// ---------- Setpoint ----------
async function getSetpoint() {
  try {
    const res = await fetch(`${API_BASE}/setpoint`);
    const data = await res.json();
    const maxT = data && (data.max_temp_set ?? data.maxTemp ?? null);
    const minT = data && (data.min_temp_set ?? data.minTemp ?? null);
    const maxH = data && (data.max_hum_set ?? data.maxHum ?? null);
    const minH = data && (data.min_hum_set ?? data.minHum ?? null);

    document.getElementById('setpointBodyMax').innerHTML = `<tr>
      <td>${safeDisplay(maxT)}</td>
      <td>${safeDisplay(maxH)}</td>
    </tr>`;
    document.getElementById('setpointBodyMin').innerHTML = `<tr>
    <td>${safeDisplay(minT)}</td>
    <td>${safeDisplay(minH)}</td>

    </tr>`;
    // precargar inputs de edición
    document.getElementById('setMaxTemp').value = safeDisplay(maxT);
    document.getElementById('setMinTemp').value = safeDisplay(minT);
    document.getElementById('setMaxHum').value = safeDisplay(maxH);
    document.getElementById('setMinHum').value = safeDisplay(minH);
  } catch (err) {
    console.error('getSetpoints error', err);
    document.getElementById('setpointBodyMax').innerHTML = '<tr><td colspan="2">Error</td></tr>';
    document.getElementById('setpointBodyMin').innerHTML = '<tr><td colspan="2">Error</td></tr>';
  }
}

document.getElementById('btnUpdateSet').addEventListener('click', async () => {
  const statusText = document.getElementById('updateStatus');
  statusText.textContent = '';
  const rawMaxT = String(document.getElementById('setMaxTemp').value || '').trim();
  const rawMinT = String(document.getElementById('setMinTemp').value || '').trim();
  const rawMaxH = String(document.getElementById('setMaxHum').value || '').trim();
  const rawMinH = String(document.getElementById('setMinHum').value || '').trim();

  const maxT = toNumberFromInput(rawMaxT);
  const minT = toNumberFromInput(rawMinT);
  const maxH = toNumberFromInput(rawMaxH);
  const minH = toNumberFromInput(rawMinH);


  if (!Number.isFinite(maxT) || !Number.isFinite(minT) || !Number.isFinite(maxH) || !Number.isFinite(minH)) {
    statusText.textContent = 'Temp y Hum deben ser números válidos.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/setpoint`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_temp_set: maxT, min_temp_set: minT, max_hum_set: maxH, min_hum_set: minH })
    });
    if (res.ok) {
      statusText.textContent = 'Setpoints actualizados.';
      await getSetpoint();
    } else {
      statusText.textContent = 'Error actualizando setpoints.';
    }
  } catch (err) {
    console.error('updateSetpoint error', err);
    statusText.textContent = 'Error de red.';
  }
});

// ---------- Lista de registros ----------
async function loadLogs() {
  try {
    const res = await fetch(`${API_BASE}/log`);
    const data = await res.json();
    const registros = Array.isArray(data.registros) ? data.registros : [];
    registros.sort((a,b) => b[0] - a[0]);

    const tbody = document.getElementById('logTableBody');
    tbody.innerHTML = '';
    if (registros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">Sin registros</td></tr>';
      return;
    }

    registros.forEach(item => {
      const [id, tempRaw, humRaw, timeRaw] = item;
      const temp = safeDisplay(tempRaw);
      const hum = safeDisplay(humRaw);
      const time = safeDisplay(timeRaw);

      const tr = document.createElement('tr');
      tr.setAttribute('data-id', id);
      tr.innerHTML = `
        <td>${id}</td>
        <td class="temp-cell">${temp}</td>
        <td class="hum-cell">${hum}</td>
        <td class="time-cell">${time}</td>
        <td class="actions">
          <button onclick="editRow(${id})">Editar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('loadLogs error', err);
    document.getElementById('logTableBody').innerHTML = '<tr><td colspan="5">Error cargando registros</td></tr>';
  }
}

// ---------- Edit / Save / Delete ----------
function editRow(id) {
  const row = document.querySelector(`#logTableBody tr[data-id="${id}"]`);
  if (!row) return;
  const tempText = row.querySelector('.temp-cell').textContent || '';
  const humText  = row.querySelector('.hum-cell').textContent  || '';
  const timeText = row.querySelector('.time-cell').textContent || '';

  // crear inputs (vacío si antes era null)
  row.querySelector('.temp-cell').innerHTML = `<input id="temp-${id}" type="number" step="0.01" value="${tempText || ''}">`;
  row.querySelector('.hum-cell').innerHTML  = `<input id="hum-${id}" type="number" step="0.01" value="${humText || ''}">`;
  row.querySelector('.time-cell').innerHTML = `<input id="time-${id}" type="text" value="${timeText || ''}">`;

  row.querySelector('.actions').innerHTML = `
    <button onclick="saveRow(${id})">Guardar</button>
    <button onclick="deleteRow(${id})">Borrar</button>
  `;
}

async function saveRow(id) {
  // leer crudo y normalizar
  const rawT = String(document.getElementById(`temp-${id}`).value || '').trim();
  const rawH = String(document.getElementById(`hum-${id}`).value || '').trim();
  const rawTime = String(document.getElementById(`time-${id}`).value || '').trim();

  // parseo robusto (acepta "44,22" y " 44.22 ")
  const t = toNumberFromInput(rawT);
  const h = toNumberFromInput(rawH);

  // validación agresiva: bloquear si no son números
  if (!Number.isFinite(t) || !Number.isFinite(h)) {
    alert('Temp y Hum deben ser números válidos antes de guardar. No envies campos vacíos.');
    return;
  }

  // construir body sólo con valores adecuados
  const body = { temperatura: t, humedad: h };
  if (rawTime !== '') body.fecha = rawTime;

  // LOG del payload antes de enviar para debug (ver DevTools / RapidAPI)
  console.log('PUT payload ->', JSON.stringify(body));

  try {
    const res = await fetch(`${API_BASE}/log/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      await loadLogs();
      await fetchLatestLog();
    } else {
      // leer texto de error si existe
      const errText = await res.text().catch(()=>null);
      console.error('saveRow - server error', res.status, errText);
      alert('Error actualizando registro en servidor.');
    }
  } catch (err) {
    console.error('saveRow error', err);
    alert('Error de red al guardar.');
  }
}


async function deleteRow(id) {
  if (!confirm(`¿Seguro que querés eliminar el registro ID ${id}?`)) return;
  try {
    const res = await fetch(`${API_BASE}/log/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadLogs();
      await fetchLatestLog();
    } else {
      alert('Error eliminando registro.');
    }
  } catch (err) {
    console.error('deleteRow error', err);
    alert('Error de red al eliminar.');
  }
}

// ---------- Crear registro ----------
document.getElementById('btnToggleCreate').addEventListener('click', () => {
  const c = document.getElementById('createForm');
  c.style.display = (c.style.display === 'none' || c.style.display === '') ? 'block' : 'none';
});

document.getElementById('btnCreate').addEventListener('click', async () => {
  const status = document.getElementById('createStatus');
  status.textContent = '';
  const rawT = String(document.getElementById('newTemp').value || '').trim();
  const rawH = String(document.getElementById('newHum').value || '').trim();
  const rawTime = String(document.getElementById('newTimestamp').value || '').trim();

  const t = toNumberFromInput(rawT);
  const h = toNumberFromInput(rawH);

  if (!Number.isFinite(t) || !Number.isFinite(h)) {
    status.textContent = 'Temp y Hum deben ser números válidos.';
    return;
  }

  const body = { temperatura: t, humedad: h };
  if (rawTime !== '') body.fecha = rawTime;

  console.log('POST payload ->', JSON.stringify(body));

  try {
    const res = await fetch(`${API_BASE}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (res.ok) {
      status.textContent = 'Registro creado.';
      document.getElementById('newTemp').value = '';
      document.getElementById('newHum').value = '';
      document.getElementById('newTimestamp').value = '';
      document.getElementById('createForm').style.display = 'none';
      await loadLogs();
      await fetchLatestLog();
    } else {
      const errText = await res.text().catch(()=>null);
      console.error('create error', res.status, errText);
      status.textContent = 'Error creando registro.';
    }
  } catch (err) {
    console.error('createLog error', err);
    status.textContent = 'Error de red al crear registro.';
  }
});

// ---------- Inicialización ----------
fetchLatestLog();
getSetpoint();
loadLogs();
// refrescar último registro periódicamente
setInterval(fetchLatestLog, 15000);
