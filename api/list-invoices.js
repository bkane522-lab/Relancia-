const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const invoices = (await kv.get('invoices')) || [];
    const today = new Date().toISOString().split('T')[0];
    invoices.sort((a, b) => {
      const aLate = a.status !== 'payee' && a.dueDate < today;
      const bLate = b.status !== 'payee' && b.dueDate < today;
      if (aLate !== bLate) return aLate ? -1 : 1;
      return a.dueDate.localeCompare(b.dueDate);
    });

    return res.status(200).json({ invoices });
  } catch (err) {
    console.error('Erreur list-invoices:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
};
