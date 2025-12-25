// Global variables
let currentUser = {
    id: '',
    registrationDate: '',
    trackingNumbers: [],
    isAdmin: false
};

let excelData = [];
let settings = { dollarRate: 12200, aviaPrice: 9.5, avtoPrice: 6 };
let clientMessages = [];
let currentAddress = '';
let adminLogs = []; // Admin action logs

// Initialize app
window.onload = function() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
    }
    loadSettings();
    loadExcelData();
    loadAdminLogs();
    loadUserData();
    checkLogin();
};

// Load functions
function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) {
        settings = JSON.parse(saved);
    }
}

function loadExcelData() {
    const saved = localStorage.getItem('jekExcelData');
    if (saved) {
        excelData = JSON.parse(saved);
    }
    // Sample data for testing if empty
    if (excelData.length === 0) {
        excelData = [
            { trackingCode: 'ABC123', type: 'Avia', flight: 'FL123', weight: 5.5, receiptDate: '2025-12-01', pricePerKg: 9.5 },
            { trackingCode: 'DEF456', type: 'Avto', flight: 'FL456', weight: 10, receiptDate: '2025-11-15', pricePerKg: 6 }
        ];
        localStorage.setItem('jekExcelData', JSON.stringify(excelData));
    }
}

function loadAdminLogs() {
    const saved = localStorage.getItem('jekAdminLogs');
    if (saved) {
        adminLogs = JSON.parse(saved);
    }
}

function loadUserData() {
    const saved = localStorage.getItem('jekCurrentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
    }
}

// Add log for admin
function addAdminLog(message) {
    const logEntry = {
        timestamp: new Date().toLocaleString('uz-UZ'),
        message: message
    };
    adminLogs.unshift(logEntry);
    localStorage.setItem('jekAdminLogs', JSON.stringify(adminLogs));
    if (currentUser.isAdmin && document.getElementById('adminLogsDisplay')) {
        loadAdminLogsDisplay();
    }
}

// Save user data
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

// Login prompt with validation
// Login prompt - completely hidden admin access
function promptLogin() {
    let input;
    do {
        input = prompt('ID kodingizni kiriting (3 yoki 4 raqamli son):').trim();

        if (!input) {
            alert('ID kiritish majburiy!');
            continue;
        }

        // Secret admin access - NO HINT AT ALL
        if (input === 's08121719') {
            currentUser.id = 'ADMIN';
            currentUser.isAdmin = true;
            currentUser.registrationDate = new Date().toLocaleDateString('uz-UZ');
            saveUserData();
            showAdminPanel();
            addAdminLog('Admin tizimga kirdi');
            return;
        }

        // Normal user: only 3 or 4 digits
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
    } while (true);
}

// Update profile info
function updateProfile() {
    document.getElementById('profileId').textContent = currentUser.id;
    document.getElementById('profileDate').textContent = currentUser.registrationDate;
    document.getElementById('profileOrders').textContent = currentUser.trackingNumbers.length;
}

// Logout
function logout() {
    if (confirm('Hisobdan chiqmoqchimisiz?')) {
        if (currentUser.isAdmin) {
            addAdminLog('Admin tizimdan chiqdi');
        }
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

    const titles = {
        'asosiy': 'JEK KARGO',
        'buyurtmalar': 'Buyurtmalar',
        'chatlar': 'Chatlar',
        'profil': 'Profil'
    };
    document.getElementById('pageTitle').textContent = titles[pageName];

    if (pageName === 'buyurtmalar') loadTrackingNumbers();
    if (pageName === 'profil') updateProfile();
}

// Address functions (unchanged)
function showAddress(type) {
    const clientId = currentUser.id;
    let addressText = '';
    if (type === 'avia') {
        addressText = `收货人: JEK${clientId} AVIA
手机号码: 18699944426
西安市: 浙江省金华市义乌市
荷叶塘东青路89号618仓库(JEK${clientId})`;
        document.getElementById('addressTitle').textContent = 'Xitoy manzili (AVIA)';
    } else {
        addressText = `收货人: JEK${clientId}
手机号码: 13819957009
西安市: 浙江省金华市义乌市
荷叶塘东青路89号618仓库(JEK${clientId})`;
        document.getElementById('addressTitle').textContent = 'Xitoy manzili (AVTO)';
    }
    currentAddress = addressText;
    document.getElementById('addressContent').textContent = addressText;
    document.getElementById('addressOverlay').classList.add('active');
}

function copyAddress() {
    navigator.clipboard.writeText(currentAddress).then(() => {
        alert('Manzil nusxalandi! ✅');
    }).catch(() => {
        alert('Nusxalashda xatolik');
    });
}

function showTopshirish() { document.getElementById('topshirishOverlay').classList.add('active'); }
function showPochtaBepul() { document.getElementById('pochtaOverlay').classList.add('active'); }
function showCalculator() {
    document.getElementById('calculatorOverlay').classList.add('active');
    document.getElementById('calcResult').innerHTML = '';
}
function closeOverlay() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}

