/* --- script.js (Firebase対応版) --- */

// 1. Firebaseの機能をインポート
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Firebaseの設定 (★必ず自分の設定値に書き換えてください★)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 3. 初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // データベースを使う準備完了


document.addEventListener('DOMContentLoaded', async () => {

    /* =================================================================
       0. 共通: ログイン状態 (今回は簡易的にlocalStorageのままにします)
       ※ 本格的にやるなら Firebase Authentication を使いますが、まずはDBから。
       ================================================================= */
    const userActions = document.querySelector('.user-actions');
    const savedUser = localStorage.getItem('unityLearningUser');

    if (userActions) {
        if (savedUser) {
            userActions.innerHTML = `
                <span style="font-size:0.9rem; margin-right:10px;">ようこそ, <strong>${savedUser}</strong> さん</span>
                <a href="create_problem.html" style="font-size:0.85rem; margin-right:10px; color:#007acc;">問題作成</a>
                <a href="#" id="logoutBtn" style="font-size:0.85rem; color:#888;">ログアウト</a>
            `;
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if(confirm("ログアウトしますか？")) {
                        localStorage.removeItem('unityLearningUser');
                        window.location.reload();
                    }
                });
            }
        }
    }

    /* =================================================================
       1. 問題作成ページ: Firebaseに保存 (addDoc)
       ================================================================= */
    const saveProblemBtn = document.getElementById('saveProblemBtn');
    
    if (saveProblemBtn) {
        saveProblemBtn.addEventListener('click', async () => {
            const title = document.getElementById('new_title').value;
            const difficulty = document.getElementById('new_difficulty').value;
            const category = document.getElementById('new_category').value;
            const description = document.getElementById('new_description').value;
            
            // Ace Editorから取得 (create_problem.html内で定義されている前提)
            const editorCreate = ace.edit("editor_create");
            const initialCode = editorCreate.getValue();

            if(!title || !description) {
                alert("タイトルと問題文は必須です");
                return;
            }

            saveProblemBtn.disabled = true;
            saveProblemBtn.textContent = "保存中...";

            try {
                // ★ここが変更点: Firebaseの 'problems' コレクションに追加
                const docRef = await addDoc(collection(db, "problems"), {
                    title: title,
                    difficulty: difficulty,
                    category: category,
                    description: description,
                    initialCode: initialCode,
                    score: 100,
                    timeLimit: "2 sec",
                    memoryLimit: "1024 MB",
                    constraints: "<ul><li>ユーザー投稿問題</li></ul>",
                    inputExample: "-",
                    outputExample: "-",
                    author: savedUser || "名無し",
                    createdAt: new Date() // 作成日時
                });

                alert("問題をサーバーに保存しました！ID: " + docRef.id);
                window.location.href = "problemlist.html";

            } catch (e) {
                console.error("Error adding document: ", e);
                alert("保存に失敗しました: " + e.message);
                saveProblemBtn.disabled = false;
                saveProblemBtn.textContent = "公開する（保存）";
            }
        });
    }

    /* =================================================================
       2. 問題一覧ページ: Firebaseから読み込み (getDocs)
       ================================================================= */
    const problemTableBody = document.querySelector('#problemTable tbody');
    
    // 一覧ページの場合のみ実行
    if (problemTableBody) {
        // ★ここが変更点: Firebaseからデータを取得
        // 'problems' コレクションを取得
        const q = query(collection(db, "problems"), orderBy("createdAt", "desc")); // 新しい順
        
        try {
            const querySnapshot = await getDocs(q);
            
            // 取得したデータをテーブルに追加
            querySnapshot.forEach((doc) => {
                const p = doc.data();
                const pId = doc.id; // Firebaseが作ったID

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="diff-circle diff-${p.difficulty}"></span></td>
                    <td><a href="problem_detail.html?id=${pId}">${p.title}</a> <span style="font-size:0.7em; color:#007acc; border:1px solid #007acc; border-radius:3px; padding:0 2px;">投稿</span></td>
                    <td>${p.category}</td>
                    <td>${p.score}</td>
                    <td>-</td>
                `;
                // 既存のリスト（HTMLに書かれたもの）の後ろに追加するなら appendChild
                // 先頭に追加するなら prepend ですが、今回はHTMLに静的な行があるので appendChild します
                problemTableBody.appendChild(tr);
            });
        } catch (e) {
            console.error("Error getting documents: ", e);
            // エラー時は何もしないか、コンソールに出す
        }

        // 検索フィルタ機能 (既存コード流用)
        const searchInput = document.getElementById('problemSearch');
        const difficultySelect = document.getElementById('difficultyFilter');
        const categorySelect = document.getElementById('categoryFilter');

        const filterProblems = () => {
            const keyword = searchInput.value.toLowerCase().trim();
            const difficulty = difficultySelect.value;
            const category = categorySelect.value;
            const rows = problemTableBody.querySelectorAll('tr');

            rows.forEach(row => {
                const titleCell = row.cells[1];
                const categoryCell = row.cells[2];
                const diffSpan = row.cells[0].querySelector('span');
                if (!titleCell || !categoryCell || !diffSpan) return;

                const titleText = titleCell.textContent.toLowerCase();
                const categoryText = categoryCell.textContent;
                
                let diffType = "all";
                if (diffSpan.classList.contains('diff-gray')) diffType = "gray";
                if (diffSpan.classList.contains('diff-green')) diffType = "green";
                if (diffSpan.classList.contains('diff-cyan')) diffType = "cyan";
                if (diffSpan.classList.contains('diff-blue')) diffType = "blue";

                let isMatch = true;
                if (keyword && !titleText.includes(keyword)) isMatch = false;
                if (difficulty !== "all" && difficulty !== diffType) isMatch = false;
                if (category !== "all" && !categoryText.includes(category)) isMatch = false;

                row.style.display = isMatch ? '' : 'none';
            });
        };
        
        if(searchInput) {
            searchInput.addEventListener('input', filterProblems);
            difficultySelect.addEventListener('change', filterProblems);
            categorySelect.addEventListener('change', filterProblems);
        }
    }


    /* =================================================================
       3. 問題詳細ページ: Firebaseから個別データ取得 (getDoc)
       ================================================================= */
    const problemTitleElement = document.getElementById('p_title');
    const submitBtn = document.getElementById('submitBtn');
    let editor;

    const getParam = (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    };

    if (problemTitleElement) {
        const problemId = getParam('id');

        // ★IDのパターンで取得先を分岐
        // prob_xxx は problems_data.js (静的ファイル)
        // それ以外（FirebaseのIDはランダムな英数字）は Firebase
        
        if (problemId && problemId.startsWith('prob_')) {
            // --- 既存の静的データ ---
            if (typeof problemsData !== 'undefined') {
                const problem = problemsData.find(p => p.id === problemId);
                displayProblem(problem);
            }
        } else if (problemId) {
            // --- ★Firebaseから取得 ---
            try {
                const docRef = doc(db, "problems", problemId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const problem = docSnap.data();
                    problem.id = docSnap.id; // IDを結合
                    displayProblem(problem);
                } else {
                    document.getElementById('p_title').textContent = "問題が見つかりません";
                    document.getElementById('p_description').innerHTML = "<p>削除された可能性があります。</p>";
                }
            } catch(e) {
                console.error(e);
            }
        }
    }

    // 問題を表示する共通関数
    function displayProblem(problem) {
        if (!problem) return;
        document.title = `${problem.title} | Unity Learning`;
        document.getElementById('p_title').textContent = problem.title;
        document.getElementById('p_time').textContent = problem.timeLimit;
        document.getElementById('p_memory').textContent = problem.memoryLimit;
        document.getElementById('p_score').textContent = problem.score;
        document.getElementById('p_display_id').textContent = problem.id;

        document.getElementById('p_description').innerHTML = problem.description;
        document.getElementById('p_constraints').innerHTML = problem.constraints;
        document.getElementById('p_input').textContent = problem.inputExample;
        document.getElementById('p_output').textContent = problem.outputExample;

        const editorDiv = document.getElementById('editor');
        if (editorDiv) {
            editor = ace.edit("editor");
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/csharp");
            editor.setFontSize(14);
            editor.setValue(problem.initialCode || "", -1);
        }
    }

    // --- 提出ボタン (シミュレーションのまま) ---
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            if (!localStorage.getItem('unityLearningUser')) {
                alert("提出するにはログインが必要です。");
                window.location.href = "login.html";
                return;
            }
            if (!editor) return;

            const code = editor.getValue().trim();
            if (!code) {
                alert("エラー: 解答コードが入力されていません。");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = "WJ (ジャッジ待機中)...";
            submitBtn.style.backgroundColor = "#f0ad4e"; 
            submitBtn.style.border = "none";

            setTimeout(() => {
                const rand = Math.floor(Math.random() * 10);
                if (rand >= 4) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    const score = document.getElementById('p_score') ? document.getElementById('p_score').textContent : "100";
                    alert(`結果: AC (Accepted)\n得点: ${score}点`);
                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    alert("結果: WA (Wrong Answer)");
                }
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "提出する";
                    submitBtn.style.backgroundColor = "";
                    submitBtn.style.border = "";
                }, 3000);
            }, 2000);
        });
    }

    // 4. ログイン処理 (簡易版)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            if (username) {
                localStorage.setItem('unityLearningUser', username);
                alert(`ログインしました！\nようこそ、${username} さん`);
                window.location.href = 'index.html';
            }
        });
    }
    
    // 5. コース一覧フィルタ
    const filterBtns = document.querySelectorAll('.filter-btn-group button');
    const courseCards = document.querySelectorAll('.course-card');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => { b.style.background = 'transparent'; b.style.color = '#555'; });
                btn.style.background = '#007acc'; btn.style.color = '#fff'; btn.style.borderRadius = '20px';
                const filterType = btn.dataset.filter;
                courseCards.forEach(card => {
                    if (!card.hasAttribute('data-category')) return;
                    if (filterType === 'all' || card.dataset.category === filterType) card.style.display = 'block';
                    else card.style.display = 'none';
                });
            });
        });
        if(filterBtns[0]) filterBtns[0].click();
    }
});