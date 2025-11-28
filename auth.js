document.addEventListener('DOMContentLoaded', function() {
    
    // 1. ページ読み込み時にログイン状態をチェック
    checkLoginState();

    // 2. ログインフォームがあればイベントを設定 (login.html用)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault(); // 本来の送信をキャンセル
            handleLogin();
        });
    }
});

// ログイン処理を行う関数
function handleLogin() {
    const emailInput = document.getElementById('email').value;
    const passwordInput = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // 本来はここでサーバーと通信して認証します
    // 今回はデモ用として、特定の値ならOKとします
    // (何も入力しなくてもログインできるようにする場合はここを削除して setItem だけにします)
    
    if (emailInput === "test@example.com" && passwordInput === "password") {
        // ★ここでログイン状態をブラウザに保存します
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userName', 'Unityユーザー'); // ユーザー名も保存してみる

        alert("ログインしました！");
        window.location.href = 'index.html'; // トップページへ移動
    } else {
        errorMessage.textContent = "メールアドレスまたはパスワードが違います。(test@example.com / password で試してください)";
    }
}

// ログアウト処理
function handleLogout() {
    if(confirm("ログアウトしますか？")) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        alert("ログアウトしました");
        window.location.reload(); // ページを再読み込みして表示を更新
    }
}

// 画面表示をログイン状態に合わせて切り替える関数
function checkLoginState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const authLink = document.getElementById('authLink');

    if (authLink) {
        if (isLoggedIn === 'true') {
            // ログイン中の場合
            const userName = localStorage.getItem('userName') || "ユーザー";
            
            // リンクの文字と挙動を変更
            authLink.textContent = "ログアウト (" + userName + ")";
            authLink.href = "#"; // ページ遷移させない
            authLink.addEventListener('click', function(e) {
                e.preventDefault();
                handleLogout();
            });
            
            // 必要であれば「マイページ」などのリンクを追加するなど、
            // DOM操作でヘッダーを書き換えることも可能です
        } else {
            // ログアウト状態の場合（デフォルトのまま）
            authLink.textContent = "ログイン";
            authLink.href = "login.html";
        }
    }
}