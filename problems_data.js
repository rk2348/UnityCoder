/* --- problems_data.js --- */
// ここにすべての問題データを管理します

const problemsData = [
    {
        id: "prob_001",
        title: "Hello Unity World",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 100,
        // HTMLタグを含めて記述できます
        description: `
            <p>Unityのコンソールに「Hello World」と表示するスクリプトを作成してください。</p>
            <p><code>Start</code> メソッド内で <code>Debug.Log</code> を使用してください。</p>
        `,
        constraints: `
            <ul>
                <li>表示する文字列は正確に "Hello World" であること。</li>
            </ul>
        `,
        inputExample: "なし",
        outputExample: "Hello World",
        initialCode: `using UnityEngine;

public class HelloWorld : MonoBehaviour
{
    void Start()
    {
        // ここにコードを書いてください
        
    }
}`
    },
    {
        id: "prob_002",
        title: "Cubeの移動",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 100,
        description: `
            <p><code>Update</code> メソッドを使用して、CubeをX軸方向に移動させてください。</p>
            <p>毎フレーム <code>0.1f</code> ずつ移動させること。</p>
        `,
        constraints: `
            <ul>
                <li>Transform.Translate または position を直接操作すること。</li>
            </ul>
        `,
        inputExample: "なし",
        outputExample: "Cubeのx座標が増加する",
        initialCode: `using UnityEngine;

public class MoveCube : MonoBehaviour
{
    void Update()
    {
        // ここにコードを書いてください
    }
}`
    },
    {
        id: "prob_003",
        title: "Rigidbody ジャンプ",
        timeLimit: "2 sec",
        memoryLimit: "1024 MB",
        score: 200,
        description: `
            <p>Unityの <code>Rigidbody</code> コンポーネントを使用して、オブジェクトをジャンプさせるスクリプトを作成してください。</p>
            <p>シーン上には <code>Player</code> というタグが付いた Cube が存在します。<br>
            スペースキーが押された瞬間に、Y軸方向（上方向）に力 <code>AddForce</code> を加えてください。</p>
        `,
        constraints: `
            <ul>
                <li>ジャンプ力は <code>5.0f</code> とすること。</li>
                <li>ForceMode は <code>Impulse</code> を使用すること。</li>
            </ul>
        `,
        inputExample: "Input.GetKeyDown(KeyCode.Space) == true",
        outputExample: "Rigidbody.velocity.y > 0",
        initialCode: `using UnityEngine;

public class PlayerJump : MonoBehaviour
{
    public float jumpForce = 5.0f;
    private Rigidbody rb;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
    }

    void Update()
    {
        // ここにコードを書いてください
    }
}`
    }
];