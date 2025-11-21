const form = document.getElementById('contactForm');
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1441276862784602155/Q-SaH_5mSFYOYSn3TjZ5XWk7wvAkXTFv5dsQiSLyDR_M-xcZ9IYSgZJwu3jtCISUcYXl"; // Webhook URLをここに

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const message = document.getElementById('message').value;

    // メールアドレスを送らずに通知することで最低限の安全性
    const payload = {
        content: `**新しいお問い合わせ**\n**名前:** ${name}\n**内容:** ${message}`
    };

    try {
        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('送信が完了しました。ありがとうございます！');
            form.reset();
        } else {
            alert('送信に失敗しました。');
        }
    } catch (error) {
        console.error(error);
        alert('送信中にエラーが発生しました。');
    }
});
