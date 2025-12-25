let currentUser = { id: '', registrationDate: '', trackingNumbers: [], isAdmin: false };
let allExcelData = []; // {name, data: []}
let settings = { dollarRate: 12600, aviaPrice: 9.5, avtoPrice: 6.0 };
let clientMessages = [];

window.onload = function() {
    loadAllData();
    checkLogin();
};

function loadAllData() {
    loadSettings();
    loadAllExcelData();
    loadClientMessages();
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

// Persistent user data
function getUserKey(id) {
    return 'jekUser_' + id;
}

function saveUserData() {
    localStorage.setItem(getUserKey(currentUser.id), JSON.stringify(currentUser));
    localStorage.setItem('jekCurrentUser', JSON.stringify(currentUser));
}

function loadUserData(id) {
    const key = getUserKey(id);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
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

// Overlays
function openOverlay(id, type = null) {
    if (id === 'addressOverlay') {
        const isAvia = type === 'avia';
        document.getElementById('addressTitle').textContent = isAvia ? 'Xitoy manzili (AVIA)' : 'Xitoy manzili (AVTO)';
        const phone = isAvia ? '18699944426' : '13819957009';
        const address = `收货人: JEK${currentUser.id} ${isAvia ? 'AVIA' : ''}\n手机号码: ${phone}\n浙江省金华市义乌市荷叶塘东青路89号618仓库(JEK${currentUser.id})`;
        document.getElementById('addressContent').textContent = address;
        window.currentAddressText = address;
    }
    document.getElementById(id).classList.add('active');
}

function closeOverlay() {
    document.querySelectorAll('.overlay').forEach(o => o.classList.remove('active'));
}

function copyAddress() {
    navigator.clipboard.writeText(window.currentAddressText || '').then(() => alert('Nusxalandi! ✅'));
}

// Calculator
function calculatePrice() {
    const service = document.getElementById('calcService').value;
    const items = parseInt(document.getElementById('calcItems').value) || 1;
    const weight = parseFloat(document.getElementById('calcWeight').value);
    const dims = document.getElementById('calcDimensions').value.trim();

    if (!weight || weight <= 0) return alert('Og\'irlikni kiriting!');

    let maxDim = 0;
    if (dims) {
        const parts = dims.split(/[xX×*]/).map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
        if (parts.length === 3) maxDim = Math.max(...parts);
    }

    const isHigh = (items >= 5) || (maxDim > 50);
    const rate = isHigh ? (service === 'avia' ? 11 : 7.5) : (service === 'avia' ? settings.aviaPrice : settings.avtoPrice);
    const totalUSD = (rate * weight).toFixed(2);
    const totalUZS = Math.round(rate * weight * settings.dollarRate).toLocaleString('uz-UZ');

    document.getElementById('calcResult').innerHTML = `
        <div class="alert alert-success text-center p-4">
            <h4>$${totalUSD} (${rate}$/kg)${isHigh ? ' <small>(yuqori narx)</small>' : ''}</h4>
            <h5>${totalUZS} so'm</h5>
            ${weight > 1 ? '<p><strong>Bonus: Pochta bepul!</strong></p>' : ''}
        </div>
    `;
}

// Track numbers
function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) return alert('Trek raqam kiriting!');
    const codes = input.split(',').map(c => c.trim());
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

// Fixed search for your Excel format
function findTrackInAllFiles(code) {
    code = code.trim();
    for (const file of allExcelData) {
        for (const row of file.data) {
            // Check all possible fields for tracking code
            const possibleTrack = row['追踪代码'] || row['追踪代码 '] || row[2] || '';
            if (possibleTrack.toString().trim() === code) {
                return {
                    fileName: file.name,
                    weight: parseFloat(row['重量/KG'] || row['重量'] || row[5] || 0),
                    receiptDate: row['收货日期'] || row[1] || 'Noma\'lum',
                    product: row['货物名称'] || row['货物名称 Название товара'] || row[3] || 'Noma\'lum'
                };
            }
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
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // array of arrays
            const rows = json.slice(1); // skip header
            const fileInfo = { name: input.files[0].name, data: rows };
            allExcelData.push(fileInfo);
            saveAllExcelData();
            alert(`"${fileInfo.name}" yuklandi! (${rows.length} ta qator)`);
            renderAdminPanel(); // if admin
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function findTrackInAllFiles(code) {
    code = code.trim();
    for (const file of allExcelData) {
        for (const row of file.data) {
            if (row.length < 3) continue; // skip invalid rows
            const track = (row[2] || '').toString().trim();
            if (track === code) {
                const type = file.name.toLowerCase().includes('avia') ? 'Avia' : 'Avto';
                return {
                    fileName: file.name,
                    type: type,
                    weight: parseFloat(row[6] || row[9] || 0) || 0,
                    receiptDate: row[1] || 'Noma\'lum',
                    product: row[3] || row[4] || 'Noma\'lum'
                };
            }
        }
    }
    return null;
}
function renderAdminPanel() {
    document.getElementById('fileList').innerHTML = allExcelData.length === 0 
        ? '<p class="text-muted">Fayl yo\'q</p>'
        : allExcelData.map(f => `<div class="border-bottom py-2"><strong>${f.name}</strong></div>`).join('');

    document.getElementById('adminMessages').innerHTML = clientMessages.length === 0 
        ? '<p class="text-muted">Xabar yo\'q</p>'
        : clientMessages.map(m => `<div class="border-bottom py-2"><strong>ID ${m.id}</strong><br>${m.message}<br><small>${m.time}</small></div>`).join('');

    // Client list (simplified)
    document.getElementById('clientList').innerHTML = '<p class="text-muted">Mijozlar ro\'yxati</p>';
}

function savePrices() {
    settings.dollarRate = parseFloat(document.getElementById('dollarRate').value) || 12600;
    settings.aviaPrice = parseFloat(document.getElementById('aviaPrice').value) || 9.5;
    settings.avtoPrice = parseFloat(document.getElementById('avtoPrice').value) || 6;
    localStorage.setItem('jekSettings', JSON.stringify(settings));
    alert('Saqlandi!');
}

