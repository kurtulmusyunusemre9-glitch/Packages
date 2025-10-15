// Paket satın alma fonksiyonu - Ödeme sayfasını yeni sekmede aç
function buyPackage(packageType) {
    // Ödeme sayfasını yeni sekmede aç
    window.open(`payment.html?package=${packageType}`, '_blank');
}

// Özel sipariş fonksiyonu
function customOrder() {
    const message = 'Merhaba! Özel video düzenleme hizmeti almak istiyorum.';
    const whatsappURL = `https://wa.me/905309577415?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
}

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
