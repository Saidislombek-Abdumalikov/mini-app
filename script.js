let currentUser = { id: '', registrationDate: '', trackingNumbers: [], isAdmin: false };
let allExcelData = []; // All data from all uploaded files
let settings = { dollarRate: 12600, aviaPrice: 9.5, avtoPrice: 6.0 };
let clientMessages = [];
let adminLogs = [];
let uploadedFiles = []; // List of uploaded file names

window.onload = function() {
    loadAllData();
    checkLogin();
};

function loadAllData() {
    loadSettings();
    loadExcelData();
    loadClientMessages();
    loadAdminLogs();
    loadUploadedFiles();
}

function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) settings = JSON.parse(saved);
}

function loadExcelData() {
    const saved = localStorage.getItem('jekAllExcelData');
    if (saved) allExcelData = JSON.parse(saved);
}

function saveExcelData() {
    localStorage.setItem('jekAllExcelData', JSON.stringify(allExcelData));
}

function loadClientMessages() {
    const saved = localStorage.getItem('jekClientMessages');
    if (saved) clientMessages = JSON.parse(saved);
}

function loadAdminLogs() {
    const saved = localStorage.getItem('jekAdminLogs');
    if (saved) adminLogs = JSON.parse(saved);
}

function loadUploadedFiles() {
    const saved = localStorage.getItem('jekUploadedFiles');
    if (saved) uploadedFiles = JSON.parse(saved);
}

