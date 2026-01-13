import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  service: process.env.SMTP_SERVICE,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Render EJS template
export const renderEmailTemplate = async (
  templateName: string,
  data: Record<string, any>,
): Promise<string> => {
  const templatePath = path.join(
    process.cwd(),
    'apps',
    'auth-service',
    'src',
    'utils',
    'email-templates',
    `${templateName}.ejs`,
  );

  return ejs.renderFile(templatePath, data);
};

// send email with OTP with nodemailer
export const sendEmailWithOtp = async (
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, any>,
) => {
  try {
    const htmlContent = await renderEmailTemplate(templateName, data);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.log('Error sending email', error);
    return false;
  }
};
