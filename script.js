/* --- script.js (Firebase接続 / 完成版) --- */

// 1. Firebaseの機能をインターネットから読み込む
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. あなたのFirebase設定 (画像から読み取りました)
const firebaseConfig = {
  apiKey: "AIzaSyAmeB2GKyDCv177vgI1oe6z_R-wFyCD2Us",
  authDomain: "unitycoder.firebaseapp.com",
  projectId: "unitycoder",
  storageBucket: "unitycoder.firebasestorage.app",
  messagingSenderId: "763752037328",
  appId: "1:763752037328:web:78d2714e0dcfd938f757d5",
  measurementId: "G-G9JZT2Y9MR"
};

// 3. データベース起動
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- ここから下はサイトの動きを作るコード ---

document.addEventListener('DOMContentLoaded', async () => {

    /* =================================================================
       A. 提出ボタン：スコアをデータベースに保存する
       ================================================================= */
    const submitBtn = document.getElementById('submitBtn');
    let editor; // Ace Editor用

    // エディタの準備 (詳細ページ用)
    if (document.getElementById('editor')) {
        editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/csharp");
        editor.setFontSize(14);
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = localStorage.getItem('unityLearningUser');
            if (!user) {
                alert("ログインしてください");
                window.location.href = "login.html";
                return;
            }

            // 見た目の演出
            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";
            
            // 擬似的な判定 (2秒待つ)
            setTimeout(async () => {
                const isCorrect = Math.random() > 0.3; // 70%で正解とする
                
                if (isCorrect) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    
                    // ★ここがデータベース保存の瞬間★
                    try {
                        // "submissions" という場所にデータを保存
                        await addDoc(collection(db, "submissions"), {
                            username: user,
                            problemId: new URLSearchParams(window.location.search).get('id') || "unknown",
                            result: "AC",
                            score: 100,
                            submittedAt: new Date()
                        });
                        alert("正解！スコアを保存しました。");
                    } catch (e) {
                        console.error(e);
                        alert("保存に失敗しました: " + e.message);
                    }

                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    alert("残念、不正解です...");
                }

                // ボタンを戻す
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "提出する";
                    submitBtn.style.backgroundColor = "";
                }, 3000);

            }, 1500);
        });
    }

    /* =================================================================
       B. ランキング：データベースからデータを読み込んで表示する
       ================================================================= */
    const rankingTableBody = document.querySelector('.ranking-table tbody');

    if (rankingTableBody) {
        // 現在のダミー表示をクリア
        rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み中...</td></tr>';

        try {
            // 最新の提出履歴を20件取得
            const q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"), limit(20));
            const querySnapshot = await getDocs(q);

            rankingTableBody.innerHTML = ''; // クリア

            let rank = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                // 日付を見やすく変換
                const date = data.submittedAt ? new Date(data.submittedAt.seconds * 1000).toLocaleDateString() : "-";
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td align="center"><strong>${rank++}</strong></td>
                    <td>${data.username}</td>
                    <td>${data.score}</td>
                    <td>${data.problemId}</td>
                    <td>${date}</td>
                `;
                rankingTableBody.appendChild(tr);
            });

            if (querySnapshot.empty) {
                rankingTableBody.innerHTML = '<tr><td colspan="5">データがまだありません</td></tr>';
            }

        } catch (e) {
            console.error(e);
            rankingTableBody.innerHTML = '<tr><td colspan="5">データの読み込みに失敗しました</td></tr>';
        }
    }

    // --- その他（ログイン処理など既存のコード） ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            if (username) {
                localStorage.setItem('unityLearningUser', username);
                alert("ログインしました");
                window.location.href = 'index.html';
            }
        });
    }
    
    // コース一覧フィルタなど
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