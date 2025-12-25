// Global variables
let currentUser = {
    id: '',
    registrationDate: '',
    trackingNumbers: [],
    isAdmin: false
};

let excelFiles = []; // List of uploaded files {id, name, date, data}
let activeFileId = null; // Currently active Excel file
let excelData = []; // Current active data
let settings = { dollarRate: 12200, aviaPrice: 9.5, avtoPrice: 6 };
let clientMessages = [];
let currentAddress = '';
let adminLogs = [];

// Initialize app
window.onload = function() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
    }
    loadSettings();
    loadExcelFiles();
    loadAdminLogs();
    loadUserData();
    checkLogin();
};

// Load functions
function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) settings = JSON.parse(saved);
}

function loadExcelFiles() {
    const saved = localStorage.getItem('jekExcelFiles');
    if (saved) {
        excelFiles = JSON.parse(saved);
    }
    const active = localStorage.getItem('jekActiveFileId');
    if (active) activeFileId = active;

    // Load active data
    if (activeFileId) {
        const file = excelFiles.find(f => f.id === activeFileId);
        if (file) excelData = file.data;
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

// Add admin log
function addAdminLog(message) {
    const logEntry = { timestamp: new Date().toLocaleString('uz-UZ'), message };
    adminLogs.unshift(logEntry);
    localStorage.setItem('jekAdminLogs', JSON.stringify(adminLogs));
    if (currentUser.isAdmin && document.getElementById('adminLogsDisplay')) {
        loadAdminLogsDisplay();
    }
}

// Save user
function saveUserData() {
    localStorage.setItem('jekCurrentUser', JSON.stringify(currentUser));
}

// Check login
function checkLogin() {
    const savedUser = localStorage.getItem('jekCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
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

// Hidden login - no cancel, no hint
function promptLogin() {
    let input;
    while (true) {
        input = prompt('ID kodingizni kiriting (3 yoki 4 raqamli son):').trim();

        if (input === null || input === '') {
            alert('ID kiritish majburiy! Iltimos, ID kiriting.');
            continue;
        }

        if (input === 's08121719') {
            currentUser.id = 'ADMIN';
            currentUser.isAdmin = true;
            currentUser.registrationDate = new Date().toLocaleDateString('uz-UZ');
            saveUserData();
            showAdminPanel();
            addAdminLog('Admin tizimga kirdi');
            return;
        }

        if (/^\d{3,4}$/.test(input)) {
            currentUser.id = input;
            currentUser.registrationDate = new Date().toLocaleDateString('uz-UZ');
            currentUser.trackingNumbers = currentUser.trackingNumbers || [];
            currentUser.isAdmin = false;
            saveUserData();
            updateProfile();
            addAdminLog(`Mijoz ${currentUser.id} tizimga kirdi / ro'yxatdan o'tdi`);
            return;
        } else {
            alert('ID faqat 3 yoki 4 ta raqamdan iborat bo\'lishi kerak!\nMasalan: 123 yoki 4445');
        }
    }
}

// Update profile
function updateProfile() {
    document.getElementById('profileId').textContent = currentUser.id;
    document.getElementById('profileDate').textContent = currentUser.registrationDate;
    document.getElementById('profileOrders').textContent = currentUser.trackingNumbers.length;
}

// Logout
function logout() {
    if (confirm('Hisobdan chiqmoqchimisiz?')) {
        if (currentUser.isAdmin) addAdminLog('Admin tizimdan chiqdi');
        localStorage.removeItem('jekCurrentUser');
        location.reload();
    }
}

// Page navigation
function changePage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageName + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    const titles = { 'asosiy': 'JEK KARGO', 'buyurtmalar': 'Buyurtmalar', 'chatlar': 'Chatlar', 'profil': 'Profil' };
    document.getElementById('pageTitle').textContent = titles[pageName];

    if (pageName === 'buyurtmalar') loadTrackingNumbers();
    if (pageName === 'profil') updateProfile();
}

// Address & overlays (same as before)
function showAddress(type) {
    const clientId = currentUser.id;
    let addressText = '';
    if (type === 'avia') {
        addressText = `收货人: JEK${clientId} AVIA\n手机号码: 18699944426\n西安市: 浙江省金华市义乌市\n荷叶塘东青路89号618仓库(JEK${clientId})`;
        document.getElementById('addressTitle').textContent = 'Xitoy manzili (AVIA)';
    } else {
        addressText = `收货人: JEK${clientId}\n手机号码: 13819957009\n西安市: 浙江省金华市义乌市\n荷叶塘东青路89号618仓库(JEK${clientId})`;
        document.getElementById('addressTitle').textContent = 'Xitoy manzili (AVTO)';
    }
    currentAddress = addressText;
    document.getElementById('addressContent').textContent = addressText;
    document.getElementById('addressOverlay').classList.add('active');
}

function copyAddress() {
    navigator.clipboard.writeText(currentAddress).then(() => alert('Manzil nusxalandi! ✅')).catch(() => alert('Nusxalashda xatolik'));
}

function showTopshirish() { document.getElementById('topshirishOverlay').classList.add('active'); }
function showPochtaBepul() { document.getElementById('pochtaOverlay').classList.add('active'); }
function showCalculator() { document.getElementById('calculatorOverlay').classList.add('active'); document.getElementById('calcResult').innerHTML = ''; }
function closeOverlay() { document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active')); }

// Calculator (same)
function calculatePrice() {
    // ... (keep your existing calculatePrice function - unchanged)
    // I'll include a compact version:
    const service = document.getElementById('calcService').value;
    const items = parseInt(document.getElementById('calcItems').value) || 1;
    const weight = parseFloat(document.getElementById('calcWeight').value);
    const dims = document.getElementById('calcDimensions').value.trim();
    if (isNaN(weight) || weight <= 0) return alert('Og\'irlikni to\'g\'ri kiriting!');

    let maxDim = dims ? Math.max(...dims.split(/[xX×*]/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n))) : 0;
    const isHighRate = (items >= 5) || (maxDim > 50);
    const baseRate = service === 'avia' ? settings.aviaPrice : settings.avtoPrice;
    const rate = isHighRate ? (service === 'avia' ? 11 : 7.5) : baseRate;
    const totalUSD = (rate * weight).toFixed(2);
    const totalUZS = Math.round(rate * weight * settings.dollarRate).toLocaleString('uz-UZ');

    const resultHTML = `
        <div class="calc-result-box">
            <h3>Natija</h3>
            <div class="price-usd">$${totalUSD}</div>
            <div style="color:#666;margin-bottom:5px;">${rate} $/kg</div>
            ${isHighRate ? '<small style="color:#f57c00;display:block;margin-top:5px;">(Yuqori narx: ko\'p dona yoki katta o\'lcham)</small>' : ''}
            <div class="price-uzs">${totalUZS} so'm</div>
            ${weight > 1 ? '<div class="bonus">🎁 Bonus: 1 kg+ – Emu Pochta bepul!</div>' : ''}
        </div>
    `;
    document.getElementById('calcResult').innerHTML = resultHTML;
}

// Tracking
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
        addAdminLog(`Mijoz ${currentUser.id} ${added} ta trek qo'shdi: ${codes.join(', ')}`);
        alert(`${added} ta trek qo'shildi! ✅`);
    }
    document.getElementById('trackInput').value = '';
}

function loadTrackingNumbers() {
    const container = document.getElementById('trackList');
    if (currentUser.trackingNumbers.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><p>Hali trek raqamlar yo'q</p></div>`;
        return;
    }

    container.innerHTML = currentUser.trackingNumbers.map((code, index) => {
        const trackData = excelData.find(item => item.trackingCode === code);
        const status = trackData ? 'Ma\'lumot mavjud' : 'Kutilmoqda...';
        return `
            <div class="track-item" onclick="showTrackDetails('${code}')">
                <div><div class="track-code">${code}</div><div class="track-status">${status}</div></div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteTrackNumber(${index})"><i class="fas fa-times"></i></button>
            </div>
        `;
    }).join('');
    updateProfile();
}

function deleteTrackNumber(index) {
    if (confirm('Bu trek raqamni o\'chirmoqchimisiz?')) {
        const removed = currentUser.trackingNumbers.splice(index, 1)[0];
        saveUserData();
        loadTrackingNumbers();
        addAdminLog(`Mijoz ${currentUser.id} trekni o'chirdi: ${removed}`);
    }
}

function showTrackDetails(code) {
    // ... (keep your existing showTrackDetails function)
    // Same as before - uses excelData
}

// Messages (same)
function sendMessage() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) return alert('Xabar yozing!');
    const messageData = { userId: currentUser.id, message, timestamp: new Date().toLocaleString('uz-UZ') };
    let messages = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    messages.unshift(messageData);
    localStorage.setItem('jekClientMessages', JSON.stringify(messages));
    document.getElementById('messageText').value = '';
    alert('Xabar yuborildi! ✅');
    addAdminLog(`Mijoz ${currentUser.id} xabar yubordi`);
}

