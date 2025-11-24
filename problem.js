// ----------------------------------------------------
// 1. コード掃除機（スペース・改行・コメントを無視する機能）
// ----------------------------------------------------
function normalizeCode(code) {
    return code
        .replace(/\/\/.*$/gm, '')       // 行末コメント削除
        .replace(/\/\*[\s\S]*?\*\//g, '') // ブロックコメント削除
        .replace(/\s+/g, '')            // 全スペース・改行削除
        .trim();
}

// ----------------------------------------------------
// 2. 問題データ（ここに追加するだけでOK！合計5問）
// ----------------------------------------------------
const problems = {
    "1": {
        title: "Debug.Log で文字列出力",
        difficulty: "初級",
        description: "<p>Unityのコンソールに <strong>Hello World</strong> と表示させてください。</p>",
        inputExample: "なし",
        outputExample: "Hello World",
        defaultCode: `using UnityEngine;

public class Question1 : MonoBehaviour
{
    void Start()
    {
        // ここにコードを記述
        
    }
}`,
        expectedSnippet: `Debug.Log("Hello World");`
    },
    
    "2": {
        title: "変数の足し算",
        difficulty: "初級",
        description: "<p>整数型の変数 <code>a = 3</code> と <code>b = 5</code> を足した結果をログ出力してください。</p>",
        inputExample: "なし",
        outputExample: "8",
        defaultCode: `using UnityEngine;

public class Question2 : MonoBehaviour
{
    void Start()
    {
        int a = 3;
        int b = 5;
        // 以下に足し算と出力のコードを記述
        
    }
}`,
        expectedSnippet: `Debug.Log(a+b);`
    },

    "3": {
        title: "浮動小数点数 (float) の定義と計算",
        difficulty: "初級",
        description: "<p>浮動小数点数（`float`型）の変数 <code>pi = 3.14f</code> を定義し、それを2倍した結果をログ出力してください。float型リテラルには末尾に **f** をつけます。</p>",
        inputExample: "pi = 3.14f",
        outputExample: "6.28",
        defaultCode: `using UnityEngine;

public class Question3 : MonoBehaviour
{
    void Start()
    {
        // ここにコードを記述
        
    }
}`,
        expectedSnippet: `floatpi=3.14f;Debug.Log(pi*2);`
    },

    "4": {
        title: "文字列と変数の連結",
        difficulty: "初級",
        description: "<p>変数 <code>score = 100</code> と文字列 <code>\"スコア: \"</code> を**連結**して、コンソールに `スコア: 100` と出力してください。</p>",
        inputExample: "score = 100",
        outputExample: "スコア: 100",
        defaultCode: `using UnityEngine;

public class Question4 : MonoBehaviour
{
    void Start()
    {
        int score = 100;
        // 以下に連結と出力のコードを記述
        
    }
}`,
        expectedSnippet: `Debug.Log("スコア:"+score);`
    },
    
    "5": {
        title: "if文による条件分岐",
        difficulty: "中級",
        description: "<p>変数 <code>hp = 50</code> を定義し、もし <code>hp</code> が **50より小さかった** 場合にのみ、`Debug.Log(\"ダメージを受けています\")` を実行してください。この問題では、`hp` は50なので何も出力されません。</p>",
        inputExample: "hp = 50",
        outputExample: "なし",
        defaultCode: `using UnityEngine;

public class Question5 : MonoBehaviour
{
    void Start()
    {
        int hp = 50;
        // if文を記述
        
    }
}`,
        expectedSnippet: `if(hp<50){Debug.Log("ダメージを受けています");}`
    }
};

// ----------------------------------------------------
// 3. 画面描画ロジック
// ----------------------------------------------------

// URLの ?id=〇〇 を取得
const urlParams = new URLSearchParams(window.location.search);
const currentId = urlParams.get('id');
const problem = problems[currentId]; // 該当する問題データを取得

// 画面へのデータ流し込み
if (problem) {
    document.getElementById('probIdDisplay').textContent = `問題${currentId}`;
    document.getElementById('probTitle').textContent = `問題${currentId}: ${problem.title}`;
    document.getElementById('probDifficulty').textContent = problem.difficulty;
    document.getElementById('probDesc').innerHTML = problem.description;
    document.getElementById('probInput').textContent = problem.inputExample;
    document.getElementById('probOutput').textContent = problem.outputExample;
    document.getElementById('userCode').value = problem.defaultCode;
} else {
    // ID指定がない、または存在しないIDの場合
    document.querySelector('.main-content').innerHTML = `
        <h2>問題を選択してください</h2>
        <p>無効なURL、または問題が見つかりませんでした。</p>
        <a href="index.html" class="btn-secondary">トップへ戻る</a>
    `;
}

// ----------------------------------------------------
// 4. 判定ボタンクリック時 (checkAnswer)
// ----------------------------------------------------
function checkAnswer() {
    if (!problem) return;

    const userRawCode = document.getElementById('userCode').value;
    const resultDiv = document.getElementById('result');

    // 掃除（正規化）してから比較
    const cleanUser = normalizeCode(userRawCode);
    const cleanExpected = normalizeCode(problem.expectedSnippet);

    // ユーザーのコード内に、正解のスニペットが含まれているか確認
    if (cleanUser.includes(cleanExpected)) {
         resultDiv.innerHTML = '<div class="msg success">🎉 正解です！完璧なコードです。</div>';
    } else {
         resultDiv.innerHTML = `
            <div class="msg error">
                ❌ 不正解です。<br>
                ロジックが正しいか、スペルミスがないか確認してください。<br>
                <small>ヒント: ${problem.expectedSnippet} が含まれている必要があります。</small>
            </div>`;
    }
}