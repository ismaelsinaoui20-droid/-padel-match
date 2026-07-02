require('dotenv').config();
console.log('GMAIL_USER:', process.env.GMAIL_USER);
console.log('GMAIL_APP_PASSWORD set:', !!process.env.GMAIL_APP_PASSWORD);

const { sendPasswordResetEmail } = require('./src/mailer');

sendPasswordResetEmail('kooliabdallah09@gmail.com', '123456')
  .then(() => console.log('Email envoyé avec succès !'))
  .catch((err) => console.error('Erreur envoi:', err.message));
