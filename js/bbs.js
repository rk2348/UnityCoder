import { collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";

export function initBBS() {
    /* =================================================================
       B. 掲示板 (BBS) 機能 (XSS対策済み)
       ================================================================= */
    const bbsTable = document.querySelector('#bbsTable tbody');
    if (bbsTable) {
        // スレッド一覧の読み込み
        const loadThreads = async () => {
            bbsTable.innerHTML = '<tr><td colspan="4">読み込み中...</td></tr>';
            try {
                const q = query(collection(db, "threads"), orderBy("createdAt", "desc"), limit(20));
                const querySnapshot = await getDocs(q);
                
                bbsTable.innerHTML = ''; 
                if(querySnapshot.empty) {
                    bbsTable.innerHTML = '<tr><td colspan="4">まだ投稿がありません。</td></tr>';
                    return;
                }
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const date = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "-";
                    
                    const tr = document.createElement('tr');

                    // タイトルセル
                    const tdTitle = document.createElement('td');
                    const link = document.createElement('a');
                    link.href = "#";
                    link.className = "thread-link";
                    link.style.fontWeight = "bold";
                    link.style.color = "#007acc";
                    link.textContent = data.title; // 安全
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        openViewThreadModal(data, date);
                    });
                    
                    const descDiv = document.createElement('div');
                    descDiv.style.fontSize = "0.85rem";
                    descDiv.style.color = "#666";
                    descDiv.style.marginTop = "4px";
                    // 本文の抜粋も安全に表示
                    descDiv.textContent = data.content ? data.content.substring(0, 30) + "..." : "";

                    tdTitle.appendChild(link);
                    tdTitle.appendChild(descDiv);
                    tr.appendChild(tdTitle);

                    // カテゴリセル
                    const tdCat = document.createElement('td');
                    let catText = "その他";
                    let catBg = "#eee"; let catCol = "#333";

                    if(data.category === "question") { catText = "質問"; catBg = "#e3f2fd"; catCol = "#0d47a1"; }
                    if(data.category === "chat") { catText = "雑談"; catBg = "#f3e5f5"; catCol = "#4a148c"; }
                    if(data.category === "bug") { catText = "バグ報告"; catBg = "#ffebee"; catCol = "#b71c1c"; }
                    
                    const catSpan = document.createElement('span');
                    catSpan.style.fontSize = "0.8rem";
                    catSpan.style.padding = "2px 6px";
                    catSpan.style.borderRadius = "4px";
                    catSpan.style.background = catBg;
                    catSpan.style.color = catCol;
                    catSpan.textContent = catText;
                    
                    tdCat.appendChild(catSpan);
                    tr.appendChild(tdCat);

                    // 投稿者セル
                    const tdAuthor = document.createElement('td');
                    tdAuthor.textContent = data.authorName;
                    tr.appendChild(tdAuthor);

                    // 日時セル
                    const tdDate = document.createElement('td');
                    const spanDate = document.createElement('span');
                    spanDate.style.fontSize = "0.85rem";
                    spanDate.style.color = "#666";
                    spanDate.textContent = date;
                    tdDate.appendChild(spanDate);
                    tr.appendChild(tdDate);

                    bbsTable.appendChild(tr);
                });
            } catch(e) {
                console.error(e);
                bbsTable.innerHTML = '<tr><td colspan="4">読み込みエラー</td></tr>';
            }
        };
        loadThreads();

        // モーダル制御
        const createModal = document.getElementById('threadModal');
        const viewModal = document.getElementById('viewThreadModal');
        const newThreadBtn = document.getElementById('newThreadBtn');
        const cancelBtn = document.getElementById('cancelThreadBtn');
        const submitThreadBtn = document.getElementById('submitThreadBtn');
        
        // 詳細モーダル関数
        function openViewThreadModal(data, dateStr) {
            if(!viewModal) return;
            // 全てtextContentでセット
            document.getElementById('viewThreadTitle').textContent = data.title;
            document.getElementById('viewThreadAuthor').textContent = data.authorName;
            document.getElementById('viewThreadDate').textContent = dateStr;
            document.getElementById('viewThreadBody').textContent = data.content;
            document.getElementById('viewThreadCategory').textContent = data.category;
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

                if (!title || !content) { alert("入力を確認してください"); return; }
                submitThreadBtn.disabled = true;
                submitThreadBtn.textContent = "投稿中...";

                try {
                    await addDoc(collection(db, "threads"), {
                        title: title, category: category, content: content,
                        authorName: user.displayName || user.email.split('@')[0],
                        uid: user.uid, createdAt: new Date(), replyCount: 0
                    });
                    alert("作成しました！");
                    location.reload(); 
                } catch(e) {
                    alert("投稿失敗: " + e.message);
                    submitThreadBtn.disabled = false;
                    submitThreadBtn.textContent = "投稿する";
                }
            });
        }
    }
}