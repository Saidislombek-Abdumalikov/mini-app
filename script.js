let currentUser = {
    id: '',
    registrationDate: '',
    trackingNumbers: [],
    isAdmin: false
};

let excelData = [];
let settings = {
    dollarRate: 12600,
    aviaPrice: 9.5,
    avtoPrice: 6.0,
    aviaHighPrice: 11.0,
    avtoHighPrice: 7.5
};

window.onload = function() {
    loadSettings();
    loadExcelData();
    checkLogin();
};

function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) settings = { ...settings, ...JSON.parse(saved) };
}

function loadExcelData() {
    const saved = localStorage.getItem('jekExcelData');
    if (saved) {
        excelData = JSON.parse(saved);
    }
}

function saveExcelData() {
    localStorage.setItem('jekExcelData', JSON.stringify(excelData));
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
    if (confirm('Chiqish?')) {
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

// Address functions (example)
function showAddress(type) {
    const id = currentUser.id;
    let text = type === 'avia' 
        ? `收货人: JEK${id} AVIA\n手机号码: 18699944426\n浙江省金华市义乌市荷叶塘东青路89号618仓库(JEK${id})`
        : `收货人: JEK${id}\n手机号码: 13819957009\n浙江省金华市义乌市荷叶塘东青路89号618仓库(JEK${id})`;
    alert(text);
}

function showTopshirish() {
    alert('Toshkent asosiy\nNamangan Sardoba');
}

function showPochtaBepul() {
    alert('1 kg+ yuklarda EMU EXPRESS bepul!');
}

function showCalculator() {
    changePage('calculatorPage'); // if you have one, or alert
}

function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) return alert('Trek kiriting!');
    const codes = input.split(',').map(c => c.trim().toUpperCase());
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
    list.innerHTML = currentUser.trackingNumbers.map((code, i) => {
        const data = excelData.find(t => (t.trackingCode || '').toUpperCase() === code);
        const status = data ? 'Ma\'lumot bor' : 'Kutilmoqda';
        return `
            <div class="track-item">
                <div>
                    <strong>${code}</strong><br>
                    <small>${status}</small>
                </div>
                <button class="delete-btn" onclick="event.stopPropagation(); deleteTrack(${i})">×</button>
            </div>
        `;
    }).join('');
}

function deleteTrack(i) {
    if (confirm('O\'chirish?')) {
        currentUser.trackingNumbers.splice(i, 1);
        saveUserData();
        loadTrackingNumbers();
    }
}

function sendMessage() {
    const text = document.getElementById('messageText').value.trim();
    if (text) {
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
    updateAdminInputs();
}

function uploadExcel() {
    const input = document.getElementById('excelUpload');
    if (!input.files[0]) return alert('Fayl tanlang!');

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            excelData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            saveExcelData();
            alert(`Yuklandi! ${excelData.length} ta trek`);
        } catch (err) {
            alert('Xato: ' + err.message);
        }
    };
    reader.readAsArrayBuffer(input.files[0]);
}

function updateAdminInputs() {
    document.getElementById('dollarRate').value = settings.dollarRate;
    document.getElementById('aviaPrice').value = settings.aviaPrice;
    document.getElementById('aviaHighPrice').value = settings.aviaHighPrice;
    document.getElementById('avtoPrice').value = settings.avtoPrice;
    document.getElementById('avtoHighPrice').value = settings.avtoHighPrice;
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
