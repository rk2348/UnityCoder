// js/contact.js
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { db, auth } from "./config.js";

export function initContact() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('contact-name').value;
            const email = document.getElementById('contact-email').value;
            const subject = document.getElementById('contact-subject').value;
            const message = document.getElementById('contact-message').value;
            const sendBtn = document.getElementById('sendContactBtn');

            if (!name || !message) {
                alert("必須項目を入力してください");
                return;
            }

            sendBtn.disabled = true;
            sendBtn.textContent = "送信中...";

            try {
                const user = auth.currentUser;
                await addDoc(collection(db, "contacts"), {
                    name: name,
                    email: email,
                    subject: subject,
                    message: message,
                    uid: user ? user.uid : "anonymous",
                    createdAt: new Date(),
                    status: "unread" // 未読管理用
                });

                alert("お問い合わせを送信しました。\nありがとうございました。");
                contactForm.reset();
            } catch (err) {
                console.error("送信エラー:", err);
                alert("送信に失敗しました。時間をおいて再度お試しください。");
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = "送信する";
            }
        });
    }
}