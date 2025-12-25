let currentUser = { id: '', registrationDate: '', trackingNumbers: [], isAdmin: false };
let allExcelData = []; // All files
let settings = { dollarRate: 12600, aviaPrice: 9.5, avtoPrice: 6.0 };
let clientMessages = [];
let adminLogs = [];

window.onload = function() {
    loadAllData();
    checkLogin();
};

function loadAllData() {
    loadSettings();
    loadAllExcelData();
    loadClientMessages();
    loadAdminLogs();
}

function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) settings = JSON.parse(saved);
}

function loadAllExcelData() {
    const saved = localStorage.getItem('jekAllExcelData');
    if (saved) allExcelData = JSON.parse(saved);
}

function saveAllExcelData() {
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

// Persistent user data per ID
function getUserKey(id) {
    return 'jekUser_' + id;
}

function saveUserData() {
    localStorage.setItem(getUserKey(currentUser.id), JSON.stringify(currentUser));
    localStorage.setItem('jekCurrentUser', JSON.stringify(currentUser)); // for quick login
}

function loadUserData(id) {
    const key = getUserKey(id);
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
    return null;
}

function checkLogin() {
    const current = localStorage.getItem('jekCurrentUser');
    if (current) {
        currentUser = JSON.parse(current);
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
            let user = loadUserData(input);
            if (!user) {
                user = { id: input, registrationDate: new Date().toLocaleDateString('uz-UZ'), trackingNumbers: [], isAdmin: false };
            }
            currentUser = user;
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

// Big buttons work!
function showAddress(type) {
    const id = currentUser.id;
    const phone = type === 'avia' ? '18699944426' : '13819957009';
    const address = `收货人: JEK${id} ${type.toUpperCase()}\n手机号码: ${phone}\n浙江省金华市义乌市荷叶塘东青路89号618仓库(JEK${id})`;
    alert(address);
}

function showTopshirish() {
    alert('Topshirish punktlari:\n• Toshkent asosiy\n• Namangan Sardoba');
}

function showPochtaBepul() {
    alert('🎁 1 kg dan ko\'p yuklarda EMU EXPRESS bepul yuboramiz!');
}

function showCalculator() {
    alert('Kalkulyator yaqin orada qo\'shiladi!');
}

// Track numbers - now permanently saved
function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) return alert('Trek raqam kiriting!');
    const codes = input.split(',').map(c => c.trim().toUpperCase()).filter(c => c);
    currentUser.trackingNumbers = [...new Set([...currentUser.trackingNumbers, ...codes])];
    saveUserData();
    loadTrackingNumbers();
    document.getElementById('trackInput').value = '';
}

function loadTrackingNumbers() {
    const container = document.getElementById('trackList');
    if (currentUser.trackingNumbers.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-4">Hali trek raqam yo\'q</div>';
        return;
    }

    container.innerHTML = currentUser.trackingNumbers.map((code, i) => {
        const data = findTrackInAllFiles(code);
        let info = '<small>Kutilmoqda...</small>';
        if (data) {
            const type = data.fileName.includes('Avia') ? 'Avia' : 'Avto';
            const rate = type === 'Avia' ? settings.aviaPrice : settings.avtoPrice;
            const cost = Math.round(data.weight * rate * settings.dollarRate);
            const recDate = new Date(data.receiptDate);
            const minDays = type === 'Avia' ? 3 : 14;
            const maxDays = type === 'Avia' ? 5 : 18;
            const minDate = new Date(recDate); minDate.setDate(recDate.getDate() + minDays);
            const maxDate = new Date(recDate); maxDate.setDate(recDate.getDate() + maxDays);

            info = `
                <div style="font-size:14px;">
                    <strong>${data.product}</strong><br>
                    Og'irlik: ${data.weight} kg<br>
                    Xitoyga kelgan: ${data.receiptDate}<br>
                    Taxminiy yetib kelish: ${minDate.toLocaleDateString('uz-UZ')} - ${maxDate.toLocaleDateString('uz-UZ')}<br>
                    Narx taxminan: ${cost.toLocaleString()} so'm
                </div>
            `;
        }

        return `
            <div class="track-item">
                <div>
                    <strong>${code}</strong><br>
                    ${info}
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteTrack(${i})">×</button>
            </div>
        `;
    }).join('');
}

function deleteTrack(i) {
    if (confirm('Bu trekni o\'chirmoqchimisiz?')) {
        currentUser.trackingNumbers.splice(i, 1);
        saveUserData();
        loadTrackingNumbers();
    }
}

function findTrackInAllFiles(code) {
    code = code.toUpperCase();
    for (const file of allExcelData) {
        const row = file.data.find(r => (r['追踪代码'] || '').toString().toUpperCase() === code);
        if (row) {
            return {
                fileName: file.name,
                weight: parseFloat(r['重量/KG'] || r['重量'] || 0),
                receiptDate: r['收货日期'] || 'Noma\'lum',
                product: r['货物名称'] || r['Название товара'] || 'Noma\'lum'
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
    renderAdminPanel();
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
            saveAllExcelData();
            alert(`"${fileInfo.name}" yuklandi! Endi barcha fayllardan qidiriladi.`);
            renderAdminPanel();
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function renderAdminPanel() {
    document.getElementById('fileList').innerHTML = allExcelData.length === 0 
        ? '<p class="text-muted">Fayl yo\'q</p>'
        : allExcelData.map(f => `<div class="border-bottom py-2"><strong>${f.name}</strong> (${f.data.length} trek)</div>`).join('');

    document.getElementById('adminMessages').innerHTML = clientMessages.length === 0 
        ? '<p class="text-muted">Xabar yo\'q</p>'
        : clientMessages.map(m => `<div class="border-bottom py-2"><strong>ID ${m.id}</strong><br>${m.message}<br><small>${m.time}</small></div>`).join('');

    // List all clients
    const clients = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('jekUser_') && !key.includes('ADMIN')) {
            const user = JSON.parse(localStorage.getItem(key));
            clients.push(user);
        }
    }
    document.getElementById('clientList').innerHTML = clients.length === 0 
        ? '<p class="text-muted">Mijoz yo\'q</p>'
        : clients.map(u => `
            <div class="border-bottom py-3">
                <strong>ID: ${u.id}</strong> (${u.trackingNumbers.length} trek)<br>
                Treklar: ${u.trackingNumbers.join(', ') || 'yo\'q'}<br>
                <button class="btn btn-sm btn-danger mt-2" onclick="deleteUserTracks('${u.id}')">Treklarini o'chirish</button>
            </div>
        `).join('');

    document.getElementById('adminLogs').innerHTML = adminLogs.length === 0 
        ? '<p class="text-muted">Log yo\'q</p>'
        : adminLogs.map(l => `<div><small>${l.time}</small> ${l.msg}</div>`).join('');
}

function deleteUserTracks(id) {
    if (confirm(`ID ${id} treklarini o'chirish?`)) {
        const key = getUserKey(id);
        const user = JSON.parse(localStorage.getItem(key));
        user.trackingNumbers = [];
        localStorage.setItem(key, JSON.stringify(user));
        renderAdminPanel();
    }
}

function savePrices() {
    settings.dollarRate = parseFloat(document.getElementById('dollarRate').value) || 12600;
    settings.aviaPrice = parseFloat(document.getElementById('aviaPrice').value) || 9.5;
    settings.avtoPrice = parseFloat(document.getElementById('avtoPrice').value) || 6;
    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Saqlandi!');
}
