// 学習履歴表示（進捗バー動的対応）
function updateHistory() {
    const lastTutorial = localStorage.getItem('lastTutorial');
    const lastTutorialProgress = localStorage.getItem('lastTutorialProgress') || 70;
    const lastTools = JSON.parse(localStorage.getItem('usedTools') || '[]');
    const lastToolsProgress = localStorage.getItem('lastToolsProgress') || 50;
    const lastCourses = JSON.parse(localStorage.getItem('startedCourses') || '[]');
    const lastCoursesProgress = localStorage.getItem('lastCoursesProgress') || 40;
    const lastProgressDiv = document.getElementById('last-progress');

    let html = '';

    if (lastTutorial) {
        html += `
        <div class="history-card">
            <h4>前回の学習</h4>
            <a href="${lastTutorial}">${lastTutorial}</a>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${lastTutorialProgress}%"></div>
            </div>
            <button class="next-step-btn" onclick="goNext('${lastTutorial}')">次のステップへ</button>
        </div>
        `;
    }

    if (lastTools.length > 0) {
        html += `
        <div class="history-card">
            <h4>使用したツール</h4>
            <p>${lastTools.join(', ')}</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${lastToolsProgress}%"></div>
            </div>
            <button class="next-step-btn" onclick="advanceProgress('tools')">次のステップへ</button>
        </div>
        `;
    }

    if (lastCourses.length > 0) {
        html += `
        <div class="history-card">
            <h4>開始したコース</h4>
            <p>${lastCourses.join(', ')}</p>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width:${lastCoursesProgress}%"></div>
            </div>
            <button class="next-step-btn" onclick="advanceProgress('courses')">次のステップへ</button>
        </div>
        `;
    }

    lastProgressDiv.innerHTML = html;
}

// 次のステップボタン動作
function goNext(url) {
    window.location.href = url;
}

// 進捗バーを更新する関数
function advanceProgress(type) {
    if (type === 'tools') {
        let progress = parseInt(localStorage.getItem('lastToolsProgress') || 50);
        progress = Math.min(progress + 10, 100);
        localStorage.setItem('lastToolsProgress', progress);
        alert(`ツールの進捗が ${progress}% に更新されました`);
    } else if (type === 'courses') {
        let progress = parseInt(localStorage.getItem('lastCoursesProgress') || 40);
        progress = Math.min(progress + 10, 100);
        localStorage.setItem('lastCoursesProgress', progress);
        alert(`コースの進捗が ${progress}% に更新されました`);
    }
    updateHistory();
}

// チュートリアルクリックで記録
document.querySelectorAll('.tutorial-link').forEach(link => {
    link.addEventListener('click', () => {
        localStorage.setItem('lastTutorial', link.getAttribute('href'));
        updateHistory();
    });
});

// ツール使用で記録
function useTool(name) {
    let usedTools = JSON.parse(localStorage.getItem('usedTools') || '[]');
    if (!usedTools.includes(name)) usedTools.push(name);
    localStorage.setItem('usedTools', JSON.stringify(usedTools));
    alert(name + 'を使用しました！');
    updateHistory();
}

// コース開始で記録
function startCourse(name, url) {
    localStorage.setItem('lastCourse', url);
    let courses = JSON.parse(localStorage.getItem('startedCourses') || '[]');
    if (!courses.includes(name)) courses.push(name);
    localStorage.setItem('startedCourses', JSON.stringify(courses));
    alert(name + 'コースを開始しました！');
    updateHistory();
}

// ツール・コース検索
function searchTool() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('.tool-card').forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        card.style.display = name.includes(query) ? 'block' : 'none';
    });
}

// お問い合わせフォーム（ダミー送信）
document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    alert('送信ありがとうございました！');
    document.getElementById('contactForm').reset();
});

// ページロード時に履歴反映
updateHistory();
