import { doc, getDoc, collection, addDoc, updateDoc, increment, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";
// import { problemsData } ... は削除しました

export function initJudge() {
    /* =================================================================
       D. 問題詳細表示 (Firebaseのみ使用)
       ================================================================= */
    const problemTitleElement = document.getElementById('p_title');
    if (problemTitleElement) {
        const urlParams = new URLSearchParams(window.location.search);
        const problemId = urlParams.get('id');
        
        if (problemId) {
            // Firebaseからデータを取得
            const problemRef = doc(db, "problems", problemId);
            getDoc(problemRef).then(docSnap => {
                if (docSnap.exists()) {
                    renderProblem(docSnap.data(), docSnap.id);
                } else {
                    problemTitleElement.textContent = "問題が見つかりません";
                    const desc = document.getElementById('p_description');
                    if(desc) desc.textContent = "指定されたIDの問題は存在しないか、削除されています。";
                }
            }).catch(err => {
                console.error("読み込みエラー:", err);
                problemTitleElement.textContent = "読み込みエラー";
            });
        }
    }

    function renderProblem(p, id) {
        document.title = `${p.title} | Unity Learning`;
        document.getElementById('p_title').textContent = p.title;
        if(document.getElementById('p_time')) document.getElementById('p_time').textContent = p.timeLimit || "2 sec";
        if(document.getElementById('p_memory')) document.getElementById('p_memory').textContent = p.memoryLimit || "1024 MB";
        if(document.getElementById('p_score')) document.getElementById('p_score').textContent = p.score || 100;
        if(document.getElementById('p_display_id')) document.getElementById('p_display_id').textContent = id;
        document.getElementById('p_description').innerHTML = p.description;
        if(document.getElementById('p_constraints')) document.getElementById('p_constraints').innerHTML = p.constraints || "-";
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

    // 提出ボタン
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const user = auth.currentUser;
            if(!user) return alert("ログインしてください");
            
            const urlParams = new URLSearchParams(window.location.search);
            const problemId = urlParams.get('id');
            
            submitBtn.disabled = true;
            submitBtn.textContent = "ジャッジ中...";

            // 正解データ取得 (Firebaseから)
            let modelAnswer = "";
            try {
                const docSnap = await getDoc(doc(db, "problems", problemId));
                if(docSnap.exists()) {
                    modelAnswer = docSnap.data().modelAnswer || "";
                }
            } catch (e) {
                console.error("正解データ取得エラー", e);
                alert("データの取得に失敗しました");
                submitBtn.disabled = false;
                submitBtn.textContent = "提出する";
                return;
            }

            setTimeout(async () => {
                const editor = ace.edit("editor");
                const userCode = editor.getValue().replace(/\s/g, "");
                const cleanModel = modelAnswer.replace(/\s/g, "");

                // 判定 (模範解答があれば一致確認、なければ確率30%)
                let isCorrect = false;
                if (cleanModel) {
                    isCorrect = (userCode === cleanModel);
                } else {
                    isCorrect = Math.random() > 0.3; 
                }

                // 重複チェック
                let hasSolved = false;
                try {
                    const q = query(collection(db, "submissions"), where("uid", "==", user.uid), where("problemId", "==", problemId), where("result", "==", "AC"));
                    const snap = await getDocs(q);
                    if (!snap.empty) hasSolved = true;
                } catch(e){}

                if (isCorrect) {
                    submitBtn.textContent = "AC (正解！)";
                    submitBtn.style.backgroundColor = "#5cb85c";
                    try {
                        await addDoc(collection(db, "submissions"), {
                            username: user.displayName || "名無し", uid: user.uid,
                            problemId: problemId, result: "AC", score: 100, submittedAt: new Date()
                        });
                        // 統計データの更新
                        const pRef = doc(db, "problems", problemId);
                        const upData = { attemptCount: increment(1) };
                        if(!hasSolved) upData.solvedCount = increment(1);
                        await updateDoc(pRef, upData);

                        alert("正解！記録を保存しました。");
                    } catch(e) { console.error(e); }
                } else {
                    submitBtn.textContent = "WA (不正解)";
                    submitBtn.style.backgroundColor = "#f0ad4e";
                    try { await updateDoc(doc(db, "problems", problemId), { attemptCount: increment(1) }); } catch(e){}
                    alert("不正解です...模範解答と一致しません。");
                }
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "提出する";
                    submitBtn.style.backgroundColor = "";
                }, 3000);
            }, 1000);
        });
    }
}