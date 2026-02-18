import { Resend } from 'resend';

let resendClient = null;

function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendVerificationEmail({ to, code }) {
  const from = process.env.RESEND_FROM || 'Job Portal <no-reply@resend.dev>';
  const subject = 'Verify your email';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <h2>Verify your email</h2>
      <p>Use this code to verify your account:</p>
      <p style="font-size:20px;font-weight:bold;letter-spacing:2px;">${code}</p>
      <p>This code expires in 15 minutes.</p>
    </div>
  `;

  const resend = getResendClient();
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Verification code for ${to}: ${code}`);
  }
  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    throw new Error('Email service not configured.');
  }

  await resend.emails.send({
    from,
    to,
    subject,
    html
  });
}

export async function sendContactNotification({ to, name, email, message }) {
  const from = process.env.RESEND_FROM || 'Job Portal <no-reply@resend.dev>';
  const subject = `New contact message from ${name}`;
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <h2>New contact message</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, '<br/>')}</p>
    </div>
  `;

  const resend = getResendClient();
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Contact message from ${email}: ${message}`);
  }
  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      return;
    }
    throw new Error('Email service not configured.');
  }

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    reply_to: email
  });
}

export async function sendContactAutoReply({ to, name }) {
  const from = process.env.RESEND_FROM || 'Job Portal <no-reply@resend.dev>';
  const subject = 'We received your message';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;">
      <p>Hi ${name || 'there'},</p>
      <p>Thanks for reaching out! We received your message and will get back to you shortly.</p>
      <p>– JobSphere Team</p>
    </div>
  `;

  const resend = getResendClient();
  if (!resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Auto-reply to ${to}: received.`);
      return;
    }
    throw new Error('Email service not configured.');
  }

  await resend.emails.send({
    from,
    to,
    subject,
    html
  });
}
