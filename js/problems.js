import { collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";

export function initProblems() {
    /* =================================================================
       Z. トップページ (index.html) の「最近の問題」更新処理
       ================================================================= */
    const recentTableBody = document.querySelector('#recentProblemsTable tbody');
    if (recentTableBody) {
        const loadRecentProblems = async () => {
            try {
                // 最新の5件だけを取得
                const q = query(collection(db, "problems"), orderBy("createdAt", "desc"), limit(5));
                const querySnapshot = await getDocs(q);

                recentTableBody.innerHTML = ''; // 「読み込み中」をクリア

                if (querySnapshot.empty) {
                    recentTableBody.innerHTML = '<tr><td colspan="5">まだ問題がありません</td></tr>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const data = doc.data();

                    // 難易度の色設定
                    let diffClass = "diff-gray";
                    if (data.difficulty === "green") diffClass = "diff-green";
                    else if (data.difficulty === "cyan") diffClass = "diff-cyan";
                    else if (data.difficulty === "blue") diffClass = "diff-blue";

                    // 正解率の計算
                    const solved = data.solvedCount || 0;
                    const attempts = data.attemptCount || 0;
                    let accuracy = "-";
                    if (attempts > 0) {
                        accuracy = ((solved / attempts) * 100).toFixed(1) + "%";
                    } else if (attempts === 0) {
                         accuracy = "0.0%";
                    }

                    // 行を作成
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="diff-circle ${diffClass}" title="${data.difficulty}"></span></td>
                        <td><a href="problem_detail.html?id=${doc.id}">${data.title}</a></td>
                        <td>${data.category}</td>
                        <td>${data.timeLimit || "2 sec"}</td>
                        <td>${accuracy}</td>
                    `;
                    recentTableBody.appendChild(tr);
                });
            } catch (e) {
                console.error("トップページの読み込みエラー:", e);
                recentTableBody.innerHTML = '<tr><td colspan="5">読み込み失敗</td></tr>';
            }
        };
        loadRecentProblems();
    }

    /* =================================================================
       I. 問題一覧ページ (problemlist.html) の読み込み
       ================================================================= */
    const problemListTable = document.querySelector('#problemTable tbody');
    if (problemListTable) {
        const loadProblems = async () => {
            try {
                // Firestoreから問題データを取得（作成日時の新しい順）
                const q = query(collection(db, "problems"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    
                    // 難易度に応じた色のクラスを設定
                    let diffClass = "diff-gray";
                    if (data.difficulty === "green") diffClass = "diff-green";
                    else if (data.difficulty === "cyan") diffClass = "diff-cyan";
                    else if (data.difficulty === "blue") diffClass = "diff-blue";

                    // 正解率の計算
                    const solved = data.solvedCount || 0;
                    const attempts = data.attemptCount || 0;
                    let accuracy = "-";
                    if (attempts > 0) {
                        accuracy = ((solved / attempts) * 100).toFixed(1) + "%";
                    }

                    // テーブルに行を追加
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="diff-circle ${diffClass}" title="${data.difficulty}"></span></td>
                        <td><a href="problem_detail.html?id=${doc.id}">${data.title}</a></td>
                        <td>${data.category}</td>
                        <td>${data.score}</td>
                        <td>${accuracy}</td> `;
                    problemListTable.appendChild(tr);
                });
            } catch (e) {
                console.error("問題一覧の読み込みに失敗しました:", e);
            }
        };
        loadProblems();
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

                // エディタの値取得
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
                    inputExample: "-", outputExample: "-", author: authorName, uid: user.uid, createdAt: new Date(),
                    solvedCount: 0, attemptCount: 0
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
       H. 問題一覧の検索フィルタ
       ================================================================= */
    const searchInput = document.getElementById('problemSearch');
    
    if (searchInput) {
        // フィルタ処理本体
        function filterProblems() {
            const currentRows = document.querySelectorAll('#problemTable tbody tr');
            
            const keyword = searchInput.value.toLowerCase().trim();
            const difficulty = document.getElementById('difficultyFilter').value;
            const category = document.getElementById('categoryFilter').value;

            currentRows.forEach(row => {
                const diffSpan = row.cells[0].querySelector('span');
                const titleText = row.cells[1].textContent.toLowerCase();
                const categoryText = row.cells[2].textContent;

                let rowDiff = "all";
                if (diffSpan && diffSpan.classList.contains('diff-gray')) rowDiff = "gray";
                else if (diffSpan && diffSpan.classList.contains('diff-green')) rowDiff = "green";
                else if (diffSpan && diffSpan.classList.contains('diff-cyan')) rowDiff = "cyan";
                else if (diffSpan && diffSpan.classList.contains('diff-blue')) rowDiff = "blue";

                const matchKeyword = titleText.includes(keyword);
                const matchDiff = (difficulty === "all") || (difficulty === rowDiff);
                // "C#" を選択した場合は "C# 基礎" などを含むようにする
                const matchCat = (category === "all") || (category === categoryText) || (category === "C#" && categoryText.includes("C#"));

                if (matchKeyword && matchDiff && matchCat) row.style.display = ""; else row.style.display = "none";
            });
        }

        // 入力・変更イベント
        searchInput.addEventListener('input', filterProblems);
        document.getElementById('difficultyFilter').addEventListener('change', filterProblems);
        document.getElementById('categoryFilter').addEventListener('change', filterProblems);
        
        const filterBtn = document.querySelector('.filter-box button');
        if(filterBtn) filterBtn.addEventListener('click', filterProblems);

        // ★追加: サイドバーのカテゴリリンクをクリックした時の動作
        const sidebarLinks = document.querySelectorAll('.category-sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = link.dataset.category;
                const select = document.getElementById('categoryFilter');
                if(select) {
                    select.value = cat;
                    // セレクトボックスの値を変更した後、changeイベントを手動で起こしてフィルタを実行させる
                    select.dispatchEvent(new Event('change'));
                }
            });
        });
    }
}