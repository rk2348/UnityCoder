/* --- script.js --- */

document.addEventListener('DOMContentLoaded', () => {

    /* =================================================================
       1. 問題一覧ページ (problemlist.html) の検索・フィルター機能
       ================================================================= */
    const searchInput = document.getElementById('problemSearch');
    const difficultySelect = document.getElementById('difficultyFilter');
    const categorySelect = document.getElementById('categoryFilter');
    const problemTableBody = document.querySelector('#problemTable tbody');

    // 要素がページ内に存在する場合のみ実行
    if (searchInput && difficultySelect && categorySelect && problemTableBody) {
        
        const filterProblems = () => {
            const keyword = searchInput.value.toLowerCase().trim(); // 入力値を小文字に
            const difficulty = difficultySelect.value;
            const category = categorySelect.value;
            const rows = problemTableBody.querySelectorAll('tr');

            rows.forEach(row => {
                // HTML構造依存: 1番目のセル=難易度, 2番目=名前, 3番目=カテゴリ
                const titleCell = row.cells[1];
                const categoryCell = row.cells[2];
                const diffSpan = row.cells[0].querySelector('span');

                if (!titleCell || !categoryCell || !diffSpan) return;

                const titleText = titleCell.textContent.toLowerCase();
                const categoryText = categoryCell.textContent;
                
                // 難易度の判定 (クラス名から特定)
                let diffType = "all";
                if (diffSpan.classList.contains('diff-gray')) diffType = "gray";
                if (diffSpan.classList.contains('diff-green')) diffType = "green";
                if (diffSpan.classList.contains('diff-cyan')) diffType = "cyan";
                if (diffSpan.classList.contains('diff-blue')) diffType = "blue";

                // フィルタリング条件のチェック
                let isMatch = true;

                // 1. キーワード検索 (部分一致)
                if (keyword && !titleText.includes(keyword)) {
                    isMatch = false;
                }
                // 2. 難易度フィルタ
                if (difficulty !== "all" && difficulty !== diffType) {
                    isMatch = false;
                }
                // 3. カテゴリフィルタ (部分一致)
                if (category !== "all" && !categoryText.includes(category)) {
                    isMatch = false;
                }

                // 表示・非表示の適用
                row.style.display = isMatch ? '' : 'none';
            });
        };

        // 入力や選択が変わった瞬間にフィルタ関数を実行
        searchInput.addEventListener('input', filterProblems);
        difficultySelect.addEventListener('change', filterProblems);
        categorySelect.addEventListener('change', filterProblems);
    }


    /* =================================================================
       2. 問題詳細ページ (problem_detail.html) の提出シミュレーション
       ================================================================= */
    const submitBtn = document.getElementById('submitBtn');
    const codeArea = document.getElementById('codeArea');

    if (submitBtn && codeArea) {
        submitBtn.addEventListener('click', () => {
            const code = codeArea.value.trim();

            // 空欄チェック
            if (!code) {
                alert("エラー: 解答コードが入力されていません。");
                return;
            }

            // --- 状態1: 提出中 (WJ) ---
            submitBtn.disabled = true; // ボタンを連打できないように無効化
            const originalText = submitBtn.textContent; // 元のテキスト「提出する」を保存
            
            submitBtn.textContent = "WJ (ジャッジ待機中)...";
            submitBtn.style.backgroundColor = "#f0ad4e"; // 黄色 (BootstrapのWarning色)
            submitBtn.style.border = "none";

            // --- 状態2: 2秒後にジャッジ結果を表示 ---
            setTimeout(() => {
                // ランダムで結果を決定 (AC, WA, CE)
                // 0~9の乱数: 4以上ならAC, 2~3ならWA, 0~1ならCE
                const rand = Math.floor(Math.random() * 10);
                
                if (rand >= 4) {
                    // --- AC (正解) ---
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c"; // 緑 (Success色)
                    alert("おめでとうございます！\n結果: AC (Accepted)\n得点: 100点");
                } else if (rand >= 2) {
                    // --- WA (不正解) ---
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e"; // 黄色
                    alert("残念...\n結果: WA (Wrong Answer)\nテストケースの一部に失敗しました。");
                } else {
                    // --- CE (コンパイルエラー) ---
                    submitBtn.textContent = "CE (エラー)";
                    submitBtn.style.backgroundColor = "#d9534f"; // 赤 (Danger色)
                    alert("コンパイルエラーがあります。\n文法を確認してください。");
                }

                // --- 状態3: さらに3秒後にリセット ---
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "提出する"; // 元のテキストに戻す
                    submitBtn.style.backgroundColor = ""; // 色をCSSの指定に戻す
                    submitBtn.style.border = "";
                }, 3000);

            }, 2000); // 2000ミリ秒 = 2秒待機
        });
    }


    /* =================================================================
       3. コース一覧ページ (courses.html) のカテゴリフィルタ機能
       ================================================================= */
    // .filter-btn-group 内の全ての button を取得
    const filterBtns = document.querySelectorAll('.filter-btn-group button');
    // 全てのコースカードを取得
    const courseCards = document.querySelectorAll('.course-card');

    if (filterBtns.length > 0 && courseCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 1. ボタンの見た目の切り替え
                // 一旦すべてのボタンを「非アクティブ（透明背景）」にする
                filterBtns.forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = '#555';
                    b.style.border = '1px solid transparent'; // 枠線を消すか調整
                });

                // クリックされたボタンを「アクティブ（青背景）」にする
                btn.style.background = '#007acc';
                btn.style.color = '#fff';
                btn.style.borderRadius = '20px'; // 丸みを帯びさせる

                // 2. フィルタリング実行
                const filterType = btn.dataset.filter; // HTMLの data-filter="..." を取得

                courseCards.forEach(card => {
                    // data-category属性を持っていなければ無視（エラー回避）
                    if (!card.hasAttribute('data-category')) return;

                    const cardCategory = card.dataset.category;

                    if (filterType === 'all') {
                        // "すべて"が選ばれたら全員表示
                        card.style.display = 'block';
                    } else {
                        // 選択されたタイプとカードのタイプが一致するか
                        if (cardCategory === filterType) {
                            card.style.display = 'block';
                        } else {
                            card.style.display = 'none';
                        }
                    }
                });
            });
        });
        
        // ページ読み込み時、最初のボタン（通常は「すべて」）をアクティブにする処理
        if(filterBtns[0]) {
            filterBtns[0].click();
        }
    }

});