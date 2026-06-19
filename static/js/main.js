// ─────────────────────────────────────────
// Concept: Global variables — store data
// that all functions can access
// ─────────────────────────────────────────
let allHospitals = [];
let map = null;
let isLoggedIn = false;

// ─────────────────────────────────────────
// Concept: fetch API — JavaScript way to
// call our Flask API and get hospital data
// ─────────────────────────────────────────
async function loadHospitals() {
    try {
        const response = await fetch('/api/hospitals');
        allHospitals = await response.json();
        updateStats();
        applyFilters();
        initMap();
    } catch (error) {
        console.error('Error loading hospitals:', error);
    }
}

// ─────────────────────────────────────────
// Concept: DOM manipulation — updating HTML
// elements from JavaScript
// ─────────────────────────────────────────
function updateStats() {
    const totalBeds = allHospitals.reduce((sum, h) => sum + h.beds_available, 0);
    const totalICU = allHospitals.reduce((sum, h) => sum + h.icu_available, 0);
    const totalOxygen = allHospitals.reduce((sum, h) => sum + h.oxygen_cylinders, 0);
    const totalDoctors = allHospitals.reduce((sum, h) => sum + h.doctors_on_duty, 0);

    document.getElementById('totalBeds').textContent = totalBeds;
    document.getElementById('totalICU').textContent = totalICU;
    document.getElementById('totalOxygen').textContent = totalOxygen;
    document.getElementById('totalDoctors').textContent = totalDoctors;
}

// ─────────────────────────────────────────
// Concept: Filtering — loop through data
// and keep only matching items
// ─────────────────────────────────────────
function applyFilters() {
    const type = document.getElementById('filterType').value;
    const distance = parseFloat(document.getElementById('filterDistance').value);
    const needBeds = document.getElementById('filterBeds').checked;
    const needICU = document.getElementById('filterICU').checked;
    const needOxygen = document.getElementById('filterOxygen').checked;
    const need24h = document.getElementById('filter24h').checked;

    // Blood type filters
    const bloodChecks = document.querySelectorAll('.blood-chips input:checked');
    const selectedBlood = Array.from(bloodChecks).map(cb => cb.value);

    // Update chip styling
    document.querySelectorAll('.filter-chip').forEach(chip => {
        const cb = chip.querySelector('input');
        if (cb && cb.checked) chip.classList.add('checked');
        else chip.classList.remove('checked');
    });

    let filtered = allHospitals.filter(h => {
        if (type !== 'All' && h.type !== type) return false;
        if (h.distance > distance) return false;
        if (needBeds && h.beds_available === 0) return false;
        if (needICU && h.icu_available === 0) return false;
        if (needOxygen && h.oxygen_cylinders === 0) return false;
        if (need24h && !h.open_24h) return false;
        if (selectedBlood.length > 0) {
            const hasBlood = selectedBlood.some(bt => h.blood_bank[bt]);
            if (!hasBlood) return false;
        }
        return true;
    });

    // Sort by distance
    filtered.sort((a, b) => a.distance - b.distance);

    document.getElementById('resultsCount').textContent =
        `Found ${filtered.length} hospital(s) near you`;

    renderHospitals(filtered);
}

