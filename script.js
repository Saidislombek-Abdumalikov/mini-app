// Global variables
let currentUser = {
    id: '',
    registrationDate: '',
    trackingNumbers: []
};

let excelData = [];
let settings = { dollarRate: 12200, aviaPrice: 9.5, avtoPrice: 6 };
let clientMessages = [];
let currentAddress = '';

// Initialize app
window.onload = function() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.ready();
    }
    loadSettings();
    loadExcelData();
    loadUserData();
    checkLogin();
};

// Check if user is logged in
function checkLogin() {
    const savedUser = localStorage.getItem('jekCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateProfile();
        loadTrackingNumbers();
    } else {
        promptLogin();
    }
}

// Prompt for ID (no phone)
function promptLogin() {
    const id = prompt('ID kodingizni kiriting:');
    if (id && id.trim()) {
        currentUser.id = id.trim().toUpperCase();
        currentUser.registrationDate = new Date().toLocaleDateString('uz-UZ');
        currentUser.trackingNumbers = [];
        saveUserData();
        updateProfile();
    } else {
        // Generate random ID if canceled
        currentUser.id = 'JEK' + Math.random().toString(36).substring(2, 8).toUpperCase();
        currentUser.registrationDate = new Date().toLocaleDateString('uz-UZ');
        currentUser.trackingNumbers = [];
        saveUserData();
        updateProfile();
    }
}

// Save user data
function saveUserData() {
    localStorage.setItem('jekCurrentUser', JSON.stringify(currentUser));
}

// Load user data
function loadUserData() {
    const saved = localStorage.getItem('jekCurrentUser');
    if (saved) {
        currentUser = JSON.parse(saved);
    }
}

// Update profile display (no phone)
function updateProfile() {
    document.getElementById('profileId').textContent = currentUser.id;
    document.getElementById('profileDate').textContent = currentUser.registrationDate;
    document.getElementById('profileOrders').textContent = currentUser.trackingNumbers.length;
}

// Logout
function logout() {
    if (confirm('Hisobdan chiqmoqchimisiz?')) {
        localStorage.removeItem('jekCurrentUser');
        location.reload();
    }
}

// Load settings
function loadSettings() {
    const saved = localStorage.getItem('jekSettings');
    if (saved) {
        settings = JSON.parse(saved);
    }
}

// Load Excel data (from localStorage; assume set externally or hardcoded for testing)
function loadExcelData() {
    const saved = localStorage.getItem('jekExcelData');
    if (saved) {
        excelData = JSON.parse(saved);
    }
    // For testing, add sample data if empty
    if (excelData.length === 0) {
        excelData = [
            { trackingCode: 'ABC123', type: 'Avia', flight: 'FL123', weight: 5.5, receiptDate: '2023-10-01', pricePerKg: 9.5 },
            { trackingCode: 'DEF456', type: 'Avto', flight: 'FL456', weight: 10, receiptDate: '2023-09-15', pricePerKg: 6 }
        ];
        localStorage.setItem('jekExcelData', JSON.stringify(excelData));
    }
}

// Change page
function changePage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageName + 'Page').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Update header title
    const titles = {
        'asosiy': 'JEK KARGO',
        'buyurtmalar': 'Buyurtmalar',
        'chatlar': 'Chatlar',
        'profil': 'Profil'
    };
    document.getElementById('pageTitle').textContent = titles[pageName];
    
    // Load page-specific data
    if (pageName === 'buyurtmalar') {
        loadTrackingNumbers();
    } else if (pageName === 'profil') {
        updateProfile();
    }
}

// Show address overlay
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

// Copy address
function copyAddress() {
    navigator.clipboard.writeText(currentAddress).then(() => {
        alert('Manzil nusxalandi! ✅');
    }).catch(() => {
        alert('Nusxalashda xatolik yuz berdi');
    });
}

// Show topshirish punktlari
function showTopshirish() {
    document.getElementById('topshirishOverlay').classList.add('active');
}

// Show pochta bepul
function showPochtaBepul() {
    document.getElementById('pochtaOverlay').classList.add('active');
}

// Show calculator (as overlay simulating new page)
function showCalculator() {
    document.getElementById('calculatorOverlay').classList.add('active');
    document.getElementById('calcResult').innerHTML = '';
}

// Close overlay
function closeOverlay() {
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.classList.remove('active');
    });
}

// Calculate price
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
        if (parts.length === 3) {
            maxDim = Math.max(...parts);
        }
    }
    
    const isHighRate = (items >= 5) || (maxDim > 50);
    const baseRate = service === 'avia' ? settings.aviaPrice : settings.avtoPrice;
    const rate = isHighRate ? (service === 'avia' ? 11 : 7.5) : baseRate;
    const totalUSD = (rate * weight).toFixed(2);
    const totalUZS = Math.round(rate * weight * settings.dollarRate).toLocaleString('uz-UZ');
    
    const reason = isHighRate ? '<small style="color:#f57c00;display:block;margin-top:5px;">(Yuqori narx: ko\'p dona yoki katta o\'lcham)</small>' : '';
    let resultHTML = `
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

// Add tracking numbers
function addTrackNumbers() {
    const input = document.getElementById('trackInput').value.trim();
    if (!input) {
        alert('Trek raqam kiriting!');
        return;
    }
    const codes = input.split(',').map(c => c.trim().toUpperCase()).filter(c => c);

    // Add to user's tracking numbers (avoid duplicates)
    codes.forEach(code => {
        if (!currentUser.trackingNumbers.includes(code)) {
            currentUser.trackingNumbers.push(code);
        }
    });

    saveUserData();
    loadTrackingNumbers();
    document.getElementById('trackInput').value = '';
    alert(`${codes.length} ta trek raqam qo'shildi! ✅`);
}

