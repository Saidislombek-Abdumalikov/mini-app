// === FINAL FIXED script.js ===

let currentUser = {
    id: '',
    registrationDate: '',
    trackingNumbers: [],
    isAdmin: false
};

let excelFiles = [];          // All uploaded Excel files
let activeFileId = null;      // Currently active file ID
let excelData = [];           // Data from active file (used for track details)

let settings = {
    dollarRate: 12600,
    aviaPrice: 9.5,
    avtoPrice: 6.0,
    aviaHighPrice: 11.0,      // Changeable in admin panel
    avtoHighPrice: 7.5        // Changeable in admin panel
};

let clientMessages = [];
let currentAddress = '';
let adminLogs = [];

// Initialize app
window.onload = function() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
    }
    loadEverything();
    checkLogin();
};

function loadEverything() {
    loadSettings();
    loadExcelFiles();
    loadAdminLogs();
    loadUserData();
}

function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) {
        const loaded = JSON.parse(saved);
        settings = { ...settings, ...loaded };
    }
}

function loadExcelFiles() {
    const savedFiles = localStorage.getItem('jekExcelFiles');
    if (savedFiles) {
        excelFiles = JSON.parse(savedFiles);
    }

    const savedActive = localStorage.getItem('jekActiveFileId');
    if (savedActive && excelFiles.length > 0) {
        activeFileId = savedActive;
        const activeFile = excelFiles.find(f => f.id === activeFileId);
        if (activeFile) {
            excelData = activeFile.data;
        }
    }
}

function saveExcelFiles() {
    localStorage.setItem('jekExcelFiles', JSON.stringify(excelFiles));
    localStorage.setItem('jekActiveFileId', activeFileId || '');
}

function loadAdminLogs() {
    const saved = localStorage.getItem('jekAdminLogs');
    if (saved) adminLogs = JSON.parse(saved);
}

function loadUserData() {
    const saved = localStorage.getItem('jekCurrentUser');
    if (saved) currentUser = JSON.parse(saved);
}

function addAdminLog(message) {
    const entry = {
        timestamp: new Date().toLocaleString('uz-UZ'),
        message: message
    };
    adminLogs.unshift(entry);
    localStorage.setItem('jekAdminLogs', JSON.stringify(adminLogs));
    if (currentUser.isAdmin) {
        loadAdminLogsDisplay();
    }
}

function saveUserData() {
    localStorage.setItem('jekCurrentUser', JSON.stringify(currentUser));
}

// Login - hidden admin + no cancel
function checkLogin() {
    if (localStorage.getItem('jekCurrentUser')) {
        currentUser = JSON.parse(localStorage.getItem('jekCurrentUser'));
        if (currentUser.isAdmin) {
            showAdminPanel();
        } else {
            updateProfile();
            loadTrackingNumbers();
            addAdminLog(`Mijoz ${currentUser.id} tizimga kirdi`);
        }
    } else {
        promptLogin();
    }
}

function promptLogin() {
    let input;
    while (true) {
        input = prompt('ID kodingizni kiriting (3 yoki 4 raqamli son):').trim();

        if (!input) {
            alert('ID kiritish majburiy!');
            continue;
        }

        if (input === 's08121719') {
            currentUser = {
                id: 'ADMIN',
                isAdmin: true,
                registrationDate: new Date().toLocaleDateString('uz-UZ'),
                trackingNumbers: []
            };
            saveUserData();
            showAdminPanel();
            addAdminLog('Admin tizimga kirdi');
            return;
        }

        if (/^\d{3,4}$/.test(input)) {
            currentUser = {
                id: input,
                registrationDate: currentUser.registrationDate || new Date().toLocaleDateString('uz-UZ'),
                trackingNumbers: currentUser.trackingNumbers || [],
                isAdmin: false
            };
            saveUserData();
            updateProfile();
            loadTrackingNumbers();
            addAdminLog(`Mijoz ${currentUser.id} kirdi/ro'yxatdan o'tdi`);
            return;
        }

        alert('ID faqat 3 yoki 4 ta raqam bo\'lishi kerak! Masalan: 123 yoki 4445');
    }
}

