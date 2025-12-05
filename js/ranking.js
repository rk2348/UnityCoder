import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { collection, getDocs, query } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";

export function initRanking() {
    /* =================================================================
       F. ランキング表示
       ================================================================= */
    const rankingTableBody = document.querySelector('.ranking-table tbody');
    if (rankingTableBody) {
        rankingTableBody.innerHTML = '<tr><td colspan="5">集計中...</td></tr>';
        
        onAuthStateChanged(auth, async (user) => {
            try {
                const q = query(collection(db, "submissions"));
                const querySnapshot = await getDocs(q);
                
                const userStats = new Map();

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const uid = data.uid;
                    const problemId = data.problemId;
                    const score = data.score || 0;
                    const submittedAt = data.submittedAt ? data.submittedAt.toDate() : new Date(0);

                    if (!userStats.has(uid)) {
                        userStats.set(uid, {
                            username: data.username,
                            totalScore: 0,
                            solvedProblems: new Set(),
                            lastActive: submittedAt
                        });
                    }

                    const stats = userStats.get(uid);

                    if (data.result === "AC" && !stats.solvedProblems.has(problemId)) {
                        stats.totalScore += score;
                        stats.solvedProblems.add(problemId);
                    }

                    if (submittedAt > stats.lastActive) {
                        stats.lastActive = submittedAt;
                        stats.username = data.username;
                    }
                });

                const rankingData = Array.from(userStats.values()).sort((a, b) => {
                    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                    if (b.solvedProblems.size !== a.solvedProblems.size) return b.solvedProblems.size - a.solvedProblems.size;
                    return b.lastActive - a.lastActive;
                });

                rankingTableBody.innerHTML = '';
                let rank = 1;
                let myRankInfo = null;

                rankingData.slice(0, 20).forEach((d) => {
                    const date = d.lastActive.toLocaleDateString();
                    const tr = document.createElement('tr');
                    
                    let rankDisplay = `<strong>${rank}</strong>`;
                    if (rank === 1) rankDisplay = `<strong style="color:#DAA520; font-size:1.2em;">🥇 1</strong>`;
                    else if (rank === 2) rankDisplay = `<strong style="color:#C0C0C0; font-size:1.1em;">🥈 2</strong>`;
                    else if (rank === 3) rankDisplay = `<strong style="color:#B87333; font-size:1.1em;">🥉 3</strong>`;

                    tr.innerHTML = `
                        <td align="center">${rankDisplay}</td>
                        <td>${d.username}</td>
                        <td style="font-weight:bold; color:#007acc;">${d.totalScore}</td>
                        <td>${d.solvedProblems.size}</td>
                        <td>${date}</td>
                    `;
                    rankingTableBody.appendChild(tr);
                    rank++;
                });

                if (user) {
                    const myIndex = rankingData.findIndex(d => d.username === (user.displayName || user.email.split('@')[0])); 
                    const myData = userStats.get(user.uid);
                    
                    if (myData) {
                        const realRank = rankingData.indexOf(myData) + 1;
                        myRankInfo = { rank: realRank, score: myData.totalScore, count: myData.solvedProblems.size };
                    }
                }

                if (rankingData.length === 0) {
                    rankingTableBody.innerHTML = '<tr><td colspan="5">データなし</td></tr>';
                }

                const myRankArea = document.getElementById('my-rank-area');
                if (myRankArea && user) {
                    if (myRankInfo) {
                        myRankArea.innerHTML = `
                            <div style="text-align:center; padding:10px;">
                                <div style="font-size:0.9rem; color:#666;">あなたの順位</div>
                                <div style="font-size:2rem; font-weight:bold; color:#007acc;">${myRankInfo.rank} <span style="font-size:1rem;">位</span></div>
                                <div style="font-size:0.9rem; margin-top:5px;">
                                    Total: <strong>${myRankInfo.score}pt</strong> / ${myRankInfo.count}問
                                </div>
                            </div>`;
                    } else {
                        myRankArea.innerHTML = `<p>まだ正解データがありません。<br>問題を解いてランキングに参加しましょう！</p>`;
                    }
                } else if (myRankArea) {
                    myRankArea.innerHTML = `<p>ランキングに参加するにはログインしてください。</p>`;
                }

            } catch (e) {
                console.error(e);
                rankingTableBody.innerHTML = '<tr><td colspan="5">読み込み失敗</td></tr>';
            }
        });
    }
}