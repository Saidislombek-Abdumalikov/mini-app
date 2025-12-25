let currentUser = {
    id: '',
    registrationDate: '',
    trackingNumbers: [],
    isAdmin: false
};

let excelFiles = [];
let activeFileId = null;
let excelData = [];

let settings = {
    dollarRate: 12600,
    aviaPrice: 9.5,
    avtoPrice: 6.0,
    aviaHighPrice: 11.0,
    avtoHighPrice: 7.5
};

let currentAddress = '';

window.onload = function() {
    loadEverything();
    checkLogin();
};

function loadEverything() {
    loadSettings();
    loadExcelFiles();
}

function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
}

function loadExcelFiles() {
    const saved = localStorage.getItem('jekExcelFiles');
    if (saved) excelFiles = JSON.parse(saved);

    const active = localStorage.getItem('jekActiveFileId');
    if (active && excelFiles.length > 0) {
        activeFileId = active;
        const file = excelFiles.find(f => f.id === activeFileId);
        if (file) excelData = file.data;
    }
}

function saveExcelFiles() {
    localStorage.setItem('jekExcelFiles', JSON.stringify(excelFiles));
    localStorage.setItem('jekActiveFileId', activeFileId || '');
}

function saveUserData() {
    localStorage.setItem('jekCurrentUser', JSON.stringify(currentUser));
}

function checkLogin() {
    const saved = localStorage.getItem('jekCurrentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        if (currentUser.isAdmin) {
            showAdminPanel();
        } else {
            updateProfile();
            loadTrackingNumbers();
        }
    } else {
        promptLogin();
    }
}

// Secret admin access - only you know the code
function promptLogin() {
    let input;
    while (true) {
        input = prompt('ID kodingizni kiriting (3 yoki 4 raqamli son):').trim();

        if (!input) {
            alert('ID kiritish majburiy!');
            continue;
        }

        if (input === 's08121719') {
            currentUser = { id: 'ADMIN', isAdmin: true, registrationDate: new Date().toLocaleDateString('uz-UZ'), trackingNumbers: [] };
            saveUserData();
            showAdminPanel();
            return;
        }

        if (/^\d{3,4}$/.test(input)) {
            currentUser = {
                id: input,
                registrationDate: new Date().toLocaleDateString('uz-UZ'),
                trackingNumbers: currentUser.trackingNumbers || [],
                isAdmin: false
            };
            saveUserData();
            updateProfile();
            loadTrackingNumbers();
            return;
        }

        alert('ID faqat 3 yoki 4 ta raqam bo\'lishi kerak!');
    }
}

function updateProfile() {
    document.getElementById('profileId').textContent = currentUser.id;
    document.getElementById('profileDate').textContent = currentUser.registrationDate;
    document.getElementById('profileOrders').textContent = currentUser.trackingNumbers.length;
}

function logout() {
    if (confirm('Chiqmoqchimisiz?')) {
        localStorage.removeItem('jekCurrentUser');
        location.reload();
    }
}

function changePage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('pageTitle').textContent = { asosiy: 'JEK KARGO', buyurtmalar: 'Buyurtmalar', chatlar: 'Chatlar', profil: 'Profil' }[page];
    if (page === 'buyurtmalar') loadTrackingNumbers();
}

// ... (keep your address, calculator, etc. functions as before)

// Admin Panel
function showAdminPanel() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('pageTitle').textContent = 'ADMIN PANEL';
    document.querySelector('.bottom-nav').style.display = 'none';

    document.getElementById('asosiyPage').innerHTML = `
        <div class="card">
            <h3>Yangi Excel yuklash</h3>
            <input type="file" id="excelUpload" accept=".xlsx">
            <button class="btn" onclick="uploadExcel()">Yuklash va faol qilish</button>
        </div>
        <div class="card">
            <h3>Yuklangan fayllar</h3>
            <div id="fileList"></div>
        </div>
        <div class="card">
            <h3>Narx sozlamalari</h3>
            <div class="input-group"><label>Dollar kursi</label><input type="number" id="dollarRate" value="${settings.dollarRate}"></div>
            <div class="input-group"><label>Avia oddiy</label><input type="number" step="0.1" id="aviaPrice" value="${settings.aviaPrice}"></div>
            <div class="input-group"><label>Avia yuqori</label><input type="number" step="0.1" id="aviaHighPrice" value="${settings.aviaHighPrice}"></div>
            <div class="input-group"><label>Avto oddiy</label><input type="number" step="0.1" id="avtoPrice" value="${settings.avtoPrice}"></div>
            <div class="input-group"><label>Avto yuqori</label><input type="number" step="0.1" id="avtoHighPrice" value="${settings.avtoHighPrice}"></div>
            <button class="btn" onclick="savePrices()">Saqlash</button>
        </div>
        <div class="card">
            <button class="btn" style="background:#dc3545;" onclick="logout()">Chiqish</button>
        </div>
    `;

    document.getElementById('asosiyPage').classList.add('active');
    renderFileList();
}

function uploadExcel() {
    const input = document.getElementById('excelUpload');
    if (!input.files[0]) return alert('Fayl tanlang!');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

            const newFile = {
                id: Date.now().toString(),
                name: input.files[0].name,
                date: new Date().toLocaleString('uz-UZ'),
                count: json.length,
                data: json
            };

            excelFiles.push(newFile);
            activeFileId = newFile.id;
            excelData = json;
            saveExcelFiles();
            alert(`"${newFile.name}" yuklandi va faol!`);
            renderFileList();
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function renderFileList() {
    const container = document.getElementById('fileList');
    container.innerHTML = excelFiles.length === 0 
        ? '<p class="text-center text-muted">Fayl yo\'q</p>'
        : excelFiles.map(f => `
            <div class="d-flex justify-content-between align-items-center p-3 border mb-2 rounded">
                <div>
                    <strong>${f.name}</strong><br>
                    <small>${f.date} | ${f.count} trek</small>
                </div>
                <div>
                    <button class="btn ${f.id === activeFileId ? 'btn-success' : 'btn-outline-primary'} btn-sm me-2" onclick="activateFile('${f.id}')">
                        ${f.id === activeFileId ? 'Faol' : 'Faol qilish'}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteFile('${f.id}')">O'chirish</button>
                </div>
            </div>
        `).join('');
}

function activateFile(id) {
    activeFileId = id;
    excelData = excelFiles.find(f => f.id === id).data;
    saveExcelFiles();
    alert('Faol fayl yangilandi!');
    renderFileList();
}

function deleteFile(id) {
    if (!confirm('O\'chirmoqchimisiz?')) return;
    excelFiles = excelFiles.filter(f => f.id !== id);
    if (activeFileId === id) {
        activeFileId = excelFiles.length > 0 ? excelFiles[0].id : null;
        excelData = activeFileId ? excelFiles.find(f => f.id === activeFileId).data : [];
    }
    saveExcelFiles();
    renderFileList();
}

function savePrices() {
    settings.dollarRate = parseFloat(document.getElementById('dollarRate').value) || 12600;
    settings.aviaPrice = parseFloat(document.getElementById('aviaPrice').value) || 9.5;
    settings.aviaHighPrice = parseFloat(document.getElementById('aviaHighPrice').value) || 11;
    settings.avtoPrice = parseFloat(document.getElementById('avtoPrice').value) || 6;
    settings.avtoHighPrice = parseFloat(document.getElementById('avtoHighPrice').value) || 7.5;
    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Saqlandi!');
}

// ... (keep your other functions: addTrackNumbers, loadTrackingNumbers, calculatePrice, etc.)

// Close overlays
function closeOverlay() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}
