/* --- script.js (データベースなし / エラー修正版) --- */

document.addEventListener('DOMContentLoaded', async () => {

    /* =================================================================
       0. 共通: ログイン状態 (localStorageを使用)
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
       1. 問題作成ページ (サーバーへの保存機能は削除し、アラートのみに変更)
       ================================================================= */
    const saveProblemBtn = document.getElementById('saveProblemBtn');
    
    if (saveProblemBtn) {
        saveProblemBtn.addEventListener('click', () => {
            const title = document.getElementById('new_title').value;
            const description = document.getElementById('new_description').value;

            if(!title || !description) {
                alert("タイトルと問題文は必須です");
                return;
            }

            // データベース保存の代わりにアラートを表示
            alert("デモ版のため、サーバーには保存されません。\n(タイトル: " + title + ")");
            // 一覧ページへ戻る
            window.location.href = "problemlist.html";
        });
    }

    /* =================================================================
       2. 問題一覧ページ (静的HTMLのフィルタリングのみ動作)
       ================================================================= */
    const problemTableBody = document.querySelector('#problemTable tbody');
    
    if (problemTableBody) {
        // 検索フィルタ機能
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
       3. 問題詳細ページ (problems_data.js からデータを取得)
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

        // problemsData が存在する場合のみ実行 (Firebaseへの問い合わせコードは削除)
        if (typeof problemsData !== 'undefined' && problemId) {
            const problem = problemsData.find(p => p.id === problemId);
            
            if (problem) {
                displayProblem(problem);
            } else {
                document.getElementById('p_title').textContent = "問題が見つかりません";
                document.getElementById('p_description').innerHTML = "<p>IDが間違っているか、データが存在しません。</p>";
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
            // Ace Editorの設定
            editor = ace.edit("editor");
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/csharp");
            editor.setFontSize(14);
            editor.setValue(problem.initialCode || "", -1);
        }
    }

    // --- 提出ボタン (シミュレーション) ---
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
                // ランダム判定 (確率でACかWAを出す)
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