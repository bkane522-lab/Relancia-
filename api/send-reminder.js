const { kv } = require('@vercel/kv');
const { generateReminderText, sendReminderEmail } = require('./_lib/reminder');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id requis' });

    const invoices = (await kv.get('invoices')) || [];
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) return res.status(404).json({ error: 'Facture introuvable' });

    const invoice = invoices[index];
    const { subject, body } = await generateReminderText(invoice);
    await sendReminderEmail(invoice, subject, body);

    invoices[index].status = 'relancee';
    invoices[index].reminderCount += 1;
    invoices[index].lastReminderDate = new Date().toISOString();
    await kv.set('invoices', invoices);

    return res.status(200).json({ success: true, subject, body });
  } catch (err) {
    console.error('Erreur send-reminder:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
};
