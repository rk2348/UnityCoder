import { collection, addDoc, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";

export function initBBS() {
    /* =================================================================
       B. 掲示板 (BBS) 機能
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
            document.getElementById('viewThreadTitle').textContent = data.title;
            document.getElementById('viewThreadAuthor').textContent = data.authorName;
            document.getElementById('viewThreadDate').textContent = dateStr;
            document.getElementById('viewThreadBody').textContent = data.content;
            const catLabel = document.getElementById('viewThreadCategory');
            catLabel.textContent = data.category;
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