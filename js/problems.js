import { collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";

export function initProblems() {
    /* =================================================================
       Z. トップページ (index.html) の「最近の問題」更新処理 (XSS対策済み)
       ================================================================= */
    const recentTableBody = document.querySelector('#recentProblemsTable tbody');
    if (recentTableBody) {
        const loadRecentProblems = async () => {
            try {
                const q = query(collection(db, "problems"), orderBy("createdAt", "desc"), limit(5));
                const querySnapshot = await getDocs(q);

                recentTableBody.innerHTML = ''; 

                if (querySnapshot.empty) {
                    recentTableBody.innerHTML = '<tr><td colspan="5">まだ問題がありません</td></tr>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    createProblemRow(recentTableBody, doc.id, data);
                });
            } catch (e) {
                console.error("トップページの読み込みエラー:", e);
                recentTableBody.innerHTML = '<tr><td colspan="5">読み込み失敗</td></tr>';
            }
        };
        loadRecentProblems();
    }

    /* =================================================================
       I. 問題一覧ページ (problemlist.html) の読み込み (XSS対策済み)
       ================================================================= */
    const problemListTable = document.querySelector('#problemTable tbody');
    if (problemListTable) {
        const loadProblems = async () => {
            try {
                const q = query(collection(db, "problems"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                problemListTable.innerHTML = ''; // クリア

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    createProblemRow(problemListTable, doc.id, data);
                });
            } catch (e) {
                console.error("問題一覧の読み込みに失敗しました:", e);
            }
        };
        loadProblems();
    }

    // 安全な行生成関数
    function createProblemRow(tbody, id, data) {
        const tr = document.createElement('tr');

        // 難易度
        let diffClass = "diff-gray";
        if (data.difficulty === "green") diffClass = "diff-green";
        else if (data.difficulty === "cyan") diffClass = "diff-cyan";
        else if (data.difficulty === "blue") diffClass = "diff-blue";

        const tdDiff = document.createElement('td');
        const spanDiff = document.createElement('span');
        spanDiff.className = `diff-circle ${diffClass}`;
        spanDiff.title = data.difficulty;
        tdDiff.appendChild(spanDiff);
        tr.appendChild(tdDiff);

        // 問題名 (XSS対策: textContent)
        const tdTitle = document.createElement('td');
        const aTitle = document.createElement('a');
        aTitle.href = `problem_detail.html?id=${id}`;
        aTitle.textContent = data.title; 
        tdTitle.appendChild(aTitle);
        tr.appendChild(tdTitle);

        // カテゴリ (XSS対策)
        const tdCat = document.createElement('td');
        tdCat.textContent = data.category;
        tr.appendChild(tdCat);

        // 得点/時間
        const tdMeta = document.createElement('td');
        // 問題一覧と最近の問題で表示項目が違う場合の処理
        if(tbody.id === 'recentProblemsTable tbody' || tbody.parentNode.id === 'recentProblemsTable') {
             tdMeta.textContent = data.timeLimit || "2 sec";
        } else {
             tdMeta.textContent = data.score;
        }
        tr.appendChild(tdMeta);

        // 正解率
        const solved = data.solvedCount || 0;
        const attempts = data.attemptCount || 0;
        let accuracy = "-";
        if (attempts > 0) {
            accuracy = ((solved / attempts) * 100).toFixed(1) + "%";
        } else if (attempts === 0) {
             accuracy = "0.0%";
        }
        const tdAcc = document.createElement('td');
        tdAcc.textContent = accuracy;
        tr.appendChild(tdAcc);

        tbody.appendChild(tr);
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
                // 入力値の取得
                const title = document.getElementById('new_title').value;
                const difficulty = document.getElementById('new_difficulty').value;
                const category = document.getElementById('new_category').value;
                const description = document.getElementById('new_description').value; // ここはユーザーがHTMLを書く想定

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
                    title: title, 
                    difficulty: difficulty, 
                    category: category, 
                    description: description, // 意図的にHTMLを許可している場合でも、表示側でサニタイズ推奨
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
                    createdAt: new Date(),
                    solvedCount: 0, 
                    attemptCount: 0
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
                const matchCat = (category === "all") || (category === categoryText);

                if (matchKeyword && matchDiff && matchCat) row.style.display = ""; else row.style.display = "none";
            });
        }

        searchInput.addEventListener('input', filterProblems);
        document.getElementById('difficultyFilter').addEventListener('change', filterProblems);
        document.getElementById('categoryFilter').addEventListener('change', filterProblems);
        const filterBtn = document.querySelector('.filter-box button');
        if(filterBtn) filterBtn.addEventListener('click', filterProblems);

        // サイドバーのリンク
        const sidebarLinks = document.querySelectorAll('.category-sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const cat = link.dataset.category;
                const select = document.getElementById('categoryFilter');
                if(select) {
                    select.value = cat;
                    select.dispatchEvent(new Event('change'));
                }
            });
        });
    }
}