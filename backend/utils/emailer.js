const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendNotification(email, jobId, jobTitle) {
  const zipFilename = `${jobId}.zip`;
  const zipPath = path.join('/home/mishra_lab/extra_disk/af_outputs', zipFilename);

 
  const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; 
  let attachFile = true;
  let fileSize = 0;
  try {
    fileSize = fs.statSync(zipPath).size;
    if (fileSize > MAX_ATTACHMENT_SIZE) {
      attachFile = false;
    }
  } catch (err) {
    attachFile = false;
  }

  let mailOptions = {
    from: `"AlphaFold Server" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Your ${jobTitle} AlphaFold3 result is ready`,
    html: attachFile
      ? `<p>Your prediction job <b>${jobId}</b> has completed!</p>
         <p>Your result is attached to this email.</p>`
      : `<p>Your prediction job <b>${jobId}</b> has completed!</p>
         <p>The result file is too large to send by email. Please use the job search function on the website to download your output.</p>`
  };

  if (attachFile) {
    mailOptions.attachments = [
      {
        filename: zipFilename,
        path: zipPath
      }
    ];
  }

  await transporter.sendMail(mailOptions);
}

module.exports = sendNotification