const https = require('https');

async function sendPasswordResetEmail(toEmail, resetCode) {
  const credentials = Buffer.from(
    `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`
  ).toString('base64');

  const body = JSON.stringify({
    Messages: [
      {
        From: { Email: 'padelmatch.app@outlook.com', Name: 'Padel Match' },
        To: [{ Email: toEmail }],
        Subject: 'Code de réinitialisation de mot de passe',
        HTMLPart: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
            <h2 style="color: #a3e635;">Padel Match</h2>
            <p>Tu as demandé à réinitialiser ton mot de passe.</p>
            <p>Voici ton code à 6 chiffres (valable 15 minutes) :</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #a3e635; margin: 24px 0;">
              ${resetCode}
            </div>
            <p>Si tu n'as pas fait cette demande, ignore cet email.</p>
          </div>
        `,
      },
    ],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.mailjet.com',
        path: '/v3.1/send',
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) reject(new Error(`Mailjet error ${res.statusCode}: ${data}`));
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
