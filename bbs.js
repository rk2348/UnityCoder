document.addEventListener('DOMContentLoaded', function() {
    // 1. 初期データの読み込みと表示
    loadAndRenderPosts();

    // 2. モーダルの開閉制御
    const modal = document.getElementById('postModal');
    const openBtn = document.getElementById('openPostModalBtn');
    const closeBtn = document.getElementById('closeModalBtn');

    openBtn.addEventListener('click', () => {
        // ログインチェック
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (isLoggedIn !== 'true') {
            if(confirm("投稿するにはログインが必要です。\nログインページへ移動しますか？")) {
                window.location.href = 'login.html';
            }
            return;
        }
        modal.classList.add('active');
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    // モーダルの外側をクリックしたら閉じる
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // 3. 新規投稿の処理
    const postForm = document.getElementById('postForm');
    postForm.addEventListener('submit', function(e) {
        e.preventDefault();
        createNewPost();
    });
});

// カテゴリ名の日本語変換マップ
const categoryMap = {
    'beginner': { label: '🔰 初心者質問', class: 'cat-beginner' },
    'tech':     { label: '🔧 技術相談',   class: 'cat-tech' },
    'bug':      { label: '🐛 バグ報告',   class: 'cat-bug' },
    'chat':     { label: '☕ 雑談',       class: 'cat-chat' }
};

// 投稿データのロードと表示
function loadAndRenderPosts() {
    // ローカルストレージから取得、なければデフォルトデータを使用
    let posts = JSON.parse(localStorage.getItem('bbsPosts'));

    if (!posts || posts.length === 0) {
        posts = getDefaultPosts();
        localStorage.setItem('bbsPosts', JSON.stringify(posts));
    }

    const container = document.getElementById('threadList');
    container.innerHTML = ''; // クリア

    // 新しい順に表示したいので配列を逆順にするか、unshiftで追加する設計にする
    // ここでは単純にループします
    posts.forEach(post => {
        const catInfo = categoryMap[post.category] || categoryMap['chat'];
        
        const html = `
            <div class="thread-card">
                <div class="thread-meta">
                    <span class="category-tag ${catInfo.class}">${catInfo.label}</span>
                    <span class="author">👤 ${post.author}</span>
                    <span class="date">${post.date}</span>
                </div>
                <h3 class="thread-title">${escapeHTML(post.title)}</h3>
                <p class="thread-body">${escapeHTML(post.body).replace(/\n/g, '<br>')}</p>
                <div class="thread-footer">
                    <span>💬 コメント (${post.comments})</span>
                    <button style="border:none; background:none; color:#007acc; cursor:pointer;">詳細を見る &gt;</button>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('afterbegin', html); // 新しいものを上に
    });
}

// 新規投稿作成
function createNewPost() {
    const titleInput = document.getElementById('postTitle');
    const catInput = document.getElementById('postCategory');
    const bodyInput = document.getElementById('postBody');

    // ログイン中のユーザー名を取得 (auth.jsで保存したもの)
    const userName = localStorage.getItem('userName') || '名無しユーザー';
    
    // 日付フォーマット
    const now = new Date();
    const dateStr = `${now.getFullYear()}/${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;

    const newPost = {
        id: Date.now(), // ユニークID
        title: titleInput.value,
        category: catInput.value,
        body: bodyInput.value,
        author: userName,
        date: dateStr,
        comments: 0
    };

    // 保存
    let posts = JSON.parse(localStorage.getItem('bbsPosts')) || [];
    posts.push(newPost);
    localStorage.setItem('bbsPosts', JSON.stringify(posts));

    // フォームリセットとモーダル閉じる
    titleInput.value = '';
    bodyInput.value = '';
    document.getElementById('postModal').classList.remove('active');

    // 再描画
    loadAndRenderPosts();
    alert("投稿しました！");
}

// XSS対策（HTMLエスケープ）
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag]));
}

// 初期データ（初回アクセス時用）
function getDefaultPosts() {
    return [
        {
            id: 1,
            title: "Unityのインストールが終わらない",
            category: "beginner",
            body: "Unity Hubからインストールしようとしているのですが、検証中のまま止まってしまいます。解決策はありますか？",
            author: "初心者A",
            date: "2025/11/20 10:30",
            comments: 2
        },
        {
            id: 2,
            title: "C#の配列とリストの違いについて",
            category: "tech",
            body: "ゲーム制作において、ArrayとListはどう使い分ければ良いのでしょうか？敵キャラの管理に使いたいです。",
            author: "DevTaro",
            date: "2025/11/21 15:45",
            comments: 5
        },
        {
            id: 3,
            title: "新しいコースが楽しすぎる！",
            category: "chat",
            body: "シューティングゲームのコースを終えました。次はRPGコースに挑戦します。運営さんありがとう！",
            author: "GamerX",
            date: "2025/11/22 09:12",
            comments: 0
        }
    ];
}

// デバッグ用：データをリセットする関数
function clearBBS() {
    if(confirm("掲示板のデータを初期化しますか？")) {
        localStorage.removeItem('bbsPosts');
        location.reload();
    }
}