/**
 * Branded HTML for the team-lead temporary password email.
 * Inline styles only — email clients strip <style> and external CSS.
 */

const SITE = "https://blackhat-zero.lovable.app";
const LOGO = `${SITE}/__l5e/assets-v1/28752430-aad2-4348-bf7c-deba5c741b81/blackhat-logo.png`;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function leadPasswordEmailHtml(fullName: string, temp: string) {
  const name = esc(fullName || "there");
  const pass = esc(temp);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your BLACK HAT ZERO '26 team portal access code.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#0a0a0b;border:1px solid #2a2a2e;border-radius:14px;overflow:hidden;">
        <tr><td style="height:3px;background-color:#e11d2e;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td align="center" style="padding:28px 28px 8px 28px;">
          <img src="${LOGO}" width="72" height="72" alt="BLACK HAT ZERO" style="display:block;border:0;width:72px;height:auto;">
        </td></tr>
        <tr><td align="center" style="padding:8px 28px 0 28px;">
          <div style="font-family:'Courier New',Courier,monospace;font-size:20px;letter-spacing:2px;color:#f5f5f5;font-weight:bold;">BLACK HAT ZERO '26</div>
          <div style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:3px;color:#e11d2e;padding-top:6px;">HACKATHON FOR HACKERS</div>
        </td></tr>
        <tr><td style="padding:24px 28px 0 28px;">
          <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#e7e7e9;">Hi ${name},</p>
          <p style="margin:0 0 20px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#a8a8ae;">Your team is <strong style="color:#e7e7e9;">confirmed</strong>. Use the temporary access code below to sign in to the team portal.</p>
        </td></tr>
        <tr><td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#131316;border:1px dashed #e11d2e;border-radius:10px;">
            <tr><td align="center" style="padding:18px 12px;">
              <div style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:2px;color:#8a8a90;padding-bottom:8px;">TEMPORARY PASSWORD</div>
              <div style="font-family:'Courier New',Courier,monospace;font-size:22px;letter-spacing:2px;color:#ffffff;font-weight:bold;">${pass}</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:24px 28px 4px 28px;">
          <a href="${SITE}/team" style="display:inline-block;background-color:#e11d2e;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;padding:13px 30px;border-radius:8px;">OPEN TEAM PORTAL</a>
        </td></tr>
        <tr><td style="padding:20px 28px 0 28px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8a8a90;">You'll be asked to set your own password immediately after signing in. Keep this code private — it grants access to your team's details, attendance QR and food tokens.</p>
        </td></tr>
        <tr><td style="padding:22px 28px 26px 28px;">
          <div style="height:1px;background-color:#2a2a2e;font-size:0;line-height:0;">&nbsp;</div>
          <p style="margin:16px 0 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;line-height:1.6;color:#6b6b71;">// think like a hacker, innovate like a leader...</p>
          <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6b6b71;">BLACK HAT ZERO '26 &middot; Automated message, please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
