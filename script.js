let currentUser = { id: '', registrationDate: '', tracks: [], isAdmin: false }; // tracks = array of {code, details}
let allExcelData = [];
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

// User persistence
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
            currentUser = { id: 'ADMIN', isAdmin: true, registrationDate: new Date().toLocaleDateString('uz-UZ'), tracks: [] };
            saveUserData();
            showAdminPanel();
            return;
        }
        if (/^\d{3,4}$/.test(input)) {
            let user = loadUserData(input);
            if (!user) {
                user = { id: input, registrationDate: new Date().toLocaleDateString('uz-UZ'), tracks: [], isAdmin: false };
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
    document.getElementById('profileOrders').textContent = currentUser.tracks.length;
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
        const address = `Recipent: JEK${currentUser.id} ${isAvia ? 'AVIA' : ''}\nPhone: ${phone}\nZhejiang Jinhua Yiwu City Heyetang Dongqing Road 89 No. 618 Warehouse (JEK${currentUser.id})`;
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
    const weight = parseFloat(document.getElementById('calcWeight').value);
    if (!weight || weight <= 0) return alert('Og\'irlikni kiriting!');
    const rate = service === 'avia' ? settings.aviaPrice : settings.avtoPrice;
    const totalUZS = Math.round(weight * rate * settings.dollarRate).toLocaleString('uz-UZ');
    document.getElementById('calcResult').innerHTML = `
        <div class="text-center p-4" style="background: rgba(40,167,69,0.1); border-radius: 15px;">
            <h3 style="color: var(--green);">$${ (rate * weight).toFixed(2) }</h3>
            <h2>${totalUZS} so'm</h2>
            <p>${weight > 1 ? '🎁 Pochta bepul!' : ''}</p>
        </div>
    `;
}

// Track management - now saves details
function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) return alert('Trek raqam kiriting!');
    const codes = input.split(',').map(c => c.trim());
    codes.forEach(code => {
        if (!currentUser.tracks.find(t => t.code === code)) {
            const details = findTrackInAllFiles(code);
            currentUser.tracks.push({ code, details: details || null });
        }
    });
    saveUserData();
    loadTrackingNumbers();
    document.getElementById('trackInput').value = '';
}

function loadTrackingNumbers() {
    const container = document.getElementById('trackList');
    if (currentUser.tracks.length === 0) {
        container.innerHTML = '<div class="text-center text-muted p-5">Hali trek raqam qo\'shilmagan</div>';
        return;
    }

    container.innerHTML = currentUser.tracks.map((track, i) => {
        const d = track.details;
        const type = d ? (d.fileName.toLowerCase().includes('avia') ? 'Avia' : 'Avto') : null;
        const icon = type === 'Avia' ? '✈️' : type === 'Avto' ? '🚚' : '📦';
        const color = type === 'Avia' ? var(--blue) : type === 'Avto' ? var(--green) : '#999';

        let info = '<small style="color:#999;">Ma\'lumot yuklanmoqda...</small>';
        if (d) {
            const rate = type === 'Avia' ? settings.aviaPrice : settings.avtoPrice;
            const cost = Math.round(d.weight * rate * settings.dollarRate);
            const recDate = new Date(d.receiptDate);
            const minDays = type === 'Avia' ? 3 : 14;
            const maxDays = type === 'Avia' ? 5 : 18;
            const minDate = new Date(recDate); minDate.setDate(recDate.getDate() + minDays);
            const maxDate = new Date(recDate); maxDate.setDate(recDate.getDate() + maxDays);

            info = `
                <div style="margin-top:10px; font-size:15px;">
                    <div><strong>Mahsulot:</strong> ${d.product}</div>
                    <div><strong>Og'irlik:</strong> ${d.weight} kg</div>
                    <div><strong>Xitoyga kelgan:</strong> ${d.receiptDate}</div>
                    <div><strong>Taxminiy yetib kelish:</strong> ${minDate.toLocaleDateString('uz-UZ')} - ${maxDate.toLocaleDateString('uz-UZ')}</div>
                    <div><strong>Narx taxminan:</strong> ${cost.toLocaleString()} so'm</div>
                </div>
            `;
        }

        return `
            <div class="track-item ${type ? type.toLowerCase() : ''}">
                <div>
                    <div class="track-code">${icon} ${track.code}</div>
                    ${info}
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteTrack(${i})">×</button>
            </div>
        `;
    }).join('');
}

function deleteTrack(i) {
    if (confirm('Bu trekni o\'chirmoqchimisiz?')) {
        currentUser.tracks.splice(i, 1);
        saveUserData();
        loadTrackingNumbers();
    }
}

// Search with your exact Excel structure
function findTrackInAllFiles(code) {
    code = code.trim();
    for (const file of allExcelData) {
        for (const row of file.data) {
            if (row.length < 3) continue;
            const track = (row[2] || '').toString().trim();
            if (track === code) {
                return {
                    fileName: file.name,
                    weight: parseFloat(row[6] || row[9] || 0),
                    receiptDate: row[1] || 'Noma\'lum',
                    product: row[3] || row[4] || 'Mahsulot nomi yo\'q'
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
        alert('Xabar yuborildi! Tez orada javob beramiz.');
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
}

function uploadExcel() {
    const input = document.getElementById('excelUpload');
    if (!input.files[0]) return alert('Fayl tanlang!');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
            const rows = json.slice(1);
            const fileInfo = { name: input.files[0].name, data: rows };
            allExcelData.push(fileInfo);
            saveAllExcelData();
            alert(`"${fileInfo.name}" yuklandi!`);
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}
