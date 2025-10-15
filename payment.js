// Discord OAuth Config
// Discord OAuth Config
const DISCORD_CONFIG = {
    clientId: '1423310486581018764',
    clientSecret: 'uSflECAYWNXANKo7T9Xong0wrpfvHFqB', // ✅ Bu hazır
    redirectUri: window.location.origin + window.location.pathname,
    scope: 'identify email'
};

// EmailJS Config
const EMAILJS_CONFIG = {
    serviceID: 'service_14h7lkj',
    templateID: 'template_BURAYA', // Template ID'nizi ekleyin
    publicKey: 'BURAYA' // Public Key'inizi ekleyin
};

let currentUser = null;
let selectedPackage = null;
let selectedPaymentMethod = null;
let selectedBank = null;

// Sayfa yüklendiğinde
window.addEventListener('DOMContentLoaded', function() {
    // EmailJS init
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
    }
    
    // Paket bilgisini al
    const urlParams = new URLSearchParams(window.location.search);
    const packageType = urlParams.get('package');
    
    const packages = {
        'basic': {
            name: 'Temel XML Paketi',
            price: '₺25',
            priceNum: 25,
            folder: 'basic'
        },
        'premium': {
            name: 'Premium XML Paketi',
            price: '₺50',
            priceNum: 50,
            folder: 'premium'
        },
        'pro': {
            name: 'Pro XML Paketi',
            price: '₺100',
            priceNum: 100,
            folder: 'pro'
        }
    };
    
    if (packageType && packages[packageType]) {
        selectedPackage = packages[packageType];
        document.getElementById('selectedPackageName').textContent = selectedPackage.name;
        document.getElementById('selectedPackagePrice').textContent = selectedPackage.price;
        document.getElementById('finalPrice').textContent = selectedPackage.price;
    }
    
    // Discord callback kontrol et
    checkDiscordCallback();
    
    // Form event listeners
    setupFormListeners();
});

// Discord ile giriş
function loginWithDiscord() {
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CONFIG.clientId}&redirect_uri=${encodeURIComponent(DISCORD_CONFIG.redirectUri)}&response_type=code&scope=${DISCORD_CONFIG.scope}`;
    window.location.href = authUrl;
}

// Discord callback kontrol
async function checkDiscordCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        try {
            // Token al
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    client_id: DISCORD_CONFIG.clientId,
                    client_secret: 'BOT_CLIENT_SECRET', // Discord'dan alınacak
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: DISCORD_CONFIG.redirectUri,
                })
            });
            
            const tokenData = await tokenResponse.json();
            
            // Kullanıcı bilgilerini al
            const userResponse = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`
                }
            });
            
            const userData = await userResponse.json();
            
            currentUser = {
                id: userData.id,
                username: userData.username,
                discriminator: userData.discriminator,
                email: userData.email,
                avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null
            };
            
            showUserInfo();
            
            // URL'den code'u temizle
            window.history.replaceState({}, document.title, window.location.pathname + (selectedPackage ? `?package=${Object.keys({basic: selectedPackage.folder === 'basic', premium: selectedPackage.folder === 'premium', pro: selectedPackage.folder === 'pro'}).find(key => eval(key))}` : ''));
            
        } catch (error) {
            console.error('Discord OAuth hatası:', error);
            alert('Discord girişinde hata oluştu. Tekrar deneyin.');
        }
    }
}

