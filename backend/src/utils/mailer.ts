import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(options: MailOptions) {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    ...options,
  });
}
