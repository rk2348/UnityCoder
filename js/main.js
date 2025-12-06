// js/main.js
import { initAuth } from "./auth.js";
import { initBBS } from "./bbs.js";
import { initProblems } from "./problems.js";
import { initJudge } from "./judge.js";
import { initRanking } from "./ranking.js";
import { initContact } from "./contact.js"; // 追加

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initBBS();
    initProblems();
    initJudge();
    initRanking();
    initContact(); // 追加

    // UI固有の処理（変更なし）
    const filterBtns = document.querySelectorAll('.filter-btn-group button');
    const courseCards = document.querySelectorAll('.course-card');
    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => { b.style.background = 'transparent'; b.style.color = '#555'; });
                btn.style.background = '#007acc'; btn.style.color = '#fff'; btn.style.borderRadius = '20px';
                const f = btn.dataset.filter;
                courseCards.forEach(c => {
                    if(f==='all' || c.dataset.category===f) c.style.display='block'; else c.style.display='none';
                });
            });
        });
        filterBtns[0].click();
    }
});