function updateProfile() {
    document.getElementById('profileId').textContent = currentUser.id;
    document.getElementById('profileDate').textContent = currentUser.registrationDate;
    document.getElementById('profileOrders').textContent = currentUser.trackingNumbers.length;
}

function logout() {
    if (confirm('Chiqmoqchimisiz?')) {
        if (currentUser.isAdmin) addAdminLog('Admin chiqdi');
        localStorage.removeItem('jekCurrentUser');
        location.reload();
    }
}

function changePage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const titles = { asosiy: 'JEK KARGO', buyurtmalar: 'Buyurtmalar', chatlar: 'Chatlar', profil: 'Profil' };
    document.getElementById('pageTitle').textContent = titles[page];

    if (page === 'buyurtmalar') loadTrackingNumbers();
    if (page === 'profil') updateProfile();
}

// Calculator - uses changeable high prices
function calculatePrice() {
    const service = document.getElementById('calcService').value;
    const items = parseInt(document.getElementById('calcItems').value) || 1;
    const weight = parseFloat(document.getElementById('calcWeight').value);
    const dims = document.getElementById('calcDimensions').value.trim();

    if (isNaN(weight) || weight <= 0) return alert('Og\'irlikni kiriting!');

    let maxDim = 0;
    if (dims) {
        const parts = dims.split(/[xX×*]/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        if (parts.length === 3) maxDim = Math.max(...parts);
    }

    const isHighRate = (items >= 5) || (maxDim > 50);
    const normalRate = service === 'avia' ? settings.aviaPrice : settings.avtoPrice;
    const highRate = service === 'avia' ? settings.aviaHighPrice : settings.avtoHighPrice;
    const rate = isHighRate ? highRate : normalRate;

    const totalUSD = (rate * weight).toFixed(2);
    const totalUZS = Math.round(rate * weight * settings.dollarRate).toLocaleString('uz-UZ');

    const reason = isHighRate ? '<small style="color:#f57c00;">(Yuqori narx: ko\'p dona yoki katta o\'lcham)</small>' : '';

    document.getElementById('calcResult').innerHTML = `
        <div class="calc-result-box">
            <h3>Natija</h3>
            <div class="price-usd">$${totalUSD}</div>
            <div style="color:#666;">${rate} $/kg</div>
            ${reason}
            <div class="price-uzs">${totalUZS} so'm</div>
            ${weight > 1 ? '<div class="bonus">🎁 1 kg+ – Pochta bepul!</div>' : ''}
        </div>
    `;
}

// Persistent track numbers
function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) return alert('Trek raqam kiriting!');

    const codes = input.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
    let added = 0;

    codes.forEach(code => {
        if (!currentUser.trackingNumbers.includes(code)) {
            currentUser.trackingNumbers.push(code);
            added++;
        }
    });

    if (added > 0) {
        saveUserData();
        loadTrackingNumbers();
        addAdminLog(`Mijoz ${currentUser.id} ${added} ta trek qo'shdi`);
        alert(`${added} ta trek qo'shildi!`);
    } else {
        alert('Bu treklar allaqachon mavjud');
    }
    document.getElementById('trackInput').value = '';
}

