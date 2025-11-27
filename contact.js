document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const statusMessage = document.getElementById('statusMessage');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    // メッセージの表示をリセット
    function resetStatus() {
        statusMessage.classList.add('hidden');
        statusMessage.classList.remove('success', 'error');
        statusMessage.textContent = '';
    }

    // メッセージを表示するヘルパー関数
    function displayStatus(type, message) {
        resetStatus();
        statusMessage.classList.remove('hidden');
        statusMessage.classList.add(type);
        statusMessage.textContent = message;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault(); // フォームのデフォルト送信をキャンセル

        resetStatus();

        // 簡易的なクライアントサイドバリデーション
        if (!nameInput.value || !emailInput.value || !messageInput.value) {
            displayStatus('error', '❌ すべての必須項目（名前、メールアドレス、お問い合わせ内容）を入力してください。');
            return;
        }

        // ここから非同期送信処理（今回はシミュレーション）
        
        // フォームデータを取得 (実際の送信ではFormDataを使う)
        const formData = {
            name: nameInput.value,
            email: emailInput.value,
            category: document.getElementById('category').value,
            message: messageInput.value
        };

        // サーバーへの送信をシミュレート (3秒待機)
        displayStatus('success', '送信中です... しばらくお待ちください。');
        
        setTimeout(() => {
            // ここで実際には fetch() や XMLHttpRequest を使ってサーバーにデータを送ります。
            
            // サーバーからの応答をシミュレート
            const isSuccess = Math.random() < 0.9; // 90%の確率で成功と仮定

            if (isSuccess) {
                displayStatus('success', '✅ お問い合わせを受け付けました。ありがとうございます。');
                form.reset(); // フォームをクリア
                // 成功メッセージはそのまま残す
            } else {
                displayStatus('error', '⚠️ 送信中にエラーが発生しました。時間をおいて再度お試しください。');
            }

        }, 3000);
    });
});