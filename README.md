# Relancia — Guide d'installation

## 1. Structure des fichiers
Colle chaque fichier dans GitHub exactement à cet emplacement :

```
index.html
manifest.json
sw.js
package.json
vercel.json
api/add-invoice.js
api/list-invoices.js
api/update-invoice.js
api/send-reminder.js
api/cron-check.js
api/_lib/reminder.js
```

## 2. Créer le stockage (Vercel KV / Upstash) — GRATUIT
1. Va sur ton projet dans le dashboard Vercel
2. Onglet **Storage** → **Create Database** → choisis **KV** (Upstash Redis)
3. Nom-le "relancia-db", crée-le
4. Vercel connecte automatiquement les variables d'environnement (KV_REST_API_URL, KV_REST_API_TOKEN, etc.) à ton projet — rien à faire de plus ici

## 3. Créer un compte Resend (envoi d'emails) — GRATUIT
1. Va sur resend.com, crée un compte
2. Récupère ta clé API (commence par `re_`)
3. Dans **Settings > Domains**, ajoute et vérifie un domaine (ou utilise le domaine de test Resend pour commencer, limité à ton propre email)

## 4. Variables d'environnement à ajouter dans Vercel
Vercel → ton projet → **Settings > Environment Variables** :

| Nom | Valeur |
|---|---|
| `GROQ_API_KEY` | ta clé Groq existante |
| `RESEND_API_KEY` | ta clé Resend (re_...) |
| `FROM_EMAIL` | ex : relances@tondomaine.fr (doit être vérifié sur Resend) |
| `CRON_SECRET` | une phrase secrète de ton choix (optionnel mais recommandé) |

Redéploie après avoir ajouté les variables.

## 5. Le cron automatique
`vercel.json` déclenche `/api/cron-check` **tous les jours à 7h UTC** (donc 8h ou 9h heure française selon la saison). Il vérifie toutes les factures en retard et envoie une relance automatiquement, en espaçant les relances de 5 jours minimum, avec un plafond de 4 relances par facture.

⚠️ Les Cron Jobs Vercel sur le plan **Hobby (gratuit)** sont limités à un déclenchement par jour — parfait pour ce cas d'usage.

## 6. Tester avant de compter dessus
- Ajoute une facture test avec une date d'échéance passée (hier)
- Appelle manuellement `https://tonapp.vercel.app/api/cron-check` dans le navigateur pour vérifier que la relance part bien
- Vérifie que l'email arrive (regarde aussi les spams au début)

## Notes
- Le quota gratuit Groq peut se vider vite si tu as beaucoup de factures/utilisateurs — surveille comme sur Pronostics IA Pro
- Resend gratuit = environ 3000 emails/mois et 100/jour, largement suffisant pour démarrer
- Cette V1 est mono-utilisateur (une seule liste de factures partagée). Si tu veux plusieurs comptes clients plus tard (mode multi-PME), il faudra ajouter une authentification — étape naturelle pour une V2.
