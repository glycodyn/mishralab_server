import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function sendNotification(email, jobId) {
  await transporter.sendMail({
    from: `"AlphaFold Server" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your AlphaFold3 result is ready',
    html: `
      <p>Your prediction job <b>${jobId}</b> has completed!</p>
      <a href="http://localhost:5000/download/${jobId}">Download your result</a>
    `
  });
}