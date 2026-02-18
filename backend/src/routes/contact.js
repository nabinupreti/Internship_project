import express from 'express';
import { sendContactAutoReply, sendContactNotification } from '../lib/email.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required.' });
  }

  const adminEmail = process.env.CONTACT_TO || process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return res.status(500).json({ message: 'Contact email is not configured.' });
  }

  try {
    await Promise.all([
      sendContactNotification({ to: adminEmail, name, email, message }),
      sendContactAutoReply({ to: email, name })
    ]);
    return res.json({ message: 'Message sent.' });
  } catch (error) {
    console.error('Contact email failed:', error.message);
    return res.status(500).json({ message: 'Unable to send message right now.' });
  }
});

export default router;
