/* --- script.js (設定復旧版: unitycoder + 全機能統合) --- */

// 1. Firebase v12.6.0 のインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit, where, updateDoc, increment } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// 2. Firebase設定 (unitycoder に戻しました)
const firebaseConfig = {
  apiKey: "AIzaSyAmeB2GKyDCv177vgI1oe6z_R-wFyCD2Us",
  authDomain: "unitycoder.firebaseapp.com",
  projectId: "unitycoder",
  storageBucket: "unitycoder.firebasestorage.app",
  messagingSenderId: "763752037328",
  appId: "1:763752037328:web:78d2714e0dcfd938f757d5",
  measurementId: "G-G9JZT2Y9MR"
};

// 3. Discord Webhook URL
const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1445488372771455018/V8SAVsok2-uTa3Xt_g4ZJv8qXo-lKfPg_pkiEv7f144Tl9OuZqBhxQUt18a8edpQ56fr"; 

// 4. アプリ起動
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 5. 問題データ (静的データ)
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

// Discord通知機能
async function sendDiscordNotification(username) {
    if (!DISCORD_WEBHOOK_URL) return;
    const message = {
        content: `🎉 **新しいユーザーが登録しました！**\nユーザー名: **${username}**\n素晴らしいUnity学習の旅が始まります！`
    };
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message)
        });
    } catch (e) { console.error("Discord通知エラー:", e); }
}

// Discordお問い合わせ送信機能
async function sendDiscordMessage(content, embed = null) {
    if (!DISCORD_WEBHOOK_URL) return;
    const body = { content: content };
    if (embed) body.embeds = [embed];
    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    } catch (e) { console.error("Discord通知エラー:", e); }
}