function openAdminChat() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink('https://t.me/jekkargo');
    } else {
        window.open('https://t.me/jekkargo', '_blank');
    }
}

// === IMPROVED ADMIN PANEL ===
function showAdminPanel() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('pageTitle').textContent = 'ADMIN PANEL';
    document.querySelector('.bottom-nav').style.display = 'none';

    document.getElementById('asosiyPage').innerHTML = `
        <div class="card">
            <h3>Yangi Excel fayl yuklash</h3>
            <input type="file" id="newExcelUpload" accept=".xlsx" style="margin:15px 0;">
            <button class="btn" onclick="uploadNewExcel()">Yuklash</button>
        </div>

        <div class="card">
            <h3>Yuklangan fayllar (${excelFiles.length})</h3>
            <div id="fileList"></div>
            ${excelFiles.length === 0 ? '<p style="color:#999;text-align:center;">Hali fayl yuklanmagan</p>' : ''}
        </div>

        <div class="card">
            <h3>Narxlar va kurs</h3>
            <div class="input-group"><label>Dollar kursi (so'm)</label><input type="number" id="adminDollar" value="${settings.dollarRate}"></div>
            <div class="input-group"><label>Avia narxi ($/kg)</label><input type="number" step="0.1" id="adminAvia" value="${settings.aviaPrice}"></div>
            <div class="input-group"><label>Avto narxi ($/kg)</label><input type="number" step="0.1" id="adminAvto" value="${settings.avtoPrice}"></div>
            <button class="btn" onclick="saveSettings()">Saqlash</button>
        </div>

        <div class="card">
            <h3>Mijoz xabarlari</h3>
            <div id="adminMessages"></div>
            <button class="btn btn-secondary" onclick="loadAdminMessages()">Yangilash</button>
        </div>

        <div class="card">
            <h3>Foydalanuvchi harakatlari</h3>
            <div id="adminLogsDisplay" style="max-height:300px;overflow-y:auto;"></div>
            <button class="btn btn-secondary" onclick="loadAdminLogsDisplay()">Yangilash</button>
        </div>

        <div class="card">
            <button class="btn" style="background:#dc3545;" onclick="logout()">Admin dan chiqish</button>
        </div>
    `;

    document.getElementById('asosiyPage').classList.add('active');
    renderFileList();
    loadAdminMessages();
    loadAdminLogsDisplay();
}

