const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { id, action } = req.body;

    if (!id || !action) {
      return res.status(400).json({ error: 'id et action requis' });
    }

    const invoices = (await kv.get('invoices')) || [];
    const index = invoices.findIndex((inv) => inv.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    if (action === 'mark-paid') {
      invoices[index].status = 'payee';
    } else if (action === 'delete') {
      invoices.splice(index, 1);
    } else {
      return res.status(400).json({ error: 'Action inconnue' });
    }

    await kv.set('invoices', invoices);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Erreur update-invoice:', err);
    return res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
};
