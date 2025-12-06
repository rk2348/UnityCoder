// js/auth.js
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { auth, db } from "./config.js";

export function initAuth() {
    // あなたの管理者UID（Firebaseコンソールで確認したもの）
    const ADMIN_UID = "rOUZuT60UrRS94HgrlSNDyAViit2"; 

    onAuthStateChanged(auth, async (user) => {
        // --- セキュリティチェック ---
        // 問題作成ページにいて、かつ管理者でない（または未ログイン）場合はトップへ戻す
        if (window.location.pathname.includes("create_problem.html")) {
            if (!user || user.uid !== ADMIN_UID) {
                alert("権限がありません。");
                window.location.href = "index.html";
                return; 
            }
        }

        // --- UI更新処理 ---
        const userActions = document.querySelector('.user-actions');
        const userBox = document.querySelector('.user-box');
        
        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            
            // 管理者のみ「問題作成」リンクを表示
            const createLinkHtml = (user.uid === ADMIN_UID) 
                ? `<a href="create_problem.html" style="font-size:0.85rem; margin-right:10px; color:#007acc;">問題作成</a>` 
                : ``;

            if(userActions) {
                userActions.innerHTML = `
                    <span style="font-size:0.9rem; margin-right:10px;">User: <strong>${escapeHtml(displayName)}</strong></span>
                    ${createLinkHtml}
                    <a href="#" id="logoutBtn" style="font-size:0.85rem; color:#888;">ログアウト</a>
                `;
                document.getElementById('logoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            }

            if(userBox) {
                userBox.innerHTML = `
                    <p>ようこそ<br><strong style="font-size:1.1rem;">${escapeHtml(displayName)}</strong> さん</p>
                    <div style="font-size:0.9rem; color:#666; margin:10px 0;">今日も学習を頑張りましょう！</div>
                    <button id="sidebarLogoutBtn" class="btn-primary" style="width:100%; font-size:0.85rem; background:#666;">ログアウト</button>
                `;
                document.getElementById('sidebarLogoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            }

            updateSolvedStatus(user);

        } else {
            // 未ログイン時
            if(userActions) userActions.innerHTML = `<a href="login.html" class="btn-login">ログイン</a> <a href="signup.html" class="btn-signup">新規登録</a>`;
            if(userBox) userBox.innerHTML = `<p>学習履歴を保存するには<br>ログインしてください</p><a href="login.html" class="btn-login" style="display:block; margin-bottom:10px;">ログイン</a><a href="signup.html" style="font-size:0.85rem; color:#007acc;">アカウント作成</a>`;
        }
    });

    // --- イベントリスナーの設定 ---
    
    // 新規登録フォーム
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            try {
                const credential = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(credential.user, { displayName: username });
                alert("登録完了！"); window.location.href = "index.html";
            } catch (err) { alert("登録エラー: " + err.message); }
        });
    }
    
    // ログインフォーム
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            signInWithEmailAndPassword(auth, email, pass)
                .then(() => { alert("ログイン成功！"); window.location.href = "index.html"; })
                .catch((e) => {
                    console.error(e);
                    alert("ログイン失敗: メールアドレスかパスワードを確認してください");
                });
        });
    }
}

// XSS対策用エスケープ関数
function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

async function updateSolvedStatus(user) {
    const problemTable = document.getElementById('problemTable');
    if (problemTable) {
        try {
            const q = query(collection(db, "submissions"), where("uid", "==", user.uid), where("result", "==", "AC"));
            const querySnapshot = await getDocs(q);
            const solvedProblemIds = new Set();
            querySnapshot.forEach((doc) => solvedProblemIds.add(doc.data().problemId));

            const links = problemTable.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.includes('id=')) {
                    const pId = href.split('id=')[1];
                    if (solvedProblemIds.has(pId)) {
                        if (!link.innerHTML.includes('✅')) { 
                            link.innerHTML = `<span style="color:#5cb85c; margin-right:5px;">✅</span> ${link.innerHTML}`;
                            link.closest('tr').style.backgroundColor = "#f0fff4"; 
                        }
                    }
                }
            });
        } catch (e) { console.error(e); }
    }
}