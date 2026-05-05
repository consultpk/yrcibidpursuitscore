import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
})

export async function sendOtpEmail(to, code) {
  await transporter.sendMail({
    from: `"YRCI Bid Pursuit" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your login code',
    text: `Your 6-digit login code is: ${code}\n\nExpires in 10 minutes. Do not share this code.`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:32px 24px">
        <div style="background:linear-gradient(135deg,#1a0030,#7a00df);color:#fff;padding:20px 24px;border-radius:10px;margin-bottom:24px">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:.6;margin-bottom:6px">YRCI · Bid Pursuit</div>
          <div style="font-size:18px;font-weight:700">Your login code</div>
        </div>
        <p style="color:#5a6a8a;font-size:14px;margin:0 0 20px">Use this code to sign in. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:42px;font-weight:800;letter-spacing:10px;color:#7a00df;text-align:center;padding:20px;background:#f5eeff;border-radius:10px;margin-bottom:20px">${code}</div>
        <p style="color:#aab4cc;font-size:12px;margin:0">If you didn't request this, you can safely ignore this email.</p>
      </div>`,
  })
}
