/* --- script.js (ログイン機能＆ランキング保存 完成版) --- */

// 1. Firebaseの機能を読み込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. あなたのFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAmeB2GKyDCv177vgI1oe6z_R-wFyCD2Us",
  authDomain: "unitycoder.firebaseapp.com",
  projectId: "unitycoder",
  storageBucket: "unitycoder.firebasestorage.app",
  messagingSenderId: "763752037328",
  appId: "1:763752037328:web:78d2714e0dcfd938f757d5",
  measurementId: "G-G9JZT2Y9MR"
};

// 3. アプリ起動
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // ログイン機能の起動

document.addEventListener('DOMContentLoaded', async () => {

    /* --- A. ログイン状態の監視 --- */
    onAuthStateChanged(auth, (user) => {
        const userActions = document.querySelector('.user-actions');
        if (userActions) {
            if (user) {
                // ログイン中
                const shortName = user.email.split('@')[0];
                userActions.innerHTML = `
                    <span style="font-size:0.9rem; margin-right:10px;">User: <strong>${shortName}</strong></span>
                    <a href="create_problem.html" style="font-size:0.85rem; margin-right:10px; color:#007acc;">問題作成</a>
                    <a href="#" id="logoutBtn" style="font-size:0.85rem; color:#888;">ログアウト</a>
                `;
                document.getElementById('logoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            } else {
                // ログアウト中
                userActions.innerHTML = `
                    <a href="login.html" class="btn-login">ログイン</a>
                    <a href="signup.html" class="btn-signup">新規登録</a>
                `;
            }
        }
    });

    /* --- B. 新規登録処理 --- */
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            createUserWithEmailAndPassword(auth, email, pass)
                .then(() => { alert("登録完了！"); window.location.href = "index.html"; })
                .catch((err) => alert("エラー: " + err.message));
        });
    }

    /* --- C. ログイン処理 --- */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            signInWithEmailAndPassword(auth, email, pass)
                .then(() => { alert("ログイン成功！"); window.location.href = "index.html"; })
                .catch(() => alert("ログイン失敗: メールかパスワードが違います"));
        });
    }

    /* --- D. 提出ボタン --- */
    const submitBtn = document.getElementById('submitBtn');
    let editor;
    if (document.getElementById('editor')) {
        editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/csharp");
        editor.setFontSize(14);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = auth.currentUser; // 現在のユーザーを取得
            if (!user) {
                alert("ログインしてください！");
                window.location.href = "login.html";
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";
            
            setTimeout(async () => {
                const isCorrect = Math.random() > 0.3;
                if (isCorrect) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    try {
                        const shortName = user.email.split('@')[0];
                        await addDoc(collection(db, "submissions"), {
                            username: shortName,
                            uid: user.uid,
                            problemId: new URLSearchParams(window.location.search).get('id') || "unknown",
                            result: "AC",
                            score: 100,
                            submittedAt: new Date()
                        });
                        alert("正解！スコアを保存しました。");
                    } catch (e) { console.error(e); }
                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    alert("不正解です...");
                }
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "提出する";
                    submitBtn.style.backgroundColor = "";
                }, 3000);
            }, 1500);
        });
    }

    /* --- E. ランキング表示 --- */
    const rankingTableBody = document.querySelector('.ranking-table tbody');
    if (rankingTableBody) {
        rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み中...</td></tr>';
        try {
            const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(20));
            const querySnapshot = await getDocs(q);
            rankingTableBody.innerHTML = '';
            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toLocaleDateString() : "-";
                const tr = document.createElement('tr');
                tr.innerHTML = `<td align="center"><strong>${rank++}</strong></td><td>${data.username}</td><td>${data.score}</td><td>${data.problemId}</td><td>${date}</td>`;
                rankingTableBody.appendChild(tr);
            });
            if (querySnapshot.empty) rankingTableBody.innerHTML = '<tr><td colspan="5">データなし</td></tr>';
        } catch (e) { rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み失敗</td></tr>'; }
    }
    
    // コースフィルタ（変更なし）
    const filterBtns = document.querySelectorAll('.filter-btn-group button');
    const courseCards = document.querySelectorAll('.course-card');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => { b.style.background = 'transparent'; b.style.color = '#555'; });
                btn.style.background = '#007acc'; btn.style.color = '#fff'; btn.style.borderRadius = '20px';
                const f = btn.dataset.filter;
                courseCards.forEach(c => {
                    if(f==='all' || c.dataset.category===f) c.style.display='block'; else c.style.display='none';
                });
            });
        });
        filterBtns[0].click();
    }
});