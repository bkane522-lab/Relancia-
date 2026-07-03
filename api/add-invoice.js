const { kv } = require('@vercel/kv');
const { randomUUID } = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { clientName, clientEmail, amount, dueDate, description } = req.body;

    if (!clientName || !clientEmail || !amount || !dueDate) {
      return res.status(400).json({ error: 'Champs obligatoires manquants (client, email, montant, échéance)' });
    }

    const invoice = {
      id: randomUUID(),
      clientName,
      clientEmail,
      amount: parseFloat(amount),
      dueDate,
      description: description || '',
      status: 'en_attente',
      reminderCount: 0,
      lastReminderDate: null,
      createdAt: new Date().toISOString()
    };

    const existing = (await kv.get('invoices')) || [];
    existing.push(invoice);
    await kv.set('invoices', existing);

    return res.status(200).json({ success: true, invoice });
  } catch (err) {
    console.error('Erreur add-invoice:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
};
