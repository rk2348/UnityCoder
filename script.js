/* --- script.js (エラーメッセージ日本語化版) --- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, doc, query, orderBy, limit, where, updateDoc, increment } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { problemsData } from "./problems_data.js";

// あなたのFirebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAUsbrJkcXRE9N5V5R4Ze3cwnrXJJPN92Q",
  authDomain: "unitycoder-65ff6.firebaseapp.com",
  projectId: "unitycoder-65ff6",
  storageBucket: "unitycoder-65ff6.firebasestorage.app",
  messagingSenderId: "85233576566",
  appId: "1:85233576566:web:756718f4b30c08134dcd57",
  measurementId: "G-FM0BEDSBH8"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

const DISCORD_WEBHOOK_URL = ""; 

async function sendDiscordNotification(username) {
    if (!DISCORD_WEBHOOK_URL) return;
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: `🎉 **新規ユーザー登録: ${username}**` })
        });
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', async () => {

    /* --- A. ログイン状態監視 --- */
    onAuthStateChanged(auth, async (user) => {
        const userActions = document.querySelector('.user-actions');
        const userBox = document.querySelector('.user-box');
        
        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            
            if(userActions) {
                userActions.innerHTML = `
                    <span style="font-size:0.9rem; margin-right:10px;">User: <strong>${displayName}</strong></span>
                    <a href="create_problem.html" style="font-size:0.85rem; margin-right:10px; color:#007acc;">問題作成</a>
                    <a href="#" id="logoutBtn" style="font-size:0.85rem; color:#888;">ログアウト</a>
                `;
                document.getElementById('logoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            }

            if(userBox) {
                userBox.innerHTML = `
                    <p>ようこそ<br><strong>${displayName}</strong> さん</p>
                    <button id="sidebarLogoutBtn" class="btn-primary" style="width:100%; font-size:0.85rem; background:#666;">ログアウト</button>
                `;
                document.getElementById('sidebarLogoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            }

            const problemTable = document.getElementById('problemTable');
            if (problemTable) {
                try {
                    const q = query(collection(db, "submissions"), where("uid", "==", user.uid), where("result", "==", "AC"));
                    const snapshot = await getDocs(q);
                    const solvedIds = new Set();
                    snapshot.forEach(d => solvedIds.add(d.data().problemId));
                    
                    problemTable.querySelectorAll('a').forEach(link => {
                        const href = link.getAttribute('href');
                        if(href && href.includes('id=')) {
                            const pId = href.split('id=')[1];
                            if(solvedIds.has(pId)) {
                                link.innerHTML = `✅ ${link.innerHTML}`;
                                link.closest('tr').style.backgroundColor = "#f0fff4";
                            }
                        }
                    });
                } catch(e) { console.error(e); }
            }

        } else {
            if(userActions) userActions.innerHTML = `<a href="login.html" class="btn-login">ログイン</a> <a href="signup.html" class="btn-signup">新規登録</a>`;
            if(userBox) userBox.innerHTML = `<p>学習履歴を保存するには<br>ログインしてください</p><a href="login.html" class="btn-login" style="display:block;">ログイン</a>`;
        }
    });

    /* --- B. 掲示板 (BBS) --- */
    const bbsTable = document.querySelector('#bbsTable tbody');
    if (bbsTable) {
        const loadThreads = async () => {
            bbsTable.innerHTML = '<tr><td colspan="4">読み込み中...</td></tr>';
            try {
                const q = query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(20));
                const snapshot = await getDocs(q);
                
                bbsTable.innerHTML = '';
                if(snapshot.empty) {
                    bbsTable.innerHTML = '<tr><td colspan="4">まだ投稿がありません。一番乗りしましょう！</td></tr>';
                    return;
                }

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "-";
                    let badge = `<span style="background:#eee; padding:2px 6px; font-size:0.8rem; border-radius:4px;">その他</span>`;
                    if(data.category === "question") badge = `<span style="background:#e3f2fd; color:#0d47a1; padding:2px 6px; font-size:0.8rem; border-radius:4px;">質問</span>`;
                    if(data.category === "chat") badge = `<span style="background:#f3e5f5; color:#4a148c; padding:2px 6px; font-size:0.8rem; border-radius:4px;">雑談</span>`;
                    if(data.category === "bug") badge = `<span style="background:#ffebee; color:#b71c1c; padding:2px 6px; font-size:0.8rem; border-radius:4px;">バグ報告</span>`;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><div style="font-weight:bold;">${data.title}</div><div style="font-size:0.85rem; color:#666;">${data.content.substring(0, 40)}...</div></td>
                        <td>${badge}</td>
                        <td>${data.authorName}</td>
                        <td><span style="font-size:0.85rem; color:#666;">${date}</span></td>
                    `;
                    bbsTable.appendChild(tr);
                });
            } catch(e) {
                console.error(e);
                bbsTable.innerHTML = '<tr><td colspan="4">読み込みエラー。コンソールを確認してください。</td></tr>';
            }
        };
        loadThreads();

        const submitThreadBtn = document.getElementById('submitThreadBtn');
        if (submitThreadBtn) {
            submitThreadBtn.addEventListener('click', async () => {
                const user = auth.currentUser;
                if(!user) return alert("投稿するにはログインが必要です");

                const title = document.getElementById('threadTitle').value;
                const category = document.getElementById('threadCategory').value;
                const content = document.getElementById('threadContent').value;

                if(!title || !content) return alert("タイトルと内容を入力してください");

                submitThreadBtn.disabled = true;
                submitThreadBtn.textContent = "送信中...";

                try {
                    await addDoc(collection(db, "threads"), {
                        title: title, category: category, content: content,
                        authorName: user.displayName || "名無し", uid: user.uid, createdAt: new Date()
                    });
                    alert("投稿しました！");
                    location.reload();
                } catch(e) {
                    console.error(e);
                    alert("投稿エラー: " + e.message);
                    submitThreadBtn.disabled = false;
                    submitThreadBtn.textContent = "投稿する";
                }
            });
        }

        const modal = document.getElementById('threadModal');
        const newBtn = document.getElementById('newThreadBtn');
        const cancelBtn = document.getElementById('cancelThreadBtn');
        if(newBtn) newBtn.addEventListener('click', () => {
            if(!auth.currentUser) return alert("ログインしてください");
            modal.style.display = "flex";
        });
        if(cancelBtn) cancelBtn.addEventListener('click', () => modal.style.display = "none");
    }

    /* --- C. ユーザー登録 (エラーハンドリング強化) --- */
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;
            
            try {
                const credential = await createUserWithEmailAndPassword(auth, email, pass);
                await updateProfile(credential.user, { displayName: name });
                await sendDiscordNotification(name);
                
                alert("登録完了！ようこそ " + name + " さん");
                window.location.href = "index.html";
            } catch(e) {
                // ここでエラーの種類を判定して日本語のメッセージを出します
                console.error(e);
                if (e.code === 'auth/email-already-in-use') {
                    alert("このメールアドレスは既に登録されています。\nログインページからログインしてください。");
                    window.location.href = "login.html"; // ログインページへ誘導
                } else if (e.code === 'auth/weak-password') {
                    alert("パスワードが短すぎます。6文字以上にしてください。");
                } else {
                    alert("登録エラー: " + e.message);
                }
            }
        });
    }

    /* --- D. ログイン --- */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            
            signInWithEmailAndPassword(auth, email, pass)
                .then(() => {
                    alert("ログイン成功！");
                    window.location.href = "index.html";
                })
                .catch(e => {
                    console.error(e);
                    alert("ログイン失敗: メールアドレスかパスワードが違います");
                });
        });
    }

    /* --- E. 問題提出 --- */
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if(!user) return alert("ログインしてください");
            
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('id');
            const problem = problemsData.find(p => p.id === problemId);
            if(!problem) return;

            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";

            setTimeout(async () => {
                const editor = ace.edit("editor");
                const userCode = editor.getValue().replace(/\s/g, "");
                const modelCode = (problem.modelAnswer || "").replace(/\s/g, "");

                const isCorrect = (userCode === modelCode);

                if(isCorrect) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    try {
                        await addDoc(collection(db, "submissions"), {
                            uid: user.uid, username: user.displayName || "名無し",
                            problemId: problemId, result: "AC", score: 100, submittedAt: new Date()
                        });
                        alert("正解！記録を保存しました。");
                    } catch(e) { console.error(e); }
                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    alert("不正解です...模範解答と一致しません。");
                }
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "提出する";
                    submitBtn.style.backgroundColor = "";
                }, 3000);
            }, 1000);
        });
    }
    
    /* --- F. 問題詳細表示 --- */
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('id');
    if (problemId && document.getElementById('p_title')) {
        const problem = problemsData.find(p => p.id === problemId);
        if(problem) {
            document.title = `${problem.title} | Unity Learning`;
            document.getElementById('p_title').textContent = problem.title;
            document.getElementById('p_time').textContent = problem.timeLimit;
            document.getElementById('p_memory').textContent = problem.memoryLimit;
            document.getElementById('p_score').textContent = problem.score;
            document.getElementById('p_description').innerHTML = problem.description;
            if(document.getElementById('p_constraints')) document.getElementById('p_constraints').innerHTML = problem.constraints || "-";
            if(document.getElementById('p_input')) document.getElementById('p_input').textContent = problem.inputExample || "-";
            if(document.getElementById('p_output')) document.getElementById('p_output').textContent = problem.outputExample || "-";
            if (document.getElementById('editor') && window.ace) {
                const editor = ace.edit("editor");
                editor.setTheme("ace/theme/monokai");
                editor.session.setMode("ace/mode/csharp");
                editor.setValue(problem.initialCode || "", -1);
            }
        }
    }
});