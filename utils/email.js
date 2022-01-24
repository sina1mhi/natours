const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // CREATE TRANSPORTER SERVICE
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  // CREATE MAIL OPTIONS
  const mailOptions = {
    from: 'Natours Application <support@natours.dev>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  // SEND EMAIL
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