// Calculator (unchanged)
function calculatePrice() {
    const service = document.getElementById('calcService').value;
    const items = parseInt(document.getElementById('calcItems').value) || 1;
    const weight = parseFloat(document.getElementById('calcWeight').value);
    const dims = document.getElementById('calcDimensions').value.trim();

    if (isNaN(weight) || weight <= 0) {
        alert('Og\'irlikni to\'g\'ri kiriting!');
        return;
    }

    let maxDim = 0;
    if (dims) {
        const parts = dims.split(/[xX×*]/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        if (parts.length === 3) maxDim = Math.max(...parts);
    }

    const isHighRate = (items >= 5) || (maxDim > 50);
    const baseRate = service === 'avia' ? settings.aviaPrice : settings.avtoPrice;
    const rate = isHighRate ? (service === 'avia' ? 11 : 7.5) : baseRate;
    const totalUSD = (rate * weight).toFixed(2);
    const totalUZS = Math.round(rate * weight * settings.dollarRate).toLocaleString('uz-UZ');

    const reason = isHighRate ? '<small style="color:#f57c00;display:block;margin-top:5px;">(Yuqori narx: ko\'p dona yoki katta o\'lcham)</small>' : '';
    const resultHTML = `
        <div class="calc-result-box">
            <h3>Natija</h3>
            <div class="price-usd">$${totalUSD}</div>
            <div style="color:#666;margin-bottom:5px;">${rate} $/kg</div>
            ${reason}
            <div class="price-uzs">${totalUZS} so'm</div>
            ${weight > 1 ? '<div class="bonus">🎁 Bonus: 1 kg+ – Emu Pochta bepul!</div>' : ''}
        </div>
    `;
    document.getElementById('calcResult').innerHTML = resultHTML;
}

// Tracking numbers
function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) { alert('Trek raqam kiriting!'); return; }
    const codes = input.split(',').map(c => c.trim().toUpperCase()).filter(c => c);

    let addedCount = 0;
    codes.forEach(code => {
        if (!currentUser.trackingNumbers.includes(code)) {
            currentUser.trackingNumbers.push(code);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        saveUserData();
        loadTrackingNumbers();
        addAdminLog(`Mijoz ${currentUser.id} ${addedCount} ta trek qo'shdi: ${codes.join(', ')}`);
        alert(`${addedCount} ta trek raqam qo'shildi! ✅`);
    } else {
        alert('Bunday trek raqamlar allaqachon qo\'shilgan');
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
    if (confirm('Bu trek raqamni o\'chirmoqchimisiz?')) {
        const removed = currentUser.trackingNumbers.splice(index, 1)[0];
        saveUserData();
        loadTrackingNumbers();
        addAdminLog(`Mijoz ${currentUser.id} trekni o'chirdi: ${removed}`);
    }
}

function showTrackDetails(code) {
    const trackData = excelData.find(item => item.trackingCode === code);
    // ... (same as previous version - omitted for brevity, keep your existing code here)
    // If you need the full showTrackDetails function, copy it from the previous version
}

// Message sending
function sendMessage() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) { alert('Xabar yozing!'); return; }

    const messageData = {
        userId: currentUser.id,
        message: message,
        timestamp: new Date().toLocaleString('uz-UZ')
    };

    let messages = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    messages.unshift(messageData);
    localStorage.setItem('jekClientMessages', JSON.stringify(messages));

    document.getElementById('messageText').value = '';
    alert('Xabar yuborildi! ✅');
    addAdminLog(`Mijoz ${currentUser.id} xabar yubordi: "${message.substring(0,50)}..."`);
}

