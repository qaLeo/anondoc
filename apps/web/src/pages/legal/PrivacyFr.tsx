import { Link } from 'react-router-dom'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111827', marginBottom: 12 }}>{title}</h2>
      <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.75 }}>{children}</div>
    </section>
  )
}

export function PrivacyFr() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'inherit' }}>
      <header style={{
        borderBottom: '1px solid #e5e7eb', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#ffffff',
      }}>
        <Link to="/fr" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="7" fill="#1a56db" />
            <path d="M8 10h12M8 14h8M8 18h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>AnonDoc</span>
        </Link>
        <Link to="/fr" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>← Retour</Link>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8 }}>
          Politique de Confidentialité
        </h1>
        <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 40 }}>
          Dernière mise à jour : Avril 2026
        </p>

        <Section title="1. Principe : Architecture Zero-Knowledge">
          <p>
            AnonDoc est conçu pour ne jamais accéder à vos données. Le traitement des documents
            (anonymisation, analyse, tokenisation) s'effectue à 100 % localement dans votre navigateur
            via des Web Workers. Aucun contenu de document, texte ou métadonnée n'est jamais transmis
            à nos serveurs, enregistré ou partagé avec des tiers.
          </p>
        </Section>

        <Section title="2. Données Collectées">
          <p>Nous ne collectons que les données strictement nécessaires à la gestion du compte :</p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Données de compte :</strong> adresse e-mail et hash du mot de passe
              (stocké chiffré via bcrypt) pour la connexion et la gestion des abonnements.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Données de demande commerciale :</strong> si vous soumettez un formulaire de
              contact professionnel, nous collectons les données que vous fournissez (nom de
              l'entreprise, rôle, pays, secteur, volume prévu, e-mail, message) pour répondre à votre
              demande.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Données de paiement :</strong> AnonDoc ne traite actuellement aucun paiement.
              Lors du lancement des plans payants, le traitement des paiements sera assuré par Stripe ;
              cette Politique de Confidentialité sera mise à jour en conséquence avant toute activation
              du traitement des paiements.
            </li>
            <li>
              <strong>Absence de traceurs :</strong> AnonDoc n'utilise pas de cookies de traçage, Google
              Analytics, le fingerprinting ou tout autre outil d'analyse tiers.
            </li>
          </ul>
        </Section>

        <Section title="3. Service de Messagerie">
          <p>
            Les e-mails transactionnels (vérification de compte, réponses aux demandes commerciales,
            confirmations de la liste d'attente Pro) sont envoyés via <strong>Resend</strong>{' '}
            (resend.com), avec traitement en région UE (Irlande). Resend ne traite que l'adresse
            e-mail et le contenu du message nécessaires à la livraison.
          </p>
        </Section>

        <Section title="4. Données Locales & Clés de Document">
          <p>
            L'historique des sessions d'anonymisation et les Clés de Document (fichiers .key) générés
            par l'application sont stockés exclusivement dans le stockage local de votre appareil
            (IndexedDB), chiffré avec AES-256-GCM.
          </p>
          <p style={{ marginTop: 8 }}>
            <strong>Vous avez le contrôle total :</strong> vider le cache de votre navigateur supprime
            définitivement tout l'historique local et toutes les clés. Nous ne pouvons pas les
            récupérer.
          </p>
        </Section>

        <Section title="5. Clés de Document & Sécurité">
          <p>
            Lorsque vous téléchargez une Clé de Document (.key), elle est générée localement sur votre
            appareil. Les serveurs AnonDoc n'en reçoivent jamais une copie. Sans cette clé, la
            restauration mathématique des données originales est impossible. Conservez-la précieusement
            — nous ne pouvons pas la restaurer pour vous.
          </p>
        </Section>

        <Section title="6. Vos Droits (RGPD)">
          <p>
            En vertu du RGPD, vous disposez du droit d'accéder, de rectifier, d'effacer, de limiter
            et de porter vos données personnelles, et de vous opposer au traitement.
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>
              Pour exercer vos droits concernant vos <strong>données de compte</strong> (e-mail) :
              contactez-nous à{' '}
              <a href="mailto:dpo@anondoc.app" style={{ color: '#1a56db' }}>
                dpo@anondoc.app
              </a>
            </li>
            <li style={{ marginBottom: 6 }}>
              Pour effacer les <strong>données de document locales</strong> : videz le stockage du
              site anondoc.app dans votre navigateur.
            </li>
            <li>
              Vous avez le droit d'introduire une réclamation auprès de l'autorité nationale de
              protection des données compétente.
            </li>
          </ul>
        </Section>

        <Section title="7. Conservation des Données">
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>
              <strong>Données de compte :</strong> conservées pendant la durée d'activité de votre
              compte. Après suppression du compte, supprimées dans les 30 jours de la base de
              production et dans les 90 jours des sauvegardes.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong>Données de demande commerciale :</strong> conservées jusqu'à 24 mois à des fins
              de suivi, puis supprimées.
            </li>
            <li>
              <strong>Données locales du navigateur :</strong> entièrement sous votre contrôle.
            </li>
          </ul>
        </Section>

        <Section title="8. Modifications de Cette Politique">
          <p>
            Nous informerons les utilisateurs par e-mail de tout changement substantiel apporté à
            cette Politique de Confidentialité. Dernière mise à jour : Avril 2026.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Pour toute question relative à la confidentialité :{' '}
            <a href="mailto:dpo@anondoc.app" style={{ color: '#1a56db' }}>
              dpo@anondoc.app
            </a>
          </p>
        </Section>
      </main>

      <footer style={{
        padding: '24px 32px', borderTop: '1px solid #e5e7eb',
        textAlign: 'center', fontSize: 12, color: '#9ca3af',
      }}>
        <Link to="/fr" style={{ color: '#9ca3af', textDecoration: 'underline' }}>AnonDoc</Link>
        {' · '}
        <a href="mailto:dpo@anondoc.app" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
          dpo@anondoc.app
        </a>
      </footer>
    </div>
  )
}
