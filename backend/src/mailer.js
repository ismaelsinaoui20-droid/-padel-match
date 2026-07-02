const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

async function sendPasswordResetEmail(toEmail, resetCode) {
  await mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: 'padelmatch30@gmail.com', Name: 'Padel Match' },
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
}

module.exports = { sendPasswordResetEmail };
