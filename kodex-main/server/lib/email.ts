import nodemailer from "nodemailer";

// Simple helper to send a real email
export async function sendOTPEmail(email: string, otp: string) {
  // Setup the transporter using environment variables
  // If no credentials are found, it falls back to console log for safety
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: (process.env.EMAIL_USER || "").trim(),
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ''),
    },
  });

  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
  const timeStr = expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Support forcing all dev emails to a single address so they receive test OTPs instantly
  const targetEmail = process.env.NODE_ENV !== 'production' ? (process.env.EMAIL_USER || email) : email;

  const mailOptions = {
    from: `"Kodex Authentication" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: `OTP for your Atrava Defense authentication`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 450px; background-color: #0d1117; color: #ffffff; padding: 40px; border-radius: 12px; margin: 0 auto; border: 1px solid #30363d;">
        <div style="margin-bottom: 25px;">
           <span style="font-size: 24px; font-weight: 700; color: #58a6ff; letter-spacing: -0.5px;">Atrava Defense</span>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #30363d; margin-bottom: 30px;">
        
        <p style="font-size: 16px; color: #c9d1d9; line-height: 1.6; margin-bottom: 25px;">
          To authenticate, please use the following One Time Password (OTP):
        </p>
        
        <div style="font-size: 42px; font-weight: 700; color: #ffffff; letter-spacing: 4px; margin: 30px 0; font-family: monospace;">
          ${otp}
        </div>
        
        <p style="font-size: 14px; color: #8b949e; margin-bottom: 30px; font-weight: 500;">
          This OTP will be valid for 15 minutes till <span style="color: #58a6ff;">${timeStr}</span>.
        </p>
        
        <div style="font-size: 13px; color: #8b949e; line-height: 1.6; background: #161b22; padding: 20px; border-radius: 8px;">
          Do not share this OTP with anyone. If you didn't make this request, you can safely ignore this email.
          <br><br>
          Atrava Defense will never contact you about this email or ask for any login codes or links. Beware of phishing scams.
        </div>
      </div>
    `,
  };

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`[SUCCESS] Real OTP Email sent to ${email}`);
    } else {
      console.log("------------------------------------------");
      console.log(`[SIMULATION] Email Credentials Missing!`);
      console.log(`[OTP] Sent to: ${email}`);
      console.log(`[CODE] ${otp}`);
      console.log("------------------------------------------");
    }
  } catch (error) {
    console.error(`[ERROR] Failed to send email:`, error);
    // Fallback if the real send fails
    console.log(`[FALLBACK] OTP for ${email}: ${otp}`);
  }
}
