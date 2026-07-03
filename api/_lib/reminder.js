const { Resend } = require('resend');

async function generateReminderText(invoice) {
  const daysLate = Math.floor(
    (new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
  );

  const prompt = `Tu rédiges un email de relance de facture impayée en français, pour un(e) freelance ou une petite entreprise qui relance un client professionnel.

Contexte :
- Client : ${invoice.clientName}
- Montant dû : ${invoice.amount.toFixed(2)} €
- Date d'échéance dépassée : ${invoice.dueDate}
- Retard : ${daysLate} jour(s)
- Description de la prestation : ${invoice.description || 'non précisée'}
- Nombre de relances déjà envoyées : ${invoice.reminderCount}

Consignes de ton :
- Si c'est la 1ère relance (reminderCount = 0) : ton courtois et bienveillant, suppose un oubli.
- Si c'est la 2ème (reminderCount = 1) : ton plus ferme mais toujours professionnel.
- Si c'est la 3ème ou plus : ton clair, direct, mentionne poliment les conséquences possibles (pénalités de retard légales) sans être agressif.

Réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans markdown, au format exact :
{"subject": "...", "body": "..."}

Le corps de l'email doit être prêt à envoyer, avec une formule de politesse finale, mais SANS nom d'expéditeur à la fin (sera ajouté séparément).`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    throw new Error(`Erreur Groq: ${response.status}`);
  }

  const data = await response.json();
  let text = data.choices[0].message.content.trim();
  text = text.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    parsed = {
      subject: `Relance facture - ${invoice.clientName}`,
      body: text
    };
  }

  return parsed;
}

async function sendReminderEmail(invoice, subject, body) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: invoice.clientEmail,
    subject,
    text: body
  });

  return result;
}

module.exports = { generateReminderText, sendReminderEmail };
