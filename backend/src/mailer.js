const https = require('https');

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: process.env.GMAIL_CLIENT_ID,
    client_secret: process.env.GMAIL_CLIENT_SECRET,
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString();

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const parsed = JSON.parse(data);
          if (parsed.error) reject(new Error(`Token error: ${parsed.error_description}`));
          else resolve(parsed.access_token);
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function sendPasswordResetEmail(toEmail, resetCode) {
  const accessToken = await getAccessToken();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
      <h2 style="color: #a3e635;">Padel Match</h2>
      <p>Tu as demandé à réinitialiser ton mot de passe.</p>
      <p>Voici ton code à 6 chiffres (valable 15 minutes) :</p>
      <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #a3e635; margin: 24px 0;">
        ${resetCode}
      </div>
      <p>Si tu n'as pas fait cette demande, ignore cet email.</p>
    </div>
  `;

  const message = [
    'From: Padel Match <padelmatch30@gmail.com>',
    `To: ${toEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from('Code de réinitialisation de mot de passe').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n');

  const encodedMessage = Buffer.from(message).toString('base64url');
  const body = JSON.stringify({ raw: encodedMessage });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'gmail.googleapis.com',
        path: '/gmail/v1/users/me/messages/send',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) reject(new Error(`Gmail API error ${res.statusCode}: ${data}`));
          else resolve();
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { sendPasswordResetEmail };
