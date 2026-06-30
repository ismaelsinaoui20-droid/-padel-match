const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendPasswordResetEmail(toEmail, resetCode) {
  await transporter.sendMail({
    from: `"Padel Match" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Code de réinitialisation de mot de passe',
    html: `
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
  });
}

module.exports = { sendPasswordResetEmail };
