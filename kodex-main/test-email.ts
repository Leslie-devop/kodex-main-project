import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: (process.env.EMAIL_USER || "").trim(),
      pass: (process.env.EMAIL_PASS || "").replace(/\s+/g, ''), 

    },
  });

  try {
    let info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: "annapantene@gmail.com",
      subject: "Test",
      text: "test"
    });
    console.log("Success:", info.messageId);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
