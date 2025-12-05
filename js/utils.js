import { DISCORD_WEBHOOK_URL } from "./config.js";

export async function sendDiscordMessage(content, embed = null) {
    if (!DISCORD_WEBHOOK_URL) return;
    const body = {};
    if (content) body.content = content;
    if (embed) body.embeds = [embed];

    try {
        await fetch(DISCORD_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
    } catch (e) { console.error("Discord通知エラー:", e); }
}