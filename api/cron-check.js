const { kv } = require('@vercel/kv');
const { generateReminderText, sendReminderEmail } = require('./_lib/reminder');

module.exports = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const invoices = (await kv.get('invoices')) || [];
    const today = new Date().toISOString().split('T')[0];
    const results = [];

    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];

      if (invoice.status === 'payee') continue;
      if (invoice.dueDate >= today) continue;

      if (invoice.lastReminderDate) {
        const daysSinceLast = Math.floor(
          (new Date() - new Date(invoice.lastReminderDate)) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLast < 5) continue;
      }

      if (invoice.reminderCount >= 4) continue;

      try {
        const { subject, body } = await generateReminderText(invoice);
        await sendReminderEmail(invoice, subject, body);

        invoices[i].status = 'relancee';
        invoices[i].reminderCount += 1;
        invoices[i].lastReminderDate = new Date().toISOString();

        results.push({ id: invoice.id, client: invoice.clientName, sent: true });
      } catch (innerErr) {
        console.error(`Erreur relance facture ${invoice.id}:`, innerErr);
        results.push({ id: invoice.id, client: invoice.clientName, sent: false, error: innerErr.message });
      }
    }

    await kv.set('invoices', invoices);

    return res.status(200).json({ success: true, checked: invoices.length, reminders: results });
  } catch (err) {
    console.error('Erreur cron-check:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
};