function saveUploadedFiles() {
    localStorage.setItem('jekUploadedFiles', JSON.stringify(uploadedFiles));
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

function promptLogin() {
    let input;
    while (true) {
        input = prompt('ID kodingizni kiriting (3 yoki 4 raqamli son):').trim();
        if (!input) {
            alert('ID majburiy!');
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
        alert('Faqat 3 yoki 4 raqam!');
    }
}

function updateProfile() {
    document.getElementById('profileId').textContent = currentUser.id;
    document.getElementById('profileDate').textContent = currentUser.registrationDate;
    document.getElementById('profileOrders').textContent = currentUser.trackingNumbers.length;
}

function logout() {
    if (confirm('Chiqish?')) {
        localStorage.removeItem('jekCurrentUser');
        location.reload();
    }
}

function changePage(p) {
    document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
    document.getElementById(p + 'Page').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('pageTitle').textContent = { asosiy: 'JEK KARGO', buyurtmalar: 'Buyurtmalar', chatlar: 'Chatlar', profil: 'Profil' }[p];
    if (p === 'buyurtmalar') loadTrackingNumbers();
}

// Track numbers
function addTrackNumbers() {
    const val = document.getElementById('trackInput').value.trim();
    if (!val) return alert('Trek kiriting!');
    const codes = val.split(',').map(c => c.trim().toUpperCase());
    currentUser.trackingNumbers = [...new Set([...currentUser.trackingNumbers, ...codes])];
    saveUserData();
    loadTrackingNumbers();
    document.getElementById('trackInput').value = '';
}

function loadTrackingNumbers() {
    const list = document.getElementById('trackList');
    if (currentUser.trackingNumbers.length === 0) {
        list.innerHTML = '<p class="text-center text-muted">Hali trek yo\'q</p>';
        return;
    }

    list.innerHTML = currentUser.trackingNumbers.map(code => {
        const item = findInAllFiles(code);
        let info = '<small>Kutilmoqda...</small>';
        if (item) {
            const type = item.fileName.includes('Avia') ? 'Avia' : 'Avto';
            const rate = type === 'Avia' ? settings.aviaPrice : settings.avtoPrice;
            const cost = Math.round(item.weight * rate * settings.dollarRate);
            const recDate = new Date(item.receiptDate);
            const minDays = type === 'Avia' ? 3 : 14;
            const maxDays = type === 'Avia' ? 5 : 18;
            const minDate = new Date(recDate); minDate.setDate(recDate.getDate() + minDays);
            const maxDate = new Date(recDate); maxDate.setDate(recDate.getDate() + maxDays);

            info = `
                <strong>${item.product}</strong><br>
                Og'irlik: ${item.weight} kg<br>
                Xitoyga kelgan: ${item.receiptDate}<br>
                Taxminiy yetib kelish: ${minDate.toLocaleDateString('uz-UZ')} - ${maxDate.toLocaleDateString('uz-UZ')}<br>
                Taxminiy narx: ${cost.toLocaleString()} so'm
            `;
        }
        return `<div class="track-item"><div><strong>${code}</strong><br>${info}</div></div>`;
    }).join('');
}

function findInAllFiles(code) {
    code = code.toUpperCase();
    for (const file of allExcelData) {
        const row = file.data.find(r => (r['追踪代码'] || '').toString().toUpperCase() === code);
        if (row) {
            return {
                fileName: file.name,
                weight: parseFloat(row['重量/KG'] || row['重量'] || 0),
                receiptDate: row['收货日期'] || 'Noma\'lum',
                product: row['货物名称'] || row['Название товара'] || 'Noma\'lum'
            };
        }
    }
    return null;
}

function sendMessage() {
    const text = document.getElementById('messageText').value.trim();
    if (text) {
        clientMessages.unshift({ id: currentUser.id, message: text, time: new Date().toLocaleString('uz-UZ') });
        localStorage.setItem('jekClientMessages', JSON.stringify(clientMessages));
        alert('Xabar yuborildi!');
        document.getElementById('messageText').value = '';
    }
}

function openAdminChat() {
    window.open('https://t.me/jekkargo', '_blank');
}

// Admin Panel
function showAdminPanel() {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelector('.bottom-nav').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'ADMIN';
    document.getElementById('adminPanel').style.display = 'block';
    renderAdminView();
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
            const fileInfo = { name: input.files[0].name, date: new Date().toLocaleString('uz-UZ'), data: json };
            allExcelData.push(fileInfo);
            uploadedFiles.push(input.files[0].name);
            saveExcelData();
            saveUploadedFiles();
            alert(`"${input.files[0].name}" yuklandi! Endi barcha fayllardan qidiriladi.`);
            adminLog(`Yangi fayl yuklandi: ${input.files[0].name}`);
            renderAdminView();
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function renderAdminView() {
    document.getElementById('fileList').innerHTML = uploadedFiles.length === 0 
        ? '<p class="text-muted">Hali fayl yo\'q</p>'
        : uploadedFiles.map(n => `<div class="p-2 border-bottom">${n}</div>`).join('');

    // Messages
    const msgCont = document.getElementById('adminMessages');
    msgCont.innerHTML = clientMessages.length === 0 
        ? '<p class="text-muted">Xabar yo\'q</p>'
        : clientMessages.map(m => `<div class="border-bottom pb-2"><strong>ID ${m.id}</strong><br>${m.message}<br><small>${m.time}</small></div>`).join('');

    // Client list
    const savedUsers = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('jekUser_')) {
            const user = JSON.parse(localStorage.getItem(key));
            if (!user.isAdmin) savedUsers.push(user);
        }
    }
    const clientCont = document.getElementById('clientList');
    clientCont.innerHTML = savedUsers.length === 0 
        ? '<p class="text-muted">Mijoz yo\'q</p>'
        : savedUsers.map(u => `
            <div class="border-bottom pb-3 mb-3">
                <strong>ID: ${u.id}</strong> (${u.trackingNumbers.length} trek)<br>
                <small>Treklar: ${u.trackingNumbers.join(', ') || 'yo\'q'}</small><br>
                <button class="btn btn-sm btn-danger mt-2" onclick="deleteClientTracks('${u.id}')">Treklarini o'chirish</button>
            </div>
        `).join('');

    // Logs
    document.getElementById('adminLogs').innerHTML = adminLogs.length === 0 
        ? '<p class="text-muted">Log yo\'q</p>'
        : adminLogs.map(l => `<div><small>${l.time}</small> ${l.msg}</div>`).join('');
}

function deleteClientTracks(id) {
    if (confirm(`ID ${id} ning barcha treklarini o'chirmoqchimisiz?`)) {
        const key = 'jekUser_' + id;
        const user = JSON.parse(localStorage.getItem(key) || '{}');
        user.trackingNumbers = [];
        localStorage.setItem(key, JSON.stringify(user));
        adminLog(`ID ${id} treklar o'chirildi`);
        renderAdminView();
    }
}

function savePrices() {
    settings.dollarRate = parseFloat(document.getElementById('dollarRate').value) || 12600;
    settings.aviaPrice = parseFloat(document.getElementById('aviaPrice').value) || 9.5;
    settings.avtoPrice = parseFloat(document.getElementById('avtoPrice').value) || 6;
    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Saqlandi!');
    adminLog('Narxlar yangilandi');
}

function adminLog(msg) {
    adminLogs.unshift({ time: new Date().toLocaleTimeString(), msg });
    localStorage.setItem('jekAdminLogs', JSON.stringify(adminLogs));
}

// Dummy functions for big buttons
function showAddress(t) { alert(t === 'avia' ? 'Avia manzil' : 'Avto manzil'); }
function showTopshirish() { alert('Topshirish punktlari'); }
function showPochtaBepul() { alert('1kg+ bepul pochta'); }
function showCalculator() { alert('Kalkulyator'); }
