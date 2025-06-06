const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendNotification(email, jobId) {
  const zipFilename = `${jobId}.zip`;
  const zipPath = path.join('/home/mishra_lab/af_output', zipFilename);
  await transporter.sendMail({
    from: `"AlphaFold Server" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your AlphaFold3 result is ready',
    html: `
      <p>Your prediction job <b>${jobId}</b> has completed!</p>
       <p>Your result is attached to this email.</p>
    `,
    attachments: [
      {
        filename: zipFilename,
        path: zipPath
      }
    ]
  });
}
module.exports = sendNotification;