function openAdminChat() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink('https://t.me/jekkargo');
    } else {
        window.open('https://t.me/jekkargo', '_blank');
    }
}

// Admin Panel
function showAdminPanel() {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('pageTitle').textContent = 'ADMIN PANEL';
    document.querySelector('.bottom-nav').style.display = 'none';

    document.getElementById('asosiyPage').innerHTML = `
        <div class="card">
            <h3>Excel faylni yangilash</h3>
            <p style="margin-bottom:15px; color:#666;">Yangi trek ma'lumotlarini yuklang (xlsx)</p>
            <input type="file" id="excelUpload" accept=".xlsx">
            <button class="btn" onclick="uploadExcel()">Yuklash</button>
        </div>

        <div class="card">
            <h3>Narxlar va kurs</h3>
            <div class="input-group"><label>Dollar kursi</label><input type="number" id="adminDollar" value="${settings.dollarRate}"></div>
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
            <h3>Foydalanuvchi harakatlari (Log)</h3>
            <div id="adminLogsDisplay" style="max-height:300px;overflow-y:auto;"></div>
            <button class="btn btn-secondary" onclick="loadAdminLogsDisplay()">Yangilash</button>
        </div>

        <div class="card">
            <button class="btn" style="background:#dc3545;" onclick="logout()">Admin dan chiqish</button>
        </div>
    `;

    document.getElementById('asosiyPage').classList.add('active');
    loadAdminMessages();
    loadAdminLogsDisplay();
}

function uploadExcel() {
    const fileInput = document.getElementById('excelUpload');
    if (!fileInput.files[0]) { alert('Fayl tanlang!'); return; }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet);
            excelData = json;
            localStorage.setItem('jekExcelData', JSON.stringify(excelData));
            alert('Excel muvaffaqiyatli yuklandi va yangilandi!');
            addAdminLog('Admin yangi Excel fayl yukladi');
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

function saveSettings() {
    settings.dollarRate = parseFloat(document.getElementById('adminDollar').value) || 12200;
    settings.aviaPrice = parseFloat(document.getElementById('adminAvia').value) || 9.5;
    settings.avtoPrice = parseFloat(document.getElementById('adminAvto').value) || 6;
    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Sozlamalar saqlandi!');
    addAdminLog('Admin narx/kursni o\'zgartirdi');
}

function loadAdminMessages() {
    const messages = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    const container = document.getElementById('adminMessages');
    if (messages.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">Hali xabar yo\'q</p>';
        return;
    }
    container.innerHTML = messages.map(m => `
        <div style="background:#f0f0f0;padding:12px;border-radius:8px;margin-bottom:10px;">
            <strong>${m.userId}</strong> <small>${m.timestamp}</small><br>
            <p style="margin:8px 0 0;">${m.message}</p>
        </div>
    `).join('');
}

function loadAdminLogsDisplay() {
    const container = document.getElementById('adminLogsDisplay');
    if (adminLogs.length === 0) {
        container.innerHTML = '<p style="color:#999;text-align:center;">Hali log yo\'q</p>';
        return;
    }
    container.innerHTML = adminLogs.map(l => `
        <div style="background:#f0f0f0;padding:10px;border-radius:8px;margin-bottom:8px;font-size:14px;">
            <small style="color:#666;">${l.timestamp}</small><br>${l.message}
        </div>
    `).join('');
}

// Close overlay on outside click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('overlay')) closeOverlay();
});


