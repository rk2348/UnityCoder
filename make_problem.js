/**
 * make_problem.js
 * 問題作成フォームのデータを処理し、サーバーへ送信する（または送信をシミュレーションする）スクリプト
 */

document.addEventListener('DOMContentLoaded', () => {
    // フォーム要素を取得
    const problemForm = document.getElementById('problemForm');

    // フォームの送信イベントをリッスン
    problemForm.addEventListener('submit', function(event) {
        // デフォルトのフォーム送信（ページ遷移）をキャンセル
        event.preventDefault();

        // フォームデータを取得
        const problemTitle = document.getElementById('problemTitle').value;
        const difficulty = document.getElementById('difficulty').value;
        const category = document.getElementById('category').value;
        const problemDescription = document.getElementById('problemDescription').value;
        const expectedAnswer = document.getElementById('expectedAnswer').value;

        // 問題データオブジェクトを構築
        const newProblem = {
            id: 'P-XXX', // サーバー側で自動採番されることを想定
            title: problemTitle,
            difficulty: difficulty,
            category: category,
            description: problemDescription,
            answer_code: expectedAnswer, // これは通常非公開データ
            created_by: 'current_user', // ログインユーザー名を想定
            created_at: new Date().toISOString(),
            status: 'unanswered', // 作成直後は未回答
            thumbnail_url: `https://placehold.co/600x400/${category}/white?text=${category.toUpperCase()}`
        };

        // データの確認（コンソールに出力）
        console.log('--- 作成された問題データ ---');
        console.log(newProblem);
        console.log('----------------------------');

        // --- ここからサーバーへの送信処理をシミュレーション ---
        
        // 実際のアプリケーションでは、ここでfetch APIなどを使ってサーバーのエンドポイントにデータをPOSTします。
        // 例: fetch('/api/problems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newProblem) })
        //    .then(response => response.json())
        //    .then(data => { /* 成功時の処理 */ })
        //    .catch(error => { /* エラー時の処理 */ });


        // 今回はシミュレーションとして成功メッセージを表示
        alert(`問題「${problemTitle}」を作成しました！(実際にはサーバーへの送信が必要です)`);

        // フォームをリセット
        // problemForm.reset(); 
    });
});