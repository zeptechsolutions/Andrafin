const { google } = require('googleapis');

const configured = () => Boolean(
  process.env.EMAIL_USER &&
  process.env.EMAIL_FROM &&
  process.env.GMAIL_CLIENT_ID &&
  process.env.GMAIL_CLIENT_SECRET &&
  process.env.GMAIL_REFRESH_TOKEN
);

const sendEmail = async ({ to, subject, html }) => {
  if (!configured()) {
    return { skipped: true, reason: 'Gmail API no configurada completamente' };
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2 });

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
  ].join('\r\n');

  const raw = Buffer.from(message).toString('base64url');
  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return {
    skipped: false,
    id: result.data.id,
    sender: process.env.EMAIL_USER,
  };
};

module.exports = { sendEmail, configured };
