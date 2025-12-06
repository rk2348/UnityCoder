// js/judge.js
import { doc, getDoc, collection, addDoc, updateDoc, increment, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-functions.js";
import { db, auth } from "./config.js";

export function initJudge() {
    const problemTitleElement = document.getElementById('p_title');
    if (problemTitleElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('id');
        
        if (problemId) {
            const problemRef = doc(db, "problems", problemId);
            getDoc(problemRef).then(docSnap => {
                if (docSnap.exists()) {
                    renderProblem(docSnap.data(), docSnap.id);
                } else {
                    problemTitleElement.textContent = "問題が見つかりません";
                }
            }).catch(err => {
                console.error(err);
                problemTitleElement.textContent = "読み込みエラー";
            });
        }
    }

    function renderProblem(p, id) {
        document.title = `${p.title} | Unity Learning`;
        document.getElementById('p_title').textContent = p.title;
        
        // 重要修正: innerHTMLからtextContentに変更してXSSを防ぐ
        // ※HTMLタグ(改行<br>など)を使いたい場合は、安全なサニタイズライブラリ(DOMPurify等)を通す必要があります。
        document.getElementById('p_description').textContent = p.description; 
        
        if(document.getElementById('p_time')) document.getElementById('p_time').textContent = p.timeLimit || "2 sec";
        if(document.getElementById('p_memory')) document.getElementById('p_memory').textContent = p.memoryLimit || "1024 MB";
        if(document.getElementById('p_score')) document.getElementById('p_score').textContent = p.score || 100;
        if(document.getElementById('p_display_id')) document.getElementById('p_display_id').textContent = id;
        
        // 制約や入力例もテキストとして扱うのが安全
        if(document.getElementById('p_constraints')) document.getElementById('p_constraints').textContent = p.constraints || "-";
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

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if(!user) return alert("ログインしてください");
            
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('id');
            const editor = ace.edit("editor");
            const userCode = editor.getValue();
            
            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";

            try {
                // 仮の実装: 提出履歴には残すが判定はしない（WJ: Waiting for Judge）
                await addDoc(collection(db, "submissions"), {
                    username: user.displayName || "名無し",
                    uid: user.uid,
                    problemId: problemId,
                    result: "WJ", // 判定待ち
                    score: 0,
                    code: userCode, // コードを保存
                    submittedAt: new Date()
                });

                // 統計データの試行回数だけ増やす
                const pRef = doc(db, "problems", problemId);
                await updateDoc(pRef, { attemptCount: increment(1) });

                alert("提出を受け付けました。\n現在自動ジャッジシステムは停止中のため、正誤判定は行われません。");
                submitBtn.textContent = "提出完了";
            } catch(e) {
                console.error(e);
                alert("提出エラー");
            }

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = "提出する";
            }, 2000);
        });
    }
}