// ─────────────────────────────────────────
// Concept: Template literals — building
// HTML strings dynamically in JavaScript
// ─────────────────────────────────────────
function renderHospitals(hospitals) {
    const container = document.getElementById('hospitalList');

    if (hospitals.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px 20px;color:#6c757d">
                <div style="font-size:40px;margin-bottom:10px">🏥</div>
                <div style="font-weight:600">No hospitals found</div>
                <div style="font-size:13px;margin-top:4px">Try adjusting your filters</div>
            </div>`;
        return;
    }

    container.innerHTML = hospitals.map(h => {
        const cardClass = h.beds_available > 5 ? '' :
                          h.beds_available > 0 ? 'low' : 'critical';

        const bedClass = h.beds_available > 5 ? '' :
                         h.beds_available > 0 ? 'low' : 'critical';

        const icuClass = h.icu_available > 3 ? '' :
                         h.icu_available > 0 ? 'low' : 'critical';

        const oxyClass = h.oxygen_cylinders > 5 ? '' :
                         h.oxygen_cylinders > 0 ? 'low' : 'critical';

        const docClass = h.doctors_on_duty > 2 ? '' :
                         h.doctors_on_duty > 0 ? 'low' : 'critical';

        const bloodHTML = Object.entries(h.blood_bank).map(([type, avail]) =>
            `<div class="blood-item ${avail ? 'available' : 'unavailable'}">${type}</div>`
        ).join('');

        const specsHTML = h.specializations.map(s =>
            `<span class="spec-tag">${s}</span>`
        ).join('');

        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`;

        return `
        <div class="hospital-card ${cardClass}">
            <div class="card-header">
                <div>
                    <div class="hospital-name">🏥 ${h.name}</div>
                    <div class="hospital-meta">
                        📍 ${h.address}<br>
                        📏 ${h.distance} km away
                    </div>
                </div>
                <div class="badges">
                    <span class="badge ${h.type === 'Government' ? 'badge-govt' : 'badge-private'}">
                        ${h.type === 'Government' ? '🏛️ Govt' : '🏢 Private'}
                    </span>
                    <span class="badge ${h.open_24h ? 'badge-open' : 'badge-limited'}">
                        ${h.open_24h ? '✅ 24h' : '⏰ Limited'}
                    </span>
                </div>
            </div>

            <div class="resource-grid">
                <div class="resource-item">
                    <div class="resource-value ${bedClass}">${h.beds_available}</div>
                    <div class="resource-label">🛏️ Beds</div>
                </div>
                <div class="resource-item">
                    <div class="resource-value ${icuClass}">${h.icu_available}</div>
                    <div class="resource-label">🏥 ICU</div>
                </div>
                <div class="resource-item">
                    <div class="resource-value ${oxyClass}">${h.oxygen_cylinders}</div>
                    <div class="resource-label">🫁 O₂</div>
                </div>
                <div class="resource-item">
                    <div class="resource-value ${docClass}">${h.doctors_on_duty}</div>
                    <div class="resource-label">👨‍⚕️ Docs</div>
                </div>
            </div>

            <div class="specs">${specsHTML}</div>

            <div class="blood-toggle" onclick="toggleBlood(${h.id})">
                🩸 Blood Bank <i class="fas fa-chevron-down" id="chevron-${h.id}"></i>
            </div>
            <div class="blood-bank-grid" id="blood-${h.id}">
                ${bloodHTML}
            </div>

            <div class="card-actions">
                <a href="${mapsUrl}" target="_blank" class="action-btn directions">
                    <i class="fas fa-map-marker-alt"></i> Directions
                </a>
                <a href="tel:${h.phone}" class="action-btn call">
                    <i class="fas fa-phone"></i> Call
                </a>
                <button class="action-btn details" onclick="showDetails(${h.id})">
                    <i class="fas fa-info-circle"></i> Details
                </button>
            </div>
        </div>`;
    }).join('');
}

// Toggle blood bank
function toggleBlood(id) {
    const grid = document.getElementById(`blood-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    grid.classList.toggle('open');
    chevron.style.transform = grid.classList.contains('open') ? 'rotate(180deg)' : '';
}

// ─────────────────────────────────────────
// Concept: Leaflet.js — open source map
// library. We add markers for each hospital
// ─────────────────────────────────────────
function initMap() {
    if (map) return;
    map = L.map('map').setView([30.9010, 75.8573], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    allHospitals.forEach(h => {
        const color = h.beds_available > 5 ? '#2ecc71' :
                      h.beds_available > 0 ? '#f39c12' : '#e74c3c';

        const marker = L.circleMarker([h.lat, h.lon], {
            radius: 10,
            fillColor: color,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
            <div style="font-family:Inter,sans-serif;min-width:180px">
                <b style="font-size:14px">🏥 ${h.name}</b><br>
                <span style="font-size:12px;color:#6c757d">📏 ${h.distance} km</span><br><br>
                🛏️ <b>${h.beds_available}</b> beds &nbsp;
                🏥 <b>${h.icu_available}</b> ICU<br>
                🫁 <b>${h.oxygen_cylinders}</b> O₂ &nbsp;
                👨‍⚕️ <b>${h.doctors_on_duty}</b> doctors<br><br>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}"
                   target="_blank"
                   style="background:#e63946;color:#fff;padding:6px 12px;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600">
                   🗺️ Get Directions
                </a>
            </div>
        `);
    });
}

