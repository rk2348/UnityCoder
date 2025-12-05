import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAUsbrJkcXRE9N5V5R4Ze3cwnrXJJPN92Q",
  authDomain: "unitycoder-65ff6.firebaseapp.com",
  projectId: "unitycoder-65ff6",
  storageBucket: "unitycoder-65ff6.firebasestorage.app",
  messagingSenderId: "85233576566",
  appId: "1:85233576566:web:756718f4b30c08134dcd57",
  measurementId: "G-FM0BEDSBH8"
};

// アプリ起動
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Discord Webhook URL
export const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1445488372771455018/V8SAVsok2-uTa3Xt_g4ZJv8qXo-lKfPg_pkiEv7f144Tl9OuZqBhxQUt18a8edpQ56fr";