function loadTrackingNumbers() {
    const container = document.getElementById('trackList');
    if (!currentUser.trackingNumbers || currentUser.trackingNumbers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-box-open"></i><p>Hali trek yo\'q</p></div>';
        return;
    }

    container.innerHTML = currentUser.trackingNumbers.map((code, index) => {
        const trackData = excelData.find(item => {
            return item.trackingCode === code ||
                   item.TrackingCode === code ||
                   item['tracking code'] === code ||
                   item['Tracking Code'] === code;
        });

        const status = trackData ? 'Ma\'lumot mavjud' : 'Kutilmoqda...';

        return `
            <div class="track-item" onclick="showTrackDetails('${code}')">
                <div>
                    <div class="track-code">${code}</div>
                    <div class="track-status">${status}</div>
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteTrackNumber(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');

    updateProfile();
}

function deleteTrackNumber(index) {
    if (confirm('O\'chirmoqchimisiz?')) {
        const removed = currentUser.trackingNumbers.splice(index, 1)[0];
        saveUserData();
        loadTrackingNumbers();
        addAdminLog(`Mijoz ${currentUser.id} trek o'chirdi: ${removed}`);
    }
}

// Show track details (example - customize if needed)
function showTrackDetails(code) {
    const trackData = excelData.find(item => {
        return item.trackingCode === code ||
               item.TrackingCode === code ||
               item['tracking code'] === code ||
               item['Tracking Code'] === code;
    });

    let html = `<div style="text-align:center;padding:20px;">`;
    if (!trackData) {
        html += `<h3>Ma'lumot topilmadi</h3><p><strong>${code}</strong><br>Hali tizimga kiritilmagan</p>`;
    } else {
        html += `<h2>${code}</h2><p><strong>Ma'lumot mavjud</strong></p>`;
        // Add more fields from your Excel if needed
    }
    html += `</div>`;
    document.getElementById('trackDetails').innerHTML = html;
    document.getElementById('trackDetailsOverlay').classList.add('active');
}

// Admin Panel - fully working
function showAdminPanel() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('pageTitle').textContent = 'ADMIN PANEL';
    document.querySelector('.bottom-nav').style.display = 'none';

    document.getElementById('asosiyPage').innerHTML = `
        <div class="card">
            <h3>Yangi Excel fayl yuklash</h3>
            <input type="file" id="excelUpload" accept=".xlsx" style="margin-bottom:10px;">
            <button class="btn" onclick="uploadExcel()">Yuklash va faol qilish</button>
        </div>

        <div class="card">
            <h3>Yuklangan fayllar (${excelFiles.length})</h3>
            <div id="fileList" style="max-height:300px;overflow-y:auto;"></div>
        </div>

        <div class="card">
            <h3>Narx sozlamalari</h3>
            <div class="input-group"><label>Dollar kursi</label><input type="number" id="dollarRate" value="${settings.dollarRate}"></div>
            <div class="input-group"><label>Avia oddiy narx ($/kg)</label><input type="number" step="0.1" id="aviaPrice" value="${settings.aviaPrice}"></div>
            <div class="input-group"><label>Avia yuqori narx ($/kg)</label><input type="number" step="0.1" id="aviaHighPrice" value="${settings.aviaHighPrice}"></div>
            <div class="input-group"><label>Avto oddiy narx ($/kg)</label><input type="number" step="0.1" id="avtoPrice" value="${settings.avtoPrice}"></div>
            <div class="input-group"><label>Avto yuqori narx ($/kg)</label><input type="number" step="0.1" id="avtoHighPrice" value="${settings.avtoHighPrice}"></div>
            <button class="btn" onclick="savePrices()">Saqlash</button>
        </div>

        <div class="card">
            <h3>Mijoz xabarlari</h3>
            <div id="adminMessages" style="max-height:200px;overflow-y:auto;"></div>
            <button class="btn btn-secondary" onclick="loadAdminMessages()">Yangilash</button>
        </div>

        <div class="card">
            <h3>Admin loglari</h3>
            <div id="adminLogsDisplay" style="max-height:300px;overflow-y:auto;"></div>
        </div>

        <div class="card">
            <button class="btn" style="background:#dc3545;" onclick="logout()">Chiqish</button>
        </div>
    `;

    document.getElementById('asosiyPage').classList.add('active');
    renderFileList();
    loadAdminMessages();
    loadAdminLogsDisplay();
}

