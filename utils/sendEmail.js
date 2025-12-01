// utils/sendEmail.js
const nodemailer = require('nodemailer');

async function sendEmail(to, subject, html) {
  // Use Gmail (or your preferred service)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,    // e.g., ninmikesaragena@gmail.com
      pass: process.env.EMAIL_APP_PASS // ⚠️ App Password, NOT regular password
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html
  };

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;