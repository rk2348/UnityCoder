/* --- script.js (完全版: 掲示板 + 学習機能 + コミュニティ機能統合) --- */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit, where, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ★追加: 問題データを外部ファイルからインポート
import { problemsData } from "./problems_data.js";

// 1. Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyAmeB2GKyDCv177vgI1oe6z_R-wFyCD2Us",
  authDomain: "unitycoder.firebaseapp.com",
  projectId: "unitycoder",
  storageBucket: "unitycoder.firebasestorage.app",
  messagingSenderId: "763752037328",
  appId: "1:763752037328:web:78d2714e0dcfd938f757d5",
  measurementId: "G-G9JZT2Y9MR"
};

// 2. Discord Webhook URL
const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1445488372771455018/V8SAVsok2-uTa3Xt_g4ZJv8qXo-lKfPg_pkiEv7f144Tl9OuZqBhxQUt18a8edpQ56fr"; 

// 3. アプリ起動
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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

document.addEventListener('DOMContentLoaded', async () => {

    /* =================================================================
       A. ログイン状態の監視 & 共通UI更新
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
                                link.innerHTML = `<span style="color:#5cb85c; margin-right:5px;">✅</span> ${link.innerHTML}`;
                                link.parentElement.parentElement.style.backgroundColor = "#f0fff4"; 
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
        // 1. スレッド一覧の読み込み
        bbsTable.innerHTML = '<tr><td colspan="4">読み込み中...</td></tr>';
        try {
            const q = query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(20));
            const querySnapshot = await getDocs(q);
            
            bbsTable.innerHTML = ''; // クリア
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "-";
                
                // カテゴリバッジ
                let catBadge = `<span style="font-size:0.8rem; background:#eee; padding:2px 6px; border-radius:4px;">その他</span>`;
                if(data.category === "question") catBadge = `<span style="font-size:0.8rem; background:#e3f2fd; color:#0d47a1; padding:2px 6px; border-radius:4px;">質問</span>`;
                if(data.category === "chat") catBadge = `<span style="font-size:0.8rem; background:#f3e5f5; color:#4a148c; padding:2px 6px; border-radius:4px;">雑談</span>`;
                if(data.category === "bug") catBadge = `<span style="font-size:0.8rem; background:#ffebee; color:#b71c1c; padding:2px 6px; border-radius:4px;">バグ報告</span>`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><a href="#" style="font-weight:bold;">${data.title}</a><div style="font-size:0.85rem; color:#666; margin-top:4px;">${data.content.substring(0, 30)}...</div></td>
                    <td>${catBadge}</td>
                    <td>${data.authorName}</td>
                    <td><span style="font-size:0.85rem; color:#666;">${date}</span></td>
                `;
                bbsTable.appendChild(tr);
            });

            if (querySnapshot.empty) {
                bbsTable.innerHTML = '<tr><td colspan="4">スレッドがありません。最初の投稿者になりましょう！</td></tr>';
            }
        } catch(e) {
            console.error(e);
            bbsTable.innerHTML = '<tr><td colspan="4">読み込みに失敗しました。</td></tr>';
        }

        // 2. モーダル制御
        const modal = document.getElementById('threadModal');
        const newThreadBtn = document.getElementById('newThreadBtn');
        const cancelBtn = document.getElementById('cancelThreadBtn');
        
        if (newThreadBtn && modal) {
            newThreadBtn.addEventListener('click', () => {
                const user = auth.currentUser;
                if(!user) { alert("投稿するにはログインしてください"); window.location.href="login.html"; return; }
                modal.style.display = "flex";
            });
            cancelBtn.addEventListener('click', () => {
                modal.style.display = "none";
            });
        }

        // 3. スレッド投稿処理
        const submitThreadBtn = document.getElementById('submitThreadBtn');
        if (submitThreadBtn) {
            submitThreadBtn.addEventListener('click', async () => {
                const user = auth.currentUser;
                if(!user) return;

                const title = document.getElementById('threadTitle').value;
                const category = document.getElementById('threadCategory').value;
                const content = document.getElementById('threadContent').value;

                if (!title || !content) {
                    alert("タイトルと内容を入力してください");
                    return;
                }

                submitThreadBtn.disabled = true;
                submitThreadBtn.textContent = "投稿中...";

                try {
                    await addDoc(collection(db, "threads"), {
                        title: title,
                        category: category,
                        content: content,
                        authorName: user.displayName || user.email.split('@')[0],
                        uid: user.uid,
                        createdAt: new Date(),
                        replyCount: 0
                    });
                    alert("スレッドを作成しました！");
                    modal.style.display = "none";
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
            if (!user) {
                alert("問題を投稿するにはログインが必要です");
                window.location.href = "login.html";
                return;
            }

            // 各入力欄の値を取得
            const title = document.getElementById('new_title').value;
            const difficulty = document.getElementById('new_difficulty').value;
            const category = document.getElementById('new_category').value;
            const description = document.getElementById('new_description').value;

            // 初期コードエディタの値を取得
            const editorCreate = ace.edit("editor_create");
            const initialCode = editorCreate.getValue();
            
            // 模範解答エディタの値を取得
            const editorModel = ace.edit("editor_model"); 
            const modelAnswer = editorModel.getValue();

            // 必須項目のチェック
            if(!title || !description) {
                alert("タイトルと問題文は必須です");
                return;
            }

            saveProblemBtn.disabled = true;
            saveProblemBtn.textContent = "保存中...";

            try {
                // Firebaseに保存
                await addDoc(collection(db, "problems"), {
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
                    author: user.displayName || user.email.split('@')[0],
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

    /* =================================================================
       D. 問題詳細ページ
       ================================================================= */
    const problemTitleElement = document.getElementById('p_title');
    if (problemTitleElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('id');
        
        if (problemId) {
            // 1. 静的データ検索 (★変更: problemsData を使用)
            const problem = problemsData.find(p => p.id === problemId);
            
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
                // 2. Firebaseから取得 (投稿問題)
                const problemRef = doc(db, "problems", problemId);
                getDoc(problemRef).then(docSnap => {
                    if (docSnap.exists()) {
                        const p = docSnap.data();
                        document.title = `${p.title} | Unity Learning`;
                        document.getElementById('p_title').textContent = p.title;
                        document.getElementById('p_description').innerHTML = p.description;
                        if(document.getElementById('editor')) {
                            const editor = ace.edit("editor");
                            editor.setTheme("ace/theme/monokai");
                            editor.session.setMode("ace/mode/csharp");
                            editor.setFontSize(14);
                            editor.setValue(p.initialCode || "", -1);
                        }
                        // 統計情報の表示
                        const solvers = p.solvedCount || 0;
                        const attempts = p.attemptCount || 0;
                        const accuracy = attempts > 0 ? ((solvers / attempts) * 100).toFixed(1) : 0;
                        if(document.getElementById('p_solvers')) document.getElementById('p_solvers').textContent = `${solvers} 人`;
                        if(document.getElementById('p_accuracy')) document.getElementById('p_accuracy').textContent = `${accuracy} %`;
                    } else {
                        problemTitleElement.textContent = "問題が見つかりません";
                    }
                });
            }
        }
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
                const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
                const user = userCredential.user;
                await updateProfile(user, { displayName: username });
                await sendDiscordNotification(username);
                alert("登録完了！ようこそ " + username + " さん");
                window.location.href = "index.html";
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
       F. 提出ボタン (正解数カウント + 重複防止)
       ================================================================= */
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = auth.currentUser; 
            if (!user) { alert("ログインしてください！"); window.location.href = "login.html"; return; }

            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('id');

            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";
            
            setTimeout(async () => {
                const isCorrect = Math.random() > 0.3; // 70%正解
                
                // 重複チェック
                let hasSolvedBefore = false;
                try {
                    const q = query(collection(db, "submissions"), where("uid", "==", user.uid), where("problemId", "==", problemId), where("result", "==", "AC"));
                    const snapshot = await getDocs(q);
                    if (!snapshot.empty) hasSolvedBefore = true;
                } catch(e) {}

                if (isCorrect) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    try {
                        const submitterName = user.displayName || user.email.split('@')[0];
                        await addDoc(collection(db, "submissions"), {
                            username: submitterName, uid: user.uid, problemId: problemId, result: "AC", score: 100, submittedAt: new Date()
                        });

                        // 統計情報更新
                        if (problemId && !problemId.startsWith("prob_")) {
                            const problemRef = doc(db, "problems", problemId);
                            const updateData = { attemptCount: increment(1) };
                            if (!hasSolvedBefore) updateData.solvedCount = increment(1);
                            await updateDoc(problemRef, updateData);
                        }
                        alert("正解！スコアを保存しました。");
                    } catch (e) { console.error(e); }
                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    if (problemId && !problemId.startsWith("prob_")) {
                        try {
                            const problemRef = doc(db, "problems", problemId);
                            await updateDoc(problemRef, { attemptCount: increment(1) });
                        } catch(e){}
                    }
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

    /* =================================================================
       G. ランキング表示 & 自分の順位
       ================================================================= */
    const rankingTableBody = document.querySelector('.ranking-table tbody');
    if (rankingTableBody) {
        rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み中...</td></tr>';
        
        onAuthStateChanged(auth, async (user) => {
            try {
                const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(20));
                const querySnapshot = await getDocs(q);
                rankingTableBody.innerHTML = '';
                let rank = 1;
                let myRank = null;
                let myScore = 0;

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const date = data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toLocaleDateString() : "-";
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td align="center"><strong>${rank}</strong></td><td>${data.username}</td><td>${data.score}</td><td>${data.problemId}</td><td>${date}</td>`;
                    rankingTableBody.appendChild(tr);
                    if (user && data.uid === user.uid) { myRank = rank; myScore = data.score; }
                    rank++;
                });

                if (querySnapshot.empty) rankingTableBody.innerHTML = '<tr><td colspan="5">データなし</td></tr>';

                const myRankArea = document.getElementById('my-rank-area');
                if (myRankArea && user) {
                    if (myRank) {
                        myRankArea.innerHTML = `<div style="text-align:center; padding:10px;"><div style="font-size:0.9rem; color:#666;">最新の提出順位</div><div style="font-size:2rem; font-weight:bold; color:#007acc;">${myRank} <span style="font-size:1rem;">位</span></div><div style="font-size:0.9rem; margin-top:5px;">スコア: ${myScore}pt</div></div>`;
                    } else {
                        myRankArea.innerHTML = `<p>まだ提出データがありません。</p>`;
                    }
                } else if (myRankArea) {
                    myRankArea.innerHTML = `<p>ランキングに参加するにはログインしてください。</p>`;
                }
            } catch (e) { console.error(e); rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み失敗</td></tr>'; }
        });
    }

    /* =================================================================
       H. 問題一覧の検索・フィルタリング機能
       ================================================================= */
    const searchInput = document.getElementById('problemSearch');
    const difficultySelect = document.getElementById('difficultyFilter');
    const categorySelect = document.getElementById('categoryFilter');
    const searchBtn = document.querySelector('.filter-box button'); // 検索ボタン
    const problemRows = document.querySelectorAll('#problemTable tbody tr');

    function filterProblems() {
        const keyword = searchInput.value.toLowerCase();
        const difficulty = difficultySelect.value;
        const category = categorySelect.value;

        problemRows.forEach(row => {
            // 各列のテキストを取得
            // 0: 難易度(span), 1: 問題名, 2: カテゴリ
            const diffSpan = row.cells[0].querySelector('span');
            const titleText = row.cells[1].textContent.toLowerCase();
            const categoryText = row.cells[2].textContent;

            // 難易度判定
            let rowDiff = "all";
            if (diffSpan.classList.contains('diff-gray')) rowDiff = "gray";
            else if (diffSpan.classList.contains('diff-green')) rowDiff = "green";
            else if (diffSpan.classList.contains('diff-cyan')) rowDiff = "cyan";
            else if (diffSpan.classList.contains('diff-blue')) rowDiff = "blue";

            // フィルタリング条件
            const matchKeyword = titleText.includes(keyword);
            const matchDiff = (difficulty === "all") || (difficulty === rowDiff);
            const matchCat = (category === "all") || (category === categoryText) || (category === "C#" && categoryText.includes("C#")); // "C#"の場合の部分一致対応

            // 表示・非表示切り替え
            if (matchKeyword && matchDiff && matchCat) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // イベントリスナー設定
    if (searchInput && difficultySelect && categorySelect) {
        // 入力時に即座に検索したい場合は 'input' イベント
        searchInput.addEventListener('input', filterProblems);
        // プルダウン変更時
        difficultySelect.addEventListener('change', filterProblems);
        categorySelect.addEventListener('change', filterProblems);
        // 検索ボタンクリック時（念のため）
        if(searchBtn) searchBtn.addEventListener('click', filterProblems);
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