function uploadNewExcel() {
    const input = document.getElementById('newExcelUpload');
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
                date: new Date().toLocaleString('uz-UZ'),
                recordCount: json.length,
                data: json
            };

            excelFiles.push(newFile);
            saveExcelFiles();

            // Set as active by default
            activeFileId = newFile.id;
            excelData = json;
            saveExcelFiles();

            alert(`"${newFile.name}" yuklandi! (${json.length} ta yozuv)\nEndi faol fayl sifatida ishlatilmoqda.`);
            addAdminLog(`Admin yangi fayl yukladi: ${newFile.name} (${json.length} yozuv)`);
            renderFileList();
        } catch (err) {
            alert('Fayl o\'qishda xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function renderFileList() {
    const container = document.getElementById('fileList');
    if (excelFiles.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">Hali fayl yuklanmagan</p>';
        return;
    }

    container.innerHTML = excelFiles.map(file => `
        <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin-bottom:10px;border-left:5px solid ${file.id === activeFileId ? '#4caf50' : '#ddd'};">
            <strong>${file.name}</strong>
            <div style="font-size:12px;color:#666;margin:5px 0;">
                Yuklangan: ${file.date} | Yozuvlar: ${file.recordCount}
            </div>
            <div style="margin-top:10px;">
                <button class="btn" style="font-size:12px;padding:8px 12px;margin-right:8px;" onclick="setActiveFile('${file.id}')">
                    ${file.id === activeFileId ? '✅ Faol' : 'Faol qilish'}
                </button>
                <button class="btn" style="background:#dc3545;font-size:12px;padding:8px 12px;" onclick="deleteExcelFile('${file.id}', '${file.name}')">
                    O'chirish
                </button>
            </div>
        </div>
    `).join('');
}

function setActiveFile(fileId) {
    const file = excelFiles.find(f => f.id === fileId);
    if (!file) return;
    activeFileId = fileId;
    excelData = file.data;
    saveExcelFiles();
    alert(`"${file.name}" endi faol fayl!`);
    addAdminLog(`Admin faol faylni o'zgartirdi: ${file.name}`);
    renderFileList();
}

function deleteExcelFile(fileId, fileName) {
    if (!confirm(`"${fileName}" faylini o'chirmoqchimisiz?\nBu amal qaytarib bo'lmaydi!`)) return;

    excelFiles = excelFiles.filter(f => f.id !== fileId);
    if (activeFileId === fileId) {
        activeFileId = excelFiles.length > 0 ? excelFiles[0].id : null;
        excelData = activeFileId ? excelFiles.find(f => f.id === activeFileId).data : [];
    }
    saveExcelFiles();
    alert(`"${fileName}" o'chirildi!`);
    addAdminLog(`Admin faylni o'chirdi: ${fileName}`);
    renderFileList();
}

function saveSettings() {
    settings.dollarRate = parseFloat(document.getElementById('adminDollar').value) || 12200;
    settings.aviaPrice = parseFloat(document.getElementById('adminAvia').value) || 9.5;
    settings.avtoPrice = parseFloat(document.getElementById('adminAvto').value) || 6;
    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Sozlamalar saqlandi!');
    addAdminLog('Admin narx/kursni yangiladi');
}

function loadAdminMessages() {
    const messages = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    const container = document.getElementById('adminMessages');
    container.innerHTML = messages.length === 0 
        ? '<p style="color:#999;text-align:center;">Hali xabar yo\'q</p>'
        : messages.map(m => `
            <div style="background:#f0f0f0;padding:12px;border-radius:8px;margin-bottom:10px;">
                <strong>${m.userId}</strong> <small>${m.timestamp}</small><br>
                <p style="margin:8px 0 0;">${m.message}</p>
            </div>
        `).join('');
}

function loadAdminLogsDisplay() {
    const container = document.getElementById('adminLogsDisplay');
    container.innerHTML = adminLogs.length === 0 
        ? '<p style="color:#999;text-align:center;">Hali log yo\'q</p>'
        : adminLogs.map(l => `
            <div style="background:#f0f0f0;padding:10px;border-radius:8px;margin-bottom:8px;font-size:14px;">
                <small style="color:#666;">${l.timestamp}</small><br>${l.message}
            </div>
        `).join('');
}

// Overlay close
document.addEventListener('click', e => { if (e.target.classList.contains('overlay')) closeOverlay(); });
