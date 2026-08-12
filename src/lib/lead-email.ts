/**
 * Branded HTML for the team-lead temporary password email.
 * Inline styles only — email clients strip <style> and external CSS.
 * Light, text-forward layout: deliverability is better than a dark, image-heavy
 * design, and the copy leads with the registration confirmation.
 */

const SITE = "https://blackhat-zero.lovable.app";
const LOGO = `${SITE}/__l5e/assets-v1/28752430-aad2-4348-bf7c-deba5c741b81/blackhat-logo.png`;
export const EVENT_NAME = "Black Hat Zero '26";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function leadPasswordEmailHtml(fullName: string, temp: string, teamName?: string) {
  const name = esc(fullName || "there");
  const pass = esc(temp);
  const team = teamName ? esc(teamName) : "";
  const teamLine = team
    ? `Your team <strong style="color:#111827;">${team}</strong> has been successfully registered for ${EVENT_NAME}.`
    : `Your team has been successfully registered for ${EVENT_NAME}.`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Registration confirmed</title></head>
<body style="margin:0;padding:0;background-color:#ffffff;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${team ? `${team}: ` : ""}registration confirmed for ${EVENT_NAME} — your team portal sign-in details are inside.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7f9;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:22px 28px;border-bottom:1px solid #eef0f3;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:12px;"><img src="${LOGO}" width="36" height="36" alt="" style="display:block;border:0;width:36px;height:auto;"></td>
            <td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#111827;letter-spacing:0.5px;">${EVENT_NAME}<div style="font-size:11px;font-weight:normal;color:#6b7280;padding-top:3px;">Hackathon for Hackers</div></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:26px 28px 0 28px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:19px;font-weight:bold;color:#111827;">Registration confirmed</div>
          <p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#374151;">Hi ${name},</p>
          <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#374151;">${teamLine} As the team leader, you can now sign in to the team portal to view your team details, attendance QR code and food tokens.</p>
        </td></tr>

        <tr><td style="padding:22px 28px 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <tr><td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;">
              <div style="font-size:11px;letter-spacing:1px;color:#6b7280;text-transform:uppercase;">Sign-in email</div>
              <div style="font-size:14px;color:#111827;padding-top:4px;">Your registered email address</div>
              <div style="font-size:11px;letter-spacing:1px;color:#6b7280;text-transform:uppercase;padding-top:14px;">Temporary password</div>
              <div style="font-family:'Courier New',Courier,monospace;font-size:19px;font-weight:bold;color:#111827;padding-top:5px;letter-spacing:1px;">${pass}</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:22px 28px 0 28px;">
          <a href="${SITE}/team" style="display:inline-block;background-color:#b91c1c;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;padding:12px 26px;border-radius:6px;">Open team portal</a>
        </td></tr>

        <tr><td style="padding:18px 28px 0 28px;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#6b7280;">For your security, you will be asked to set a new password immediately after your first sign-in. Please keep this password private and do not share it with anyone.</p>
        </td></tr>

        <tr><td style="padding:22px 28px 26px 28px;">
          <div style="height:1px;background-color:#eef0f3;font-size:0;line-height:0;">&nbsp;</div>
          <p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#9ca3af;">You are receiving this email because your team registered for ${EVENT_NAME}. This is an automated message — please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function leadPasswordEmailText(fullName: string, temp: string, teamName?: string) {
  const team = teamName ? `Your team ${teamName}` : "Your team";
  return `Hi ${fullName || "there"},

${team} has been successfully registered for ${EVENT_NAME}.

As the team leader, you can sign in to the team portal to view your team details, attendance QR code and food tokens.

Sign-in email: your registered email address
Temporary password: ${temp}

Open the team portal: ${SITE}/team

For your security, you will be asked to set a new password immediately after your first sign-in. Please keep this password private.

You are receiving this email because your team registered for ${EVENT_NAME}. This is an automated message - please do not reply.`;
}