// Load tracking numbers
function loadTrackingNumbers() {
    const container = document.getElementById('trackList');
    if (currentUser.trackingNumbers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <p>Hali trek raqamlar yo'q</p>
            </div>
        `;
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

// Delete tracking number
function deleteTrackNumber(index) {
    if (confirm('Bu trek raqamni o\'chirmoqchimisiz?')) {
        currentUser.trackingNumbers.splice(index, 1);
        saveUserData();
        loadTrackingNumbers();
    }
}

// Show track details
function showTrackDetails(code) {
    const trackData = excelData.find(item => item.trackingCode === code);
    if (!trackData) {
        document.getElementById('trackDetails').innerHTML = `
            <div style="text-align:center;padding:20px;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:#ff9800;margin-bottom:15px;"></i>
                <h3 style="color:var(--primary-color);margin-bottom:10px;">Ma'lumot topilmadi</h3>
                <p style="color:#666;">Trek raqam: <strong>${code}</strong></p>
                <p style="color:#666;margin-top:10px;">Bu trek raqam hali tizimga kiritilmagan. Iltimos, keyinroq urinib ko'ring.</p>
            </div>
        `;
    } else {
        const cost = Math.round(trackData.weight * trackData.pricePerKg * settings.dollarRate);
        const delivery = calculateDeliveryDate(trackData.receiptDate, trackData.type);
        
        let statusClass = 'status-waiting';
        let statusText = 'Kutilmoqda';
        
        if (trackData.receiptDate) {
            const daysSince = Math.floor((new Date() - new Date(trackData.receiptDate)) / (1000 * 60 * 60 * 24));
            if (daysSince < 3) {
                statusClass = 'status-transit';
                statusText = 'Yo\'lda';
            } else if (daysSince >= 14) {
                statusClass = 'status-arrived';
                statusText = 'Yetib keldi';
            } else {
                statusClass = 'status-transit';
                statusText = 'Yo\'lda';
            }
        }
        
        document.getElementById('trackDetails').innerHTML = `
            <div style="text-align:center;margin-bottom:20px;">
                <h2 style="color:var(--primary-color);">${code}</h2>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
            <div class="detail-row">
                <span class="label">Turi:</span>
                <span class="value">${trackData.type}</span>
            </div>
            <div class="detail-row">
                <span class="label">Reys:</span>
                <span class="value">${trackData.flight}</span>
            </div>
            <div class="detail-row">
                <span class="label">Og'irlik:</span>
                <span class="value">${trackData.weight} kg</span>
            </div>
            <div class="detail-row">
                <span class="label">Qabul sanasi:</span>
                <span class="value">${trackData.receiptDate || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="label">Narx:</span>
                <span class="value">${cost.toLocaleString('uz-UZ')} so'm</span>
            </div>
            <div class="detail-row">
                <span class="label">Taxminiy yetib kelish:</span>
                <span class="value">${delivery}</span>
            </div>
        `;
    }

    document.getElementById('trackDetailsOverlay').classList.add('active');
}

// Calculate delivery date
function calculateDeliveryDate(dateStr, type) {
    if (!dateStr) return 'Noma\'lum';
    const date = new Date(dateStr);
    const min = type === 'Avia' ? 3 : 14;
    const max = type === 'Avia' ? 5 : 18;
    const minDate = new Date(date);
    minDate.setDate(date.getDate() + min);
    const maxDate = new Date(date);
    maxDate.setDate(date.getDate() + max);
    return `${minDate.toLocaleDateString('uz-UZ')} - ${maxDate.toLocaleDateString('uz-UZ')}`;
}

// Send message (saves to localStorage for admin to see later)
function sendMessage() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        alert('Xabar yozing!');
        return;
    }

    const messageData = {
        userId: currentUser.id,
        message: message,
        timestamp: new Date().toLocaleString('uz-UZ')
    };

    // Load existing messages
    let messages = JSON.parse(localStorage.getItem('jekClientMessages') || '[]');
    messages.unshift(messageData);
    localStorage.setItem('jekClientMessages', JSON.stringify(messages));

    document.getElementById('messageText').value = '';
    alert('Xabar yuborildi! Admin tez orada javob beradi. ✅');
}

// Open admin chat in Telegram
function openAdminChat() {
    if (window.Telegram && window.Telegram.WebApp) {
        Telegram.WebApp.openTelegramLink('https://t.me/jekkargo');
    } else {
        window.open('https://t.me/jekkargo', '_blank');
    }
}

// Close overlays when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('overlay')) {
        closeOverlay();
    }
});