function uploadExcel() {
    const input = document.getElementById('excelUpload');
    if (!input.files[0]) return alert('Fayl tanlang!');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);

            const newFile = {
                id: Date.now().toString(),
                name: input.files[0].name,
                uploadDate: new Date().toLocaleString('uz-UZ'),
                records: json.length,
                data: json
            };

            excelFiles.push(newFile);
            activeFileId = newFile.id;
            excelData = json;
            saveExcelFiles();

            alert(`"${newFile.name}" yuklandi va faol qilindi! (${json.length} yozuv)`);
            addAdminLog(`Yangi Excel yuklandi: ${newFile.name}`);
            renderFileList();
        } catch (err) {
            alert('Fayl o\'qishda xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function renderFileList() {
    const list = document.getElementById('fileList');
    if (excelFiles.length === 0) {
        list.innerHTML = '<p style="text-align:center;color:#999;">Hali fayl yuklanmagan</p>';
        return;
    }

    list.innerHTML = excelFiles.map(file => `
        <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:10px;
                    border-left: 5px solid ${file.id === activeFileId ? '#4caf50' : '#ccc'}">
            <strong>${file.name}</strong><br>
            <small>Yuklangan: ${file.uploadDate} | Yozuvlar: ${file.records}</small>
            <div style="margin-top:10px;">
                <button class="btn" style="padding:8px 12px;font-size:13px;" onclick="activateFile('${file.id}')">
                    ${file.id === activeFileId ? '✅ Faol' : 'Faol qilish'}
                </button>
                <button class="btn" style="background:#dc3545;padding:8px 12px;font-size:13px;" onclick="deleteFile('${file.id}', '${file.name}')">
                    O'chirish
                </button>
            </div>
        </div>
    `).join('');
}

function activateFile(id) {
    activeFileId = id;
    const file = excelFiles.find(f => f.id === id);
    excelData = file ? file.data : [];
    saveExcelFiles();
    alert('Faol fayl o\'zgartirildi!');
    addAdminLog('Faol fayl o\'zgartirildi');
    renderFileList();
}

function deleteFile(id, name) {
    if (!confirm(`"${name}" faylini o'chirmoqchimisiz?`)) return;

    excelFiles = excelFiles.filter(f => f.id !== id);
    if (activeFileId === id) {
        activeFileId = excelFiles.length > 0 ? excelFiles[0].id : null;
        excelData = activeFileId ? excelFiles.find(f => f.id === activeFileId).data : [];
    }
    saveExcelFiles();
    alert('Fayl o\'chirildi');
    addAdminLog(`Fayl o'chirildi: ${name}`);
    renderFileList();
}

function savePrices() {
    settings.dollarRate = parseFloat(document.getElementById('dollarRate').value) || 12600;
    settings.aviaPrice = parseFloat(document.getElementById('aviaPrice').value) || 9.5;
    settings.aviaHighPrice = parseFloat(document.getElementById('aviaHighPrice').value) || 11;
    settings.avtoPrice = parseFloat(document.getElementById('avtoPrice').value) || 6;
    settings.avtoHighPrice = parseFloat(document.getElementById('avtoHighPrice').value) || 7.5;

    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Narxlar saqlandi!');
    addAdminLog('Narxlar yangilandi');
}

function loadAdminMessages() {
    const msgs = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    const container = document.getElementById('adminMessages');
    container.innerHTML = msgs.length === 0 
        ? '<p style="text-align:center;color:#999;">Xabar yo\'q</p>'
        : msgs.map(m => `<div style="background:#f0f0f0;padding:12px;border-radius:8px;margin-bottom:8px;">
            <strong>${m.userId}</strong> <small>${m.timestamp}</small><br>${m.message}
        </div>`).join('');
}

function loadAdminLogsDisplay() {
    const container = document.getElementById('adminLogsDisplay');
    container.innerHTML = adminLogs.length === 0 
        ? '<p style="text-align:center;color:#999;">Log yo\'q</p>'
        : adminLogs.map(l => `<div style="background:#f0f0f0;padding:10px;border-radius:8px;margin-bottom:8px;font-size:14px;">
            <small>${l.timestamp}</small><br>${l.message}
        </div>`).join('');
}

// Other functions (sendMessage, openAdminChat, overlays) remain the same
function sendMessage() {
    const text = document.getElementById('messageText').value.trim();
    if (!text) return alert('Xabar yozing!');
    const msg = { userId: currentUser.id, message: text, timestamp: new Date().toLocaleString('uz-UZ') };
    let list = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    list.unshift(msg);
    localStorage.setItem('jekClientMessages', JSON.stringify(list));
    document.getElementById('messageText').value = '';
    alert('Xabar yuborildi!');
    addAdminLog(`Mijoz ${currentUser.id} xabar yubordi`);
}

function openAdminChat() {
    window.open('https://t.me/jekkargo', '_blank');
}

function closeOverlay() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}

document.addEventListener('click', e => {
    if (e.target.classList.contains('overlay')) closeOverlay();
});
