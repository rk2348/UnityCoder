/* --- problems_data.js --- */
// ここにすべての問題データを管理します
// script.js で import できるように export を付けています

export const problemsData = [
    {
        id: "prob_001",
        title: "Hello Unity World",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 100,
        description: `<p>Unityのコンソールに「Hello World」と表示するスクリプトを作成してください。</p><p><code>Start</code> メソッド内で <code>Debug.Log</code> を使用してください。</p>`,
        constraints: `<ul><li>表示する文字列は正確に "Hello World" であること。</li></ul>`,
        inputExample: "なし",
        outputExample: "Hello World",
        // ▼▼▼ ここに modelAnswer を追加 ▼▼▼
        modelAnswer: `using UnityEngine;\n\npublic class HelloWorld : MonoBehaviour\n{\n    void Start()\n    {\n        Debug.Log("Hello World");\n    }\n}`,
        // ▲▲▲ 追加終わり ▲▲▲
        initialCode: `using UnityEngine;\n\npublic class HelloWorld : MonoBehaviour\n{\n    void Start()\n    {\n        // ここにコードを書いてください\n        \n    }\n}`
    },
    {
        id: "prob_002",
        title: "Cubeの移動",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 100,
        description: `<p><code>Update</code> メソッドを使用して、CubeをX軸方向に移動させてください。</p><p>毎フレーム <code>0.1f</code> ずつ移動させること。</p>`,
        constraints: `<ul><li>Transform.Translate または position を直接操作すること。</li></ul>`,
        inputExample: "なし",
        outputExample: "Cubeのx座標が増加する",
        initialCode: `using UnityEngine;\n\npublic class MoveCube : MonoBehaviour\n{\n    void Update()\n    {\n        // ここにコードを書いてください\n    }\n}`
    },
    {
        id: "prob_003",
        title: "Rigidbody ジャンプ",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 200,
        description: `<p>Rigidbodyを使ってオブジェクトをジャンプさせてください。</p><p>スペースキーが押された瞬間に上方向へ力を加えます。</p>`,
        constraints: `<ul><li>ジャンプ力は 5.0f</li><li>ForceMode.Impulseを使用</li></ul>`,
        inputExample: "Space Key",
        outputExample: "Velocity Y > 0",
        initialCode: `using UnityEngine;\n\npublic class PlayerJump : MonoBehaviour\n{\n    public float jumpForce = 5.0f;\n    private Rigidbody rb;\n\n    void Start()\n    {\n        rb = GetComponent<Rigidbody>();\n    }\n\n    void Update()\n    {\n        // ここにコードを書いてください\n    }\n}`
    }
];