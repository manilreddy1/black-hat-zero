/**
 * Branded HTML for the team-lead temporary password email.
 * Inline styles only — email clients strip <style> and external CSS.
 * Dark cyber theme matching the site: near-black surfaces, crimson accents,
 * monospace credentials, and a large logo lockup above the message.
 */

const SITE = "https://blackhat-zero.lovable.app";
const LOGO = `${SITE}/__l5e/assets-v1/28752430-aad2-4348-bf7c-deba5c741b81/blackhat-logo.png`;
export const EVENT_NAME = "Black Hat Zero '26";

const BG = "#0b0b0d";
const PANEL = "#121215";
const LINE = "#2a2a30";
const RED = "#e0243a";
const TEXT = "#e9e9ec";
const MUTED = "#9a9aa4";
const MONO = "'JetBrains Mono','Courier New',Courier,monospace";
const SANS = "'Trebuchet MS',Arial,Helvetica,sans-serif";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function leadPasswordEmailHtml(fullName: string, temp: string, teamName?: string) {
  const name = esc(fullName || "there");
  const pass = esc(temp);
  const team = teamName ? esc(teamName) : "";
  const teamLine = team
    ? `Your team <strong style="color:${RED};">${team}</strong> has been successfully registered for ${EVENT_NAME}.`
    : `Your team has been successfully registered for ${EVENT_NAME}.`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Registration confirmed</title></head>
<body style="margin:0;padding:0;background-color:${BG};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${team ? `${team}: ` : ""}registration confirmed for ${EVENT_NAME} — your team portal sign-in details are inside.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:${PANEL};border:1px solid ${LINE};border-radius:4px;overflow:hidden;">

        <tr><td style="height:3px;background-color:${RED};font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr><td align="center" style="padding:34px 28px 0 28px;">
          <img src="${LOGO}" width="140" alt="${EVENT_NAME}" style="display:block;border:0;width:140px;max-width:60%;height:auto;">
          <div style="font-family:${SANS};font-size:22px;font-weight:bold;color:${TEXT};letter-spacing:3px;padding-top:16px;text-transform:uppercase;">Black Hat Zero '26</div>
          <div style="font-family:${MONO};font-size:11px;color:${RED};letter-spacing:3px;padding-top:6px;text-transform:uppercase;">Hackathon for Hackers</div>
        </td></tr>

        <tr><td style="padding:26px 28px 0 28px;">
          <div style="height:1px;background-color:${LINE};font-size:0;line-height:0;">&nbsp;</div>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <div style="font-family:${MONO};font-size:12px;color:${RED};letter-spacing:2px;text-transform:uppercase;">&gt; registration confirmed</div>
          <p style="margin:14px 0 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${TEXT};">Hi ${name},</p>
          <p style="margin:10px 0 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${MUTED};">${teamLine} As the team leader, you can now sign in to the team portal to view your team details, attendance QR code and food tokens.</p>
        </td></tr>

        <tr><td style="padding:22px 28px 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0e0e11;border:1px solid ${LINE};border-left:3px solid ${RED};">
            <tr><td style="padding:18px 20px;font-family:${SANS};">
              <div style="font-family:${MONO};font-size:10px;letter-spacing:2px;color:${MUTED};text-transform:uppercase;">Sign-in email</div>
              <div style="font-size:14px;color:${TEXT};padding-top:5px;">Your registered email address</div>
              <div style="font-family:${MONO};font-size:10px;letter-spacing:2px;color:${MUTED};text-transform:uppercase;padding-top:16px;">Temporary password</div>
              <div style="font-family:${MONO};font-size:20px;font-weight:bold;color:${RED};padding-top:6px;letter-spacing:2px;">${pass}</div>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 28px 0 28px;">
          <a href="${SITE}/team" style="display:inline-block;background-color:${RED};color:#ffffff;text-decoration:none;font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:13px 30px;border-radius:2px;">Open team portal</a>
        </td></tr>

        <tr><td style="padding:18px 28px 0 28px;">
          <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.65;color:${MUTED};">For your security, you will be asked to set a new password immediately after your first sign-in. Keep this password private and do not share it with anyone.</p>
        </td></tr>

        <tr><td style="padding:24px 28px 28px 28px;">
          <div style="height:1px;background-color:${LINE};font-size:0;line-height:0;">&nbsp;</div>
          <p style="margin:14px 0 0 0;font-family:${MONO};font-size:11px;line-height:1.7;color:#6f6f78;">You are receiving this email because your team registered for ${EVENT_NAME}. Automated message — do not reply.</p>
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
