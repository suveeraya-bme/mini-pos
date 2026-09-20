const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('ยังไม่ได้ตั้งค่า TELEGRAM_BOT_TOKEN หรือ TELEGRAM_CHAT_ID');
      return Response.json({ ok: false, error: 'missing config' }, { status: 200 });
    }

    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: text,
          parse_mode: 'HTML',
        }),
      }
    );

    const data = await tgRes.json();
    return Response.json({ ok: true, telegram: data });
  } catch (err) {
    console.error('Telegram notify route error:', err);
    return Response.json({ ok: false, error: String(err) }, { status: 200 });
  }
}
