# Confidentialité & Conformité RGPD

## 1. Ce que nous ne voyons jamais

AnonDoc est conçu de sorte que nous n'ayons structurellement pas accès aux données suivantes :

- **Contenu des documents** — l'anonymisation s'effectue entièrement dans votre navigateur
- **Données originales** — noms, numéros de téléphone, IBAN, numéros fiscaux et toutes autres données personnelles
- **Clés de déchiffrement** — le coffre est stocké uniquement localement dans votre navigateur
- **Réponses de l'IA** — également traitées uniquement localement

Aucun employé, technicien ou agent du support d'AnonDoc ne peut consulter vos documents.

## 2. Ce que nous stockons

Pour le fonctionnement du service, nous stockons exclusivement :

- **Adresse e-mail** — pour la connexion et la communication
- **Hash du mot de passe** — Argon2id avec t=3, m=65536, p=4 (jamais le mot de passe en clair)
- **Statut de l'abonnement** — Free ou Business, pour le contrôle d'accès
- **Journaux de connexion** — horodatage de la dernière connexion
- **Compteur de documents** — nombre de documents traités par mois (uniquement le chiffre, pas le contenu)

## 3. Coffre cloud (Business)

Dans le plan Business, nous proposons un coffre cloud optionnel pour la synchronisation entre appareils. L'architecture :

- **Chiffrement côté client** — AES-256-GCM avec PBKDF2-SHA256 (600 000 itérations)
- **Dérivation de clé** — uniquement sur votre appareil, jamais transmise à nos serveurs
- **Zero-Knowledge** — même avec le coffre cloud, nous n'avons pas accès à vos clés de déchiffrement
- **Transmission** — seuls des blobs chiffrés sont synchronisés

## 4. Détails techniques

- **Chiffrement symétrique :** AES-256-GCM
- **Dérivation de clé :** PBKDF2-SHA256 avec 600 000 itérations
- **IV :** 12 octets, aléatoire cryptographiquement
- **Stockage navigateur :** IndexedDB, isolé par origine
- **CORS :** Strict — uniquement les origines autorisées
- **Cookies :** HttpOnly + Secure + SameSite=Lax

## 5. Vos droits selon le RGPD

Vous disposez des droits suivants conformément au RGPD :

- **Art. 15 — Droit d'accès :** Quelles données nous avons stockées vous concernant
- **Art. 16 — Droit de rectification :** Correction des données personnelles inexactes
- **Art. 17 — Droit à l'effacement :** Suppression complète de votre compte et de toutes les métadonnées
- **Art. 20 — Portabilité des données :** Export de vos données dans un format lisible par machine
- **Art. 21 — Droit d'opposition :** Opposition au traitement de vos données

Pour exercer vos droits : **datenschutz@anondoc.app**

## 6. DPA (Accord de traitement des données)

Dans le plan Business, nous fournissons un DPA conformément à l'Art. 28 RGPD, incluant :

- **Annexe CCT** (Clauses Contractuelles Types selon la décision UE 2021/914)
- Mesures techniques et organisationnelles (MTO)
- Liste des sous-traitants

## 7. Sous-traitants

| Fournisseur | Finalité | Statut RGPD |
|-------------|----------|-------------|
| Railway / Hetzner | Hébergement de l'infrastructure API | Conforme UE |
| Sendgrid | E-mails transactionnels | CCT en place |
| Plausible Analytics | Statistiques d'utilisation anonymes | Conforme RGPD, sans cookies |

## 8. Outils AIPD

Pour votre propre analyse d'impact relative à la protection des données (AIPD), nous fournissons un modèle dans le plan Business.

→ [Demander le modèle AIPD](mailto:datenschutz@anondoc.app?subject=Modele-AIPD)

## 9. Délégué à la protection des données

Contact : **datenschutz@anondoc.app**

## 10. Droit de réclamation

Vous avez le droit de déposer une plainte auprès d'une autorité de contrôle. La CNIL est compétente pour les utilisateurs français : [cnil.fr](https://www.cnil.fr)
