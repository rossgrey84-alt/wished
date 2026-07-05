// Sends the user a clean, branded "Your plan is saved" email via Resend.
// Reads RESEND_API_KEY from the Vercel environment. Fails quietly if unset —
// never blocks the user, and the internal Formspree notification is separate.

export async function POST(req) {
  try {
    const { email, planUrl, style } = await req.json();

    // Basic guard — need a plausible email to send to.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ ok: false, reason: 'invalid_email' }, { status: 400 });
    }

    const key = process.env.RESEND_API_KEY;
    if (!key) {
      // No key configured yet — degrade gracefully, don't error the user.
      return Response.json({ ok: false, reason: 'not_configured' }, { status: 200 });
    }

    const FROM = 'Wished <hello@getwished.com>';
    const REPLY_TO = 'ross.grey84@gmail.com'; // <-- swap to the inbox you want replies in
    const safeUrl = typeof planUrl === 'string' ? planUrl : 'https://getwished.com/';
    const styleLine = style ? ` Your plan is set up as a <strong>${style}</strong>.` : '';

    const html = `
<div style="margin:0;padding:0;background:#f4f1ea;">
  <div style="max-width:480px;margin:0 auto;padding:36px 28px;font-family:Georgia,'Times New Roman',serif;color:#1c1917;">
    <div style="font-size:19px;letter-spacing:4px;color:#1c1917;margin-bottom:28px;">WISHED <span style="color:#9a7b2e;">&#10022;</span></div>
    <h1 style="font-size:24px;line-height:1.25;margin:0 0 14px;font-weight:normal;">Your Wished plan is saved.</h1>
    <p style="font-size:15px;line-height:1.6;color:#57534e;margin:0 0 8px;">We've saved your personalised Walt Disney World strategy.${styleLine}</p>
    <p style="font-size:15px;line-height:1.6;color:#57534e;margin:0 0 24px;">Open it any time from the link below — it's yours to keep, tweak and follow.</p>
    <a href="${safeUrl}" style="display:inline-block;background:#1c1917;color:#f4f1ea;text-decoration:none;padding:14px 30px;border-radius:10px;font-family:Helvetica,Arial,sans-serif;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Open my Wished plan</a>
    <p style="font-size:13px;line-height:1.6;color:#a8a29e;margin:28px 0 0;">We'll only use your email for genuinely useful reminders about this trip — dining, Lightning Lane and final checks before you travel. No spam.</p>
    <p style="font-size:13px;line-height:1.6;color:#a8a29e;margin:20px 0 0;">Wished &middot; getwished.com</p>
  </div>
</div>`.trim();

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: REPLY_TO,
        subject: 'Your Wished plan is saved',
        html,
      }),
    });

    return Response.json({ ok: r.ok }, { status: 200 });
  } catch (err) {
    // Never surface an error to the user over a confirmation email.
    return Response.json({ ok: false, reason: 'error' }, { status: 200 });
  }
}
