export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const body = req.body;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('Discord webhook URL not configured in Vercel environment variables.');
        return res.status(200).json({ success: false, message: 'Webhook not configured' });
    }

    let payload = {};

    if (body.type === 'question' && body.question) {
        const q = body.question;
        payload = {
            content: '📬 **質問箱に新しい質問が投稿されました！**',
            embeds: [
                {
                    title: '質問内容',
                    description: q.content,
                    color: 0x6c63ff, // Primary accent color
                    fields: [
                        { name: '投稿者', value: q.name || '匿名', inline: true },
                        { name: '確認', value: `[質問箱を開く](${body.url})`, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        };
    } else if (body.type === 'answer' && body.answer) {
        const a = body.answer;
        payload = {
            content: '💬 **質問に新しい回答が投稿されました！**',
            embeds: [
                {
                    title: '回答内容',
                    description: a.content,
                    color: a.isOwner ? 0xe8870a : 0x16a34a, // Owner badge color or success color
                    fields: [
                        { name: '投稿者', value: a.name || '匿名', inline: true },
                        { name: '確認', value: `[質問箱を開く](${body.url})`, inline: true }
                    ],
                    timestamp: new Date().toISOString()
                }
            ]
        };
    } else {
        return res.status(400).json({ error: 'Invalid payload type' });
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Discord API Error:', response.status, response.statusText);
            throw new Error(`Discord API responded with ${response.status}`);
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Discord notification error:', error);
        return res.status(500).json({ error: 'Failed to send notification' });
    }
}
