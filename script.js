/* --- script.js (ユーザー名保存 & メールログイン対応版) --- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// ★ updateProfile を追加しました
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmeB2GKyDCv177vgI1oe6z_R-wFyCD2Us",
  authDomain: "unitycoder.firebaseapp.com",
  projectId: "unitycoder",
  storageBucket: "unitycoder.firebasestorage.app",
  messagingSenderId: "763752037328",
  appId: "1:763752037328:web:78d2714e0dcfd938f757d5",
  measurementId: "G-G9JZT2Y9MR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const staticProblems = [
    {
        id: "prob_001",
        title: "Hello Unity World",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 100,
        description: `<p>Unityのコンソールに「Hello World」と表示するスクリプトを作成してください。</p><p><code>Start</code> メソッド内で <code>Debug.Log</code> を使用してください。</p>`,
        constraints: `<ul><li>表示する文字列は正確に "Hello World" であること。</li></ul>`,
        inputExample: "なし",
        outputExample: "Hello World",
        initialCode: `using UnityEngine;\n\npublic class HelloWorld : MonoBehaviour\n{\n    void Start()\n    {\n        // ここにコードを書いてください\n        \n    }\n}`
    },
    {
        id: "prob_002",
        title: "Cubeの移動",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 100,
        description: `<p><code>Update</code> メソッドを使用して、CubeをX軸方向に移動させてください。</p><p>毎フレーム <code>0.1f</code> ずつ移動させること。</p>`,
        constraints: `<ul><li>Transform.Translate または position を直接操作すること。</li></ul>`,
        inputExample: "なし",
        outputExample: "Cubeのx座標が増加する",
        initialCode: `using UnityEngine;\n\npublic class MoveCube : MonoBehaviour\n{\n    void Update()\n    {\n        // ここにコードを書いてください\n    }\n}`
    },
    {
        id: "prob_003",
        title: "Rigidbody ジャンプ",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 200,
        description: `<p>Rigidbodyを使ってオブジェクトをジャンプさせてください。</p><p>スペースキーが押された瞬間に上方向へ力を加えます。</p>`,
        constraints: `<ul><li>ジャンプ力は 5.0f</li><li>ForceMode.Impulseを使用</li></ul>`,
        inputExample: "Space Key",
        outputExample: "Velocity Y > 0",
        initialCode: `using UnityEngine;\n\npublic class PlayerJump : MonoBehaviour\n{\n    public float jumpForce = 5.0f;\n    private Rigidbody rb;\n\n    void Start()\n    {\n        rb = GetComponent<Rigidbody>();\n    }\n\n    void Update()\n    {\n        // ここにコードを書いてください\n    }\n}`
    }
];

document.addEventListener('DOMContentLoaded', async () => {

    /* --- A. ログイン状態の監視 --- */
    onAuthStateChanged(auth, (user) => {
        // ★ユーザー名を取得 (保存されたdisplayNameを使う。なければメールの頭を使う)
        const displayName = user ? (user.displayName || user.email.split('@')[0]) : "";

        // 1. ヘッダー
        const userActions = document.querySelector('.user-actions');
        if (userActions) {
            if (user) {
                userActions.innerHTML = `
                    <span style="font-size:0.9rem; margin-right:10px;">User: <strong>${displayName}</strong></span>
                    <a href="create_problem.html" style="font-size:0.85rem; margin-right:10px; color:#007acc;">問題作成</a>
                    <a href="#" id="logoutBtn" style="font-size:0.85rem; color:#888;">ログアウト</a>
                `;
                document.getElementById('logoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            } else {
                userActions.innerHTML = `
                    <a href="login.html" class="btn-login">ログイン</a>
                    <a href="signup.html" class="btn-signup">新規登録</a>
                `;
            }
        }

        // 2. サイドバー
        const userBox = document.querySelector('.user-box');
        if (userBox) {
            if (user) {
                userBox.innerHTML = `
                    <p>ようこそ<br><strong style="font-size:1.1rem;">${displayName}</strong> さん</p>
                    <div style="font-size:0.9rem; color:#666; margin:10px 0;">
                        今日も学習を頑張りましょう！
                    </div>
                    <button id="sidebarLogoutBtn" class="btn-primary" style="width:100%; font-size:0.85rem; background:#666;">ログアウト</button>
                `;
                document.getElementById('sidebarLogoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            } else {
                userBox.innerHTML = `
                    <p>学習履歴を保存するには<br>ログインしてください</p>
                    <a href="login.html" class="btn-login" style="display:block; margin-bottom:10px;">ログイン</a>
                    <a href="signup.html" style="font-size:0.85rem; color:#007acc;">アカウント作成</a>
                `;
            }
        }
    });

    /* --- B. 問題作成ページ --- */
    const saveProblemBtn = document.getElementById('saveProblemBtn');
    if (saveProblemBtn) {
        saveProblemBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) {
                alert("問題を投稿するにはログインが必要です");
                window.location.href = "login.html";
                return;
            }

            const title = document.getElementById('new_title').value;
            const difficulty = document.getElementById('new_difficulty').value;
            const category = document.getElementById('new_category').value;
            const description = document.getElementById('new_description').value;
            const editorCreate = ace.edit("editor_create");
            const initialCode = editorCreate.getValue();
            const editorModel = ace.edit("editor_model");
            const modelAnswer = editorModel.getValue();
            
            // ★投稿者名にもdisplayNameを使う
            const authorName = user.displayName || user.email.split('@')[0];

            if(!title || !description) {
                alert("タイトルと問題文は必須です");
                return;
            }

            saveProblemBtn.disabled = true;
            saveProblemBtn.textContent = "保存中...";

            try {
                const docRef = await addDoc(collection(db, "problems"), {
                    title: title,
                    difficulty: difficulty,
                    category: category,
                    description: description,
                    initialCode: initialCode,
                    modelAnswer: modelAnswer,
                    score: 100,
                    timeLimit: "2 sec",
                    memoryLimit: "1024 MB",
                    constraints: "<ul><li>ユーザー投稿問題</li></ul>",
                    inputExample: "-",
                    outputExample: "-",
                    author: authorName, 
                    uid: user.uid,
                    createdAt: new Date()
                });

                alert("問題を公開しました！");
                window.location.href = "problemlist.html";
            } catch (e) {
                console.error(e);
                alert("保存失敗: " + e.message);
                saveProblemBtn.disabled = false;
                saveProblemBtn.textContent = "この内容で公開する";
            }
        });
    }

    /* --- C. 問題詳細ページ --- */
    const problemTitleElement = document.getElementById('p_title');
    if (problemTitleElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('id');
        if (problemId) {
            const problem = staticProblems.find(p => p.id === problemId);
            if (problem) {
                document.title = `${problem.title} | Unity Learning`;
                document.getElementById('p_title').textContent = problem.title;
                document.getElementById('p_time').textContent = problem.timeLimit;
                document.getElementById('p_memory').textContent = problem.memoryLimit;
                document.getElementById('p_score').textContent = problem.score;
                if(document.getElementById('p_display_id')) document.getElementById('p_display_id').textContent = problem.id;
                document.getElementById('p_description').innerHTML = problem.description;
                document.getElementById('p_constraints').innerHTML = problem.constraints;
                document.getElementById('p_input').textContent = problem.inputExample;
                document.getElementById('p_output').textContent = problem.outputExample;

                if (document.getElementById('editor')) {
                    const editor = ace.edit("editor");
                    editor.setTheme("ace/theme/monokai");
                    editor.session.setMode("ace/mode/csharp");
                    editor.setFontSize(14);
                    editor.setValue(problem.initialCode || "", -1);
                }
            } else {
                problemTitleElement.textContent = "問題が見つかりません";
            }
        }
    }

    /* --- D. 新規登録処理 (★修正: プロフィール更新) --- */
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const pass = document.getElementById('signup-password').value;

            try {
                // 1. メールとパスワードでユーザー作成
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;

                // 2. ★ここで「ユーザー名」をFirebaseに登録する！
                await updateProfile(user, {
                    displayName: username
                });

                alert("登録完了！ようこそ " + username + " さん");
                window.location.href = "index.html";

            } catch (err) {
                console.error(err);
                alert("登録エラー: " + err.message);
            }
        });
    }

    /* --- E. ログイン処理 (メールでログイン) --- */
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

    /* --- F. 提出ボタン --- */
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = auth.currentUser; 
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
                        // ★提出者の名前として displayName を使う
                        const submitterName = user.displayName || user.email.split('@')[0];
                        await addDoc(collection(db, "submissions"), {
                            username: submitterName,
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

    /* --- G. ランキング表示 --- */
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
    
    // コースフィルタ
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