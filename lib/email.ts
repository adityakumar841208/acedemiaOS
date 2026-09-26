import nodemailer from "nodemailer";

function getTransporter() {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email service is not configured. Add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS.");
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `AcademiaOS <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your AcademiaOS password",
    text: `Use this link to reset your password: ${resetUrl}\n\nThis link expires in 30 minutes. If you did not request this, you can ignore this email.`,
    html: `<p>Use the link below to reset your AcademiaOS password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}