document.addEventListener('DOMContentLoaded', async () => {

    /* =================================================================
       A. ログイン状態の監視 & 共通UI
       ================================================================= */
    onAuthStateChanged(auth, async (user) => {
        const userActions = document.querySelector('.user-actions');
        const userBox = document.querySelector('.user-box');
        
        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            
            // 1. ヘッダー更新
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

            // 2. サイドバー更新
            if(userBox) {
                userBox.innerHTML = `
                    <p>ようこそ<br><strong style="font-size:1.1rem;">${displayName}</strong> さん</p>
                    <div style="font-size:0.9rem; color:#666; margin:10px 0;">今日も学習を頑張りましょう！</div>
                    <button id="sidebarLogoutBtn" class="btn-primary" style="width:100%; font-size:0.85rem; background:#666;">ログアウト</button>
                `;
                document.getElementById('sidebarLogoutBtn').addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) signOut(auth).then(() => location.reload());
                });
            }

            // 3. 問題一覧の回答済みマーク (✅)
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
                                    link.parentElement.parentElement.style.backgroundColor = "#f0fff4"; 
                                }
                            }
                        }
                    });
                } catch (e) { console.error(e); }
            }

        } else {
            // ログアウト時
            if(userActions) {
                userActions.innerHTML = `<a href="login.html" class="btn-login">ログイン</a> <a href="signup.html" class="btn-signup">新規登録</a>`;
            }
            if(userBox) {
                userBox.innerHTML = `<p>学習履歴を保存するには<br>ログインしてください</p><a href="login.html" class="btn-login" style="display:block; margin-bottom:10px;">ログイン</a><a href="signup.html" style="font-size:0.85rem; color:#007acc;">アカウント作成</a>`;
            }
        }
    });

    /* =================================================================
       B. 掲示板 (BBS) 機能
       ================================================================= */
    const bbsTable = document.querySelector('#bbsTable tbody');
    if (bbsTable) {
        // スレッド一覧
        bbsTable.innerHTML = '<tr><td colspan="4">読み込み中...</td></tr>';
        try {
            const q = query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(20));
            const querySnapshot = await getDocs(q);
            
            bbsTable.innerHTML = ''; 
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "-";
                
                let catBadge = `<span style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px;">その他</span>`;
                if(data.category === "question") catBadge = `<span style="font-size:0.8rem; background:#e3f2fd; color:#0d47a1; padding:2px 6px; border-radius:4px;">質問</span>`;
                if(data.category === "chat") catBadge = `<span style="font-size:0.8rem; background:#f3e5f5; color:#4a148c; padding:2px 6px; border-radius:4px;">雑談</span>`;
                if(data.category === "bug") catBadge = `<span style="font-size:0.8rem; background:#ffebee; color:#b71c1c; padding:2px 6px; border-radius:4px;">バグ報告</span>`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><a href="#" class="thread-link" style="font-weight:bold; color:#007acc;">${data.title}</a><div style="font-size:0.85rem; color:#666; margin-top:4px;">${data.content.substring(0, 30)}...</div></td>
                    <td>${catBadge}</td>
                    <td>${data.authorName}</td>
                    <td><span style="font-size:0.85rem; color:#666;">${date}</span></td>
                `;

                // 詳細表示クリック
                const link = tr.querySelector('.thread-link');
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    openViewThreadModal(data, date);
                });

                bbsTable.appendChild(tr);
            });

            if (querySnapshot.empty) {
                bbsTable.innerHTML = '<tr><td colspan="4">スレッドがありません。最初の投稿者になりましょう！</td></tr>';
            }
        } catch(e) {
            console.error(e);
            bbsTable.innerHTML = '<tr><td colspan="4">読み込みに失敗しました。</td></tr>';
        }

        // モーダル制御
        const createModal = document.getElementById('threadModal');
        const viewModal = document.getElementById('viewThreadModal');
        const newThreadBtn = document.getElementById('newThreadBtn');
        const cancelBtn = document.getElementById('cancelThreadBtn');
        const submitThreadBtn = document.getElementById('submitThreadBtn');

        function openViewThreadModal(data, dateStr) {
            if(!viewModal) return;
            document.getElementById('viewThreadTitle').textContent = data.title;
            document.getElementById('viewThreadAuthor').textContent = data.authorName;
            document.getElementById('viewThreadDate').textContent = dateStr;
            document.getElementById('viewThreadBody').textContent = data.content;
            
            const catLabel = document.getElementById('viewThreadCategory');
            if (data.category === 'question') { catLabel.textContent = "質問"; catLabel.style.background = "#0d47a1"; }
            else if (data.category === 'chat') { catLabel.textContent = "雑談"; catLabel.style.background = "#4a148c"; }
            else if (data.category === 'bug') { catLabel.textContent = "バグ報告"; catLabel.style.background = "#b71c1c"; }
            else { catLabel.textContent = "その他"; catLabel.style.background = "#888"; }
            
            viewModal.style.display = "flex";
        }
        
        if (newThreadBtn && createModal) {
            newThreadBtn.addEventListener('click', () => {
                if(!auth.currentUser) { alert("投稿するにはログインしてください"); window.location.href="login.html"; return; }
                createModal.style.display = "flex";
            });
            cancelBtn.addEventListener('click', () => createModal.style.display = "none");
            document.getElementById('closeCreateModalX')?.addEventListener('click', () => createModal.style.display = "none");
        }

        if (viewModal) {
            document.getElementById('closeViewBtnMain')?.addEventListener('click', () => viewModal.style.display = "none");
            document.getElementById('closeViewModalX')?.addEventListener('click', () => viewModal.style.display = "none");
        }

        if (submitThreadBtn) {
            submitThreadBtn.addEventListener('click', async () => {
                const user = auth.currentUser;
                if(!user) return;
                const title = document.getElementById('threadTitle').value;
                const category = document.getElementById('threadCategory').value;
                const content = document.getElementById('threadContent').value;
                if (!title || !content) { alert("タイトルと内容を入力してください"); return; }

                submitThreadBtn.disabled = true;
                submitThreadBtn.textContent = "投稿中...";

                try {
                    await addDoc(collection(db, "threads"), {
                        title: title, category: category, content: content,
                        authorName: user.displayName || user.email.split('@')[0],
                        uid: user.uid, createdAt: new Date(), replyCount: 0
                    });
                    alert("スレッドを作成しました！");
                    createModal.style.display = "none";
                    location.reload(); 
                } catch(e) {
                    console.error(e);
                    alert("投稿失敗: " + e.message);
                    submitThreadBtn.disabled = false;
                    submitThreadBtn.textContent = "投稿する";
                }
            });
        }
    }

    /* =================================================================
       C. 問題作成ページ
       ================================================================= */
    const saveProblemBtn = document.getElementById('saveProblemBtn');
    if (saveProblemBtn) {
        saveProblemBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if (!user) { alert("問題を投稿するにはログインが必要です"); window.location.href = "login.html"; return; }

            try {
                const title = document.getElementById('new_title').value;
                const difficulty = document.getElementById('new_difficulty').value;
                const category = document.getElementById('new_category').value;
                const description = document.getElementById('new_description').value;

                let initialCode = "";
                if (window.editorCreate) { initialCode = window.editorCreate.getValue(); }
                else if (typeof ace !== 'undefined' && document.getElementById('editor_create')) { initialCode = ace.edit("editor_create").getValue(); }

                let modelAnswer = "";
                if (window.editorModel) { modelAnswer = window.editorModel.getValue(); }
                else if (typeof ace !== 'undefined' && document.getElementById('editor_model')) { modelAnswer = ace.edit("editor_model").getValue(); }

                if(!title || !description) { alert("タイトルと問題文は必須です"); return; }

                saveProblemBtn.disabled = true;
                saveProblemBtn.textContent = "保存中...";

                const authorName = user.displayName || user.email.split('@')[0];

                await addDoc(collection(db, "problems"), {
                    title: title, difficulty: difficulty, category: category, description: description,
                    initialCode: initialCode, modelAnswer: modelAnswer, score: 100,
                    timeLimit: "2 sec", memoryLimit: "1024 MB", constraints: "<ul><li>ユーザー投稿問題</li></ul>",
                    inputExample: "-", outputExample: "-", author: authorName, uid: user.uid, createdAt: new Date()
                });
                alert("問題を公開しました！");
                window.location.href = "problemlist.html";

            } catch (e) {
                console.error("保存エラー:", e);
                alert("保存失敗: " + e.message);
                saveProblemBtn.disabled = false;
                saveProblemBtn.textContent = "この内容で公開する";
            }
        });
    }

    /* =================================================================
       D. 問題詳細ページ
       ================================================================= */
    const problemTitleElement = document.getElementById('p_title');
    if (problemTitleElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('id');
        
        if (problemId) {
            const problem = staticProblems.find(p => p.id === problemId);
            if (problem) {
                renderProblem(problem, problemId);
            } else {
                const problemRef = doc(db, "problems", problemId);
                getDoc(problemRef).then(docSnap => {
                    if (docSnap.exists()) {
                        renderProblem(docSnap.data(), docSnap.id);
                    } else {
                        problemTitleElement.textContent = "問題が見つかりません";
                    }
                });
            }
        }
    }

    function renderProblem(p, id) {
        document.title = `${p.title} | Unity Learning`;
        document.getElementById('p_title').textContent = p.title;
        if(document.getElementById('p_time')) document.getElementById('p_time').textContent = p.timeLimit;
        if(document.getElementById('p_memory')) document.getElementById('p_memory').textContent = p.memoryLimit;
        if(document.getElementById('p_score')) document.getElementById('p_score').textContent = p.score;
        if(document.getElementById('p_display_id')) document.getElementById('p_display_id').textContent = id;
        document.getElementById('p_description').innerHTML = p.description;
        if(document.getElementById('p_constraints')) document.getElementById('p_constraints').innerHTML = p.constraints || "-";
        if(document.getElementById('p_input')) document.getElementById('p_input').textContent = p.inputExample || "-";
        if(document.getElementById('p_output')) document.getElementById('p_output').textContent = p.outputExample || "-";
        
        if (document.getElementById('editor')) {
            const editor = ace.edit("editor");
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/csharp");
            editor.setFontSize(14);
            editor.setValue(p.initialCode || "", -1);
        }

        const solvers = p.solvedCount || 0;
        const attempts = p.attemptCount || 0;
        const accuracy = attempts > 0 ? ((solvers / attempts) * 100).toFixed(1) : 0;
        if(document.getElementById('p_solvers')) document.getElementById('p_solvers').textContent = `${solvers} 人`;
        if(document.getElementById('p_accuracy')) document.getElementById('p_accuracy').textContent = `${accuracy} %`;
    }

    // 提出ボタン
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if(!user) return alert("ログインしてください");
            
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('id');
            
            let modelAnswer = "";
            let problem = staticProblems.find(p => p.id === problemId);
            
            if (problem) {
                modelAnswer = ""; 
            } else {
                const docSnap = await getDoc(doc(db, "problems", problemId));
                if(docSnap.exists()) {
                    modelAnswer = docSnap.data().modelAnswer || "";
                }
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";

            setTimeout(async () => {
                const editor = ace.edit("editor");
                const userCode = editor.getValue().replace(/\s/g, "");
                const cleanModel = modelAnswer.replace(/\s/g, "");

                let isCorrect = false;
                if (cleanModel) {
                    isCorrect = (userCode === cleanModel);
                } else {
                    isCorrect = Math.random() > 0.3; 
                }

                let hasSolved = false;
                try {
                    const q = query(collection(db, "submissions"), where("uid", "==", user.uid), where("problemId", "==", problemId), where("result", "==", "AC"));
                    const snap = await getDocs(q);
                    if (!snap.empty) hasSolved = true;
                } catch(e){}

                if (isCorrect) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    try {
                        const name = user.displayName || user.email.split('@')[0];
                        await addDoc(collection(db, "submissions"), {
                            username: name, uid: user.uid, problemId: problemId, result: "AC", score: 100, submittedAt: new Date()
                        });
                        if (!problemId.startsWith("prob_")) {
                            const pRef = doc(db, "problems", problemId);
                            const upData = { attemptCount: increment(1) };
                            if(!hasSolved) upData.solvedCount = increment(1);
                            await updateDoc(pRef, upData);
                        }
                        alert("正解！記録を保存しました。");
                    } catch(e) { console.error(e); }
                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    if (!problemId.startsWith("prob_")) {
                        try { await updateDoc(doc(db, "problems", problemId), { attemptCount: increment(1) }); } catch(e){}
                    }
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

    /* =================================================================
       E. ユーザー登録 & ログイン
       ================================================================= */
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
                await sendDiscordNotification(username);
                alert("登録完了！"); window.location.href = "index.html";
            } catch (err) { alert("登録エラー: " + err.message); }
        });
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            signInWithEmailAndPassword(auth, email, pass)
                .then(() => { alert("ログイン成功！"); window.location.href = "index.html"; })
                .catch(() => alert("ログイン失敗"));
        });
    }

    /* =================================================================
       F. ランキング表示
       ================================================================= */
    const rankingTableBody = document.querySelector('.ranking-table tbody');
    if (rankingTableBody) {
        rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み中...</td></tr>';
        onAuthStateChanged(auth, async (user) => {
            try {
                const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(50));
                const snap = await getDocs(q);
                rankingTableBody.innerHTML = '';
                let rank = 1, myRank = null, myScore = 0;
                snap.forEach(doc => {
                    const d = doc.data();
                    const date = d.submittedAt ? new Date(d.submittedAt.seconds*1000).toLocaleDateString() : "-";
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td align="center"><strong>${rank}</strong></td><td>${d.username}</td><td>${d.score}</td><td>${d.problemId}</td><td>${date}</td>`;
                    rankingTableBody.appendChild(tr);
                    if(user && d.uid === user.uid) { myRank = rank; myScore = d.score; }
                    rank++;
                });
                if(snap.empty) rankingTableBody.innerHTML = '<tr><td colspan="5">データなし</td></tr>';
                if(document.getElementById('my-rank-area')) {
                     document.getElementById('my-rank-area').innerHTML = myRank ? 
                     `<div style="text-align:center;"><div style="font-size:0.9rem; color:#666;">最新提出順位</div><div style="font-size:2rem; font-weight:bold; color:#007acc;">${myRank} <span style="font-size:1rem;">位</span></div></div>` : 
                     `<p>まだ提出データがありません。</p>`;
                }
            } catch(e) { rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み失敗</td></tr>'; }
        });
    }

    /* =================================================================
       G. お問い合わせ送信
       ================================================================= */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sendBtn = document.getElementById('sendContactBtn');
            sendBtn.disabled = true; sendBtn.textContent = "送信中...";
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value || "なし";
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;
            await sendDiscordMessage(null, {
                title: `📩 お問い合わせ: ${subject}`, color: 3447003,
                fields: [{name:"氏名",value:name},{name:"Mail",value:email},{name:"内容",value:message}]
            });
            alert("送信しました"); contactForm.reset(); sendBtn.disabled=false; sendBtn.textContent="送信する";
        });
    }

    /* =================================================================
       H. 問題一覧の検索フィルタ
       ================================================================= */
    const searchInput = document.getElementById('problemSearch');
    if (searchInput) {
        const rows = document.querySelectorAll('#problemTable tbody tr');
        const filter = () => {
            const key = searchInput.value.toLowerCase().trim();
            const diff = document.getElementById('difficultyFilter').value;
            const cat = document.getElementById('categoryFilter').value;
            rows.forEach(row => {
                const diffSpan = row.cells[0].querySelector('span');
                const titleText = row.cells[1].textContent.toLowerCase();
                const categoryText = row.cells[2].textContent;

                let rowDiff = "all";
                if (diffSpan && diffSpan.classList.contains('diff-gray')) rowDiff = "gray";
                else if (diffSpan && diffSpan.classList.contains('diff-green')) rowDiff = "green";
                else if (diffSpan && diffSpan.classList.contains('diff-cyan')) rowDiff = "cyan";
                else if (diffSpan && diffSpan.classList.contains('diff-blue')) rowDiff = "blue";

                const matchKeyword = titleText.includes(key);
                const matchDiff = (diff === "all") || (diff === rowDiff);
                const matchCat = (cat === "all") || (cat === categoryText) || (cat === "C#" && categoryText.includes("C#"));
                row.style.display = (matchKeyword && matchDiff && matchCat) ? "" : "none";
            });
        };
        searchInput.addEventListener('input', filter);
        document.getElementById('difficultyFilter').addEventListener('change', filter);
        document.getElementById('categoryFilter').addEventListener('change', filter);
        document.querySelector('.filter-box button').addEventListener('click', filter);
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