// ─────────────────────────────────────────
// Concept: Async/Await + POST request —
// send data to Flask and wait for response
// ─────────────────────────────────────────
async function findBestHospital() {
    const emergencyType = document.getElementById('emergencyType').value;
    const maxDistance = document.getElementById('aiDistance').value;

    const btn = document.querySelector('.ai-section .primary-btn');
    btn.textContent = '⏳ Finding best hospital...';
    btn.disabled = true;

    try {
        const response = await fetch('/api/recommend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                emergency_type: emergencyType,
                max_distance: parseFloat(maxDistance)
            })
        });

        const scored = await response.json();

        if (scored.length === 0) {
            document.getElementById('aiResult').innerHTML =
                '<p style="color:#e63946;text-align:center;margin-top:16px">No hospitals found in range</p>';
            return;
        }

        const best = scored[0];
        const rankedHTML = scored.map((h, i) => `
            <div class="ranked-item">
                <span class="rank-num">#${i+1}</span>
                <span class="rank-name">${h.name}</span>
                <span class="rank-score">${h.score}%</span>
            </div>
        `).join('');

        document.getElementById('aiResult').innerHTML = `
            <div class="ai-result-card">
                <div class="ai-result-title">✅ Best Match for ${emergencyType}</div>
                <div class="ai-result-name">🏥 ${best.name}</div>
                <div class="ai-result-meta">📍 ${best.address} · 📏 ${best.distance} km</div>
                <div class="ai-score">🎯 Match Score: ${best.score}%</div>
                <div class="ai-reasons">
                    🛏️ <b>${best.beds_available}</b> beds available<br>
                    🏥 <b>${best.icu_available}</b> ICU beds free<br>
                    🫁 <b>${best.oxygen_cylinders}</b> O₂ cylinders<br>
                    👨‍⚕️ <b>${best.doctors_on_duty}</b> doctors on duty
                </div>
                <a href="https://www.google.com/maps/dir/?api=1&destination=${best.lat},${best.lon}"
                   target="_blank" class="primary-btn"
                   style="text-decoration:none;display:flex;margin-bottom:16px">
                    🗺️ Get Directions
                </a>
                <div class="ai-ranked">
                    <div class="ai-ranked-title">All hospitals ranked</div>
                    ${rankedHTML}
                </div>
            </div>
        `;
    } catch (error) {
        console.error(error);
    } finally {
        btn.innerHTML = '<i class="fas fa-search"></i> Find Best Hospital';
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────
// Concept: Tab switching — show/hide
// div elements based on which tab is clicked
// ─────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (name === 'map' && map) {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
function login() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === 'admin' && pass === 'medialert123') {
        isLoggedIn = true;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('updateSection').style.display = 'block';
        loadUpdateDropdown();
    } else {
        document.getElementById('loginError').textContent = '❌ Wrong username or password';
    }
}

function logout() {
    isLoggedIn = false;
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('updateSection').style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function loadUpdateDropdown() {
    const select = document.getElementById('updateHospital');
    select.innerHTML = allHospitals.map(h =>
        `<option value="${h.id}">${h.name}</option>`
    ).join('');
    loadHospitalData();
}

function loadHospitalData() {
    const id = parseInt(document.getElementById('updateHospital').value);
    const h = allHospitals.find(h => h.id === id);
    if (!h) return;

    document.getElementById('updateForm').innerHTML = `
        <div class="update-field">
            <label>🛏️ Beds Available</label>
            <input type="number" id="u_beds" value="${h.beds_available}" min="0" max="${h.beds_total}">
        </div>
        <div class="update-field">
            <label>🏥 ICU Beds</label>
            <input type="number" id="u_icu" value="${h.icu_available}" min="0" max="${h.icu_total}">
        </div>
        <div class="update-field">
            <label>🫁 O₂ Cylinders</label>
            <input type="number" id="u_oxygen" value="${h.oxygen_cylinders}" min="0">
        </div>
        <div class="update-field">
            <label>👨‍⚕️ Doctors</label>
            <input type="number" id="u_doctors" value="${h.doctors_on_duty}" min="0">
        </div>
    `;
}

async function saveUpdate() {
    const id = parseInt(document.getElementById('updateHospital').value);
    const h = allHospitals.find(h => h.id === id);

    const updated = {
        ...h,
        beds_available: parseInt(document.getElementById('u_beds').value),
        icu_available: parseInt(document.getElementById('u_icu').value),
        oxygen_cylinders: parseInt(document.getElementById('u_oxygen').value),
        doctors_on_duty: parseInt(document.getElementById('u_doctors').value)
    };

    try {
        await fetch('/api/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
        });

        Object.assign(h, updated);
        updateStats();

        document.getElementById('updateMsg').innerHTML =
            '<div class="success-msg">✅ Data updated successfully!</div>';

        setTimeout(() => {
            document.getElementById('updateMsg').innerHTML = '';
        }, 3000);

    } catch (error) {
        console.error(error);
    }
}

function showDetails(id) {
    const h = allHospitals.find(h => h.id === id);
    alert(`🏥 ${h.name}\n📍 ${h.address}\n📞 ${h.phone}\n\n🛏️ Beds: ${h.beds_available}/${h.beds_total}\n🏥 ICU: ${h.icu_available}/${h.icu_total}\n🫁 O₂: ${h.oxygen_cylinders}\n👨‍⚕️ Doctors: ${h.doctors_on_duty}\n💨 Ventilators: ${h.ventilators}`);
}

// ─────────────────────────────────────────
// START — load data when page opens
// Concept: DOMContentLoaded — runs code
// only after HTML is fully loaded
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadHospitals);