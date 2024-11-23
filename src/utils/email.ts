import nodemailer from "nodemailer";

interface OptionsProps {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export const send_email = async function (options: OptionsProps) {
  // 1. Create a transporter
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 0,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2. Send email
  await transporter.sendMail(options);
};
