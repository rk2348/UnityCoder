// ----------------------------------------------------
// 1. 問題データ定義 (全5問)
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
        description: "<p>浮動小数点数（float型）の変数 <code>pi = 3.14f</code> を定義し、それを2倍した結果をログ出力してください。<br>float型リテラルには末尾に <strong>f</strong> をつけます。</p>",
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
        description: "<p>変数 <code>score = 100</code> と文字列 <code>\"スコア: \"</code> を<strong>連結</strong>して、コンソールに <code>スコア: 100</code> と出力してください。</p>",
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
        description: "<p>変数 <code>hp = 50</code> を定義し、もし <code>hp</code> が <strong>50より小さかった</strong> 場合にのみ、<code>Debug.Log(\"ダメージを受けています\")</code> を実行してください。<br>この問題では、hpは50なので何も出力されません。</p>",
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
// 2. ユーティリティ関数（コード正規化）
// ----------------------------------------------------
function normalizeCode(code) {
    return code
        .replace(/\/\/.*$/gm, '')       
        .replace(/\/\*[\s\S]*?\*\//g, '') 
        .replace(/\s+/g, '')            
        .trim();
}

// ----------------------------------------------------
// 3. 画面初期化処理
// ----------------------------------------------------

// URLパラメータ (?id=xxx) を取得
const urlParams = new URLSearchParams(window.location.search);
const currentId = urlParams.get('id');
const problem = problems[currentId]; 

// DOM要素の参照を取得
const elTitle = document.getElementById('probTitle');
const elDesc = document.getElementById('probDesc');
const elDifficulty = document.getElementById('probDifficulty');
const elBreadcrumb = document.getElementById('probIdDisplay');
const elInput = document.getElementById('probInput');
const elOutput = document.getElementById('probOutput');
const elUserCode = document.getElementById('userCode');
const elResult = document.getElementById('result');
const btnRun = document.getElementById('runBtn');

if (problem) {
    elBreadcrumb.textContent = `問題${currentId}`;
    elTitle.textContent = `問題${currentId}: ${problem.title}`;
    elDifficulty.textContent = problem.difficulty;
    elDesc.innerHTML = problem.description;
    elInput.textContent = problem.inputExample;
    elOutput.textContent = problem.outputExample;
    elUserCode.value = problem.defaultCode;

    // 難易度によってバッジの色を変更
    if (problem.difficulty.includes("中級")) {
        elDifficulty.style.backgroundColor = "#FF9800"; 
    } else if (problem.difficulty.includes("上級")) {
        elDifficulty.style.backgroundColor = "#F44336"; 
    }
    // 初級はCSSのデフォルト色を使用

} else {
    // 問題が見つからない場合の表示
    document.querySelector('.main-content').innerHTML = `
        <div style="text-align:center; padding: 50px;">
            <h2>問題が見つかりません</h2>
            <p>無効なURL、または問題IDが指定されていません。</p>
            <a href="problems.html" class="btn-secondary" style="display:inline-block; margin-top:20px; padding:10px 20px; background:#f0f0f0; text-decoration:none; color:#333; border-radius:4px;">問題一覧に戻る</a>
        </div>
    `;
}

// ----------------------------------------------------
// 4. 判定ロジックとイベントリスナー
// ----------------------------------------------------

function checkAnswer() {
    if (!problem) return;

    const userRawCode = elUserCode.value;
    const cleanUser = normalizeCode(userRawCode);
    const cleanExpected = normalizeCode(problem.expectedSnippet);

    // ユーザーのコード内に、期待されるコードスニペットが含まれているかを確認
    if (cleanUser.includes(cleanExpected)) {
         elResult.innerHTML = `
            <div class="msg success">
                <strong>🎉 正解です！</strong><br>
                素晴らしい！この調子で次の問題も解いてみましょう。
            </div>`;
    } else {
         elResult.innerHTML = `
            <div class="msg error">
                <strong>❌ 不正解です...</strong><br>
                ロジックが正しいか、スペルミスがないか確認してください。<br>
                <div style="margin-top:8px; font-size:0.9em; color:#721c24;">
                    ヒント: 期待される記述が含まれていません。
                </div>
            </div>`;
    }
}

// 実行ボタンにクリックイベントを設定
if (btnRun) {
    btnRun.addEventListener('click', checkAnswer);
}