// Kullanıcı bilgilerini göster
function showUserInfo() {
    document.getElementById('userName').textContent = currentUser.username;
    document.getElementById('userDiscord').textContent = `${currentUser.username}#${currentUser.discriminator}`;
    document.getElementById('userEmail').textContent = currentUser.email || 'Email bulunamadı';
    
    if (currentUser.avatar) {
        document.getElementById('userAvatar').src = currentUser.avatar;
    } else {
        document.getElementById('userAvatar').src = 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
    
    // Discord login gizle, user info göster
    document.querySelector('.discord-login').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    
    // Ödeme bölümünü göster
    document.getElementById('paymentSection').style.display = 'block';
    
    // Smooth scroll
    setTimeout(() => {
        document.getElementById('paymentSection').scrollIntoView({
            behavior: 'smooth'
        });
    }, 500);
}

// Çıkış yap
function signOut() {
    currentUser = null;
    
    document.querySelector('.discord-login').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('paymentSection').style.display = 'none';
}

// Form listeners setup
function setupFormListeners() {
    // Kart formatları
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedInputValue = value.match(/.{1,4}/g)?.join(' ') || '';
            e.target.value = formattedInputValue;
        });
    }
    
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0,2) + '/' + value.substring(2,4);
            }
            e.target.value = value;
        });
    }
    
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
    
    // Payment form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                alert('Lütfen önce Discord ile giriş yapın!');
                return;
            }
            
            const cardNumber = document.getElementById('cardNumber').value;
            const expiry = document.getElementById('expiry').value;
            const cvv = document.getElementById('cvv').value;
            const cardName = document.getElementById('cardName').value;
            
            if (!cardNumber || !expiry || !cvv || !cardName) {
                alert('Lütfen tüm alanları doldurun!');
                return;
            }
            
            processPayment();
        });
    }
}

// XML packages
const xmlPackages = {
    'basic': [
        'Mux_Basic_Transitions.xml',
        'Mux_Text_Animations.xml', 
        'Mux_Color_Pack.xml'
    ],
    'premium': [
        'Mux_Premium_Transitions.xml',
        'Mux_Advanced_Text.xml',
        'Mux_Motion_Graphics.xml',
        'Mux_Sound_Effects.xml'
    ],
    'pro': [
        'Mux_Pro_Complete.xml',
        'Mux_Cinema_Pack.xml',
        'Mux_3D_Effects.xml',
        'Mux_Professional_Suite.xml'
    ]
};

// Ödeme yöntemi seçimi
function selectPaymentMethod(method) {
    // Tüm check işaretlerini temizle
    document.querySelectorAll('.method-check').forEach(check => {
        check.innerHTML = '';
        check.parentElement.classList.remove('selected');
    });
    
    // Seçilen yöntemi işaretle
    const checkElement = document.getElementById(`check-${method}`);
    checkElement.innerHTML = '✅';
    checkElement.parentElement.classList.add('selected');
    
    selectedPaymentMethod = method;
    
    // Tüm formları gizle
    document.getElementById('cardForm').style.display = 'none';
    document.getElementById('bankForm').style.display = 'none';
    document.getElementById('paypalForm').style.display = 'none';
    
    // Seçilen formu göster
    document.getElementById(`${method}Form`).style.display = 'block';
    
    // Fiyatları güncelle
    updatePrices();
    
    // PayPal QR kodu oluştur
    if (method === 'paypal') {
        generatePayPalQR();
    }
}

// Banka seçimi
function selectBank(bankName) {
    // Önceki seçimi temizle
    document.querySelectorAll('.bank-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Yeni seçimi işaretle
    const bankOption = document.querySelector(`[onclick="selectBank('${bankName}')"]`);
    bankOption.classList.add('selected');
    
    selectedBank = bankName;
}

// Fiyatları güncelle
function updatePrices() {
    if (selectedPackage) {
        document.getElementById('finalPrice').textContent = selectedPackage.price;
        document.getElementById('finalPriceBank').textContent = selectedPackage.price;
        document.getElementById('finalPricePaypal').textContent = selectedPackage.price;
    }
}

// PayPal QR kodu oluştur
function generatePayPalQR() {
    const qrContainer = document.getElementById('paypalQR');
    const amount = selectedPackage.priceNum;
    const currency = 'TRY';
    
    // Basit QR kodu görsel oluştur
    qrContainer.innerHTML = `
        <div class="qr-visual">
            <div class="qr-pattern">
                <div class="qr-squares">
                    ${generateQRPattern()}
                </div>
            </div>
            <p>PayPal QR - ${selectedPackage.price}</p>
        </div>
    `;
}

// QR kod deseni oluştur
function generateQRPattern() {
    let pattern = '';
    for (let i = 0; i < 25; i++) {
        const filled = Math.random() > 0.5;
        pattern += `<div class="qr-square ${filled ? 'filled' : ''}"></div>`;
    }
    return pattern;
}

// PayPal ödeme kontrolü
function checkPaypalPayment() {
    const payButton = document.querySelector('#paypalForm .pay-button');
    payButton.textContent = 'Kontrol Ediliyor...';
    payButton.disabled = true;
    
    // Simüle edilmiş kontrol
    setTimeout(() => {
        processPayment('paypal');
    }, 3000);
}

// Process payment - güncellenmiş versiyon
function processPayment(paymentType = selectedPaymentMethod) {
    if (!currentUser) {
        alert('Lütfen önce Discord ile giriş yapın!');
        return;
    }
    
    if (!selectedPaymentMethod && !paymentType) {
        alert('Lütfen bir ödeme yöntemi seçin!');
        return;
    }
    
    const method = paymentType || selectedPaymentMethod;
    let payButton;
    
    // Ödeme türüne göre button seç
    switch(method) {
        case 'card':
            // Kart bilgilerini kontrol et
            const cardNumber = document.getElementById('cardNumber').value;
            const expiry = document.getElementById('expiry').value;
            const cvv = document.getElementById('cvv').value;
            const cardName = document.getElementById('cardName').value;
            
            if (!cardNumber || !expiry || !cvv || !cardName) {
                alert('Lütfen tüm kart bilgilerini doldurun!');
                return;
            }
            payButton = document.querySelector('#cardForm .pay-button');
            break;
        case 'bank':
            if (!selectedBank) {
                alert('Lütfen bir banka seçin!');
                return;
            }
            payButton = document.querySelector('#bankForm .pay-button');
            // Banka sayfasına yönlendir
            setTimeout(() => {
                alert(`${getBankName(selectedBank)} internet bankacılığına yönlendiriliyorsunuz...`);
                // Gerçek uygulamada banka URL'sine yönlendirilir
            }, 1000);
            break;
        case 'paypal':
            payButton = document.querySelector('#paypalForm .pay-button');
            break;
    }
    
    if (payButton) {
        payButton.textContent = 'İşleniyor...';
        payButton.disabled = true;
    }
    
    setTimeout(() => {
        // Admin paneline kayıt ekle
        if (window.addSaleRecord) {
            window.addSaleRecord({
                customerName: currentUser.username,
                email: currentUser.email || `${currentUser.username}#${currentUser.discriminator}`,
                package: selectedPackage.name,
                amount: selectedPackage.priceNum,
                paymentMethod: method,
                bank: selectedBank || null
            });
        }
        
        showSuccessModal();
        createDownloadSection();
    }, 2000);
}

// Banka adını getir
function getBankName(bankCode) {
    const bankNames = {
        'garanti': 'Garanti BBVA',
        'isbank': 'İş Bankası',
        'akbank': 'Akbank',
        'yapikredi': 'Yapı Kredi',
        'halkbank': 'Halkbank',
        'ziraat': 'Ziraat Bankası'
    };
    return bankNames[bankCode] || bankCode;
}

// Download section oluştur
function createDownloadSection() {
    const packageFiles = xmlPackages[selectedPackage.folder] || [];
    
    const downloadHTML = `
        <div class="download-section">
            <h3>📦 XML Dosyalarınız</h3>
            <p>Dosyalarınız hazır! İndirmeye başlayabilirsiniz:</p>
            <div class="download-links">
                ${packageFiles.map(file => `
                    <a href="xmls/${selectedPackage.folder}/${file}" download="${file}" class="download-link">
                        📄 ${file}
                    </a>
                `).join('')}
            </div>
            <p style="margin-top: 1rem; color: #ccc; font-size: 0.9rem;">
                💡 İyi editler! Discord'dan destek alabilirsiniz.
            </p>
        </div>
    `;
    
    document.getElementById('downloadSection').innerHTML = downloadHTML;
}

function showSuccessModal() {
    document.getElementById('deliveryEmail').textContent = currentUser.email || 'Discord hesabınız';
    document.getElementById('successModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('successModal').style.display = 'none';
    window.location.href = '../index.html';
}
