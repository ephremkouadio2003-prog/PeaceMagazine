# Activer les commandes en ligne

Le site est **entièrement statique** : il n'y a aucun serveur à louer, aucune base
de données à gérer. Les commandes arrivent directement dans **ton Google Drive**
grâce à un petit script Google (`apps-script/Code.gs`).

Tant que ce script n'est pas installé, le formulaire affiche :
« La commande en ligne n'est pas encore activée. » Tout le reste du site
(galerie, feuilletage, vidéos, WhatsApp) fonctionne sans lui.

---

## Ce que fait le script

À chaque commande validée sur le site, il :

1. **Crée un dossier dans ton Drive**, nommé `CMD-20261009-143052 — Nom de la personne`,
   rangé dans un dossier parent **« Peace Magazine — Commandes »**.
2. **Y dépose une fiche en Google Docs** (`Fiche commande — CMD-…`) : coordonnées
   du client, personne célébrée, occasion, histoire et anecdotes, témoignages,
   style, couleurs, date et adresse de livraison — le tout mis en forme, que tu
   peux annoter et commenter directement.
3. **Enregistre les photos** dans un sous-dossier `Photos/`, numérotées dans l'ordre.
   La photo choisie comme couverture est préfixée `COUVERTURE`.
4. **Complète la fiche** avec une section « Photos, légendes et textes » : pour
   chaque photo, sa légende courte et son texte long si la cliente en a écrit un
   (les deux sont aussi placés en description du fichier dans Drive, visibles au
   survol de la photo).
5. **Ajoute une ligne dans un Google Sheet** « Peace Magazine — Suivi des commandes »,
   avec toutes les informations, le lien vers le dossier, et un **statut** que tu
   fais évoluer à la main.

> **Pourquoi un Google Docs et pas un fichier texte ?** Un document Google se lit
> et se modifie directement dans le navigateur, accepte la mise en forme et les
> commentaires, et — contrairement à un `.txt` — **ne consomme pas ton quota de
> stockage Drive**.

Le client voit ensuite ton lien de paiement d'acompte, puis un bouton WhatsApp
pré-rempli pour t'envoyer son nom, son numéro et l'heure du paiement.

### Les protections en place

Le script est forcément ouvert à tous (sinon tes clientes devraient avoir un
compte Google). La sécurité repose donc sur des garde-fous :

| Protection | Détail |
|---|---|
| Types de fichiers | Images uniquement (JPEG, PNG, WebP, HEIC). L'extension est imposée par le script. |
| Taille | 12 Mo maximum par photo |
| Quantité | 80 photos maximum par commande |
| Texte | 4 000 caractères par champ du questionnaire, 1 500 par texte de photo |
| Débit | 20 commandes par heure maximum |
| Google Sheets | Les réponses commençant par `=` sont neutralisées (sinon elles seraient exécutées comme des formules) |
| Numéro de commande | Doit correspondre exactement au format généré, pour empêcher l'accès à un autre dossier |

Tes données restent dans **ton** Drive : personne d'autre n'y a accès.

---

## Installation (10 minutes, une seule fois)

### 1. Créer le script

1. Ouvre **[script.new](https://script.new)** en étant connecté au compte Google
   qui doit recevoir les commandes.
2. Efface le contenu affiché, puis colle **tout** le contenu du fichier
   [`apps-script/Code.gs`](apps-script/Code.gs).
3. Renomme le projet en haut à gauche : `Peace Magazine Commandes`.
4. Enregistre (Cmd+S).

### 2. Le déployer

1. En haut à droite : **Déployer → Nouveau déploiement**.
2. Clique sur l'engrenage ⚙ à côté de « Sélectionner un type » → **Application Web**.
3. Règle :
   - *Description* : `v1`
   - *Exécuter en tant que* : **Moi**
   - *Qui a accès* : **Tout le monde** ← indispensable
4. **Déployer**.
5. Google demande une autorisation : *Autoriser l'accès* → choisis ton compte →
   l'écran « Google n'a pas validé cette application » s'affiche (c'est normal,
   c'est ton propre script) → **Paramètres avancés** → **Accéder à Peace Magazine
   Commandes (non sécurisé)** → **Autoriser**.
6. **Copie l'URL** affichée : elle se termine par `/exec`.

### 3. Brancher le site

Ouvre `index.html`, cherche `ORDER_CONFIG` (vers la fin du fichier) et complète :

```js
window.ORDER_CONFIG = {
    scriptUrl: 'https://script.google.com/macros/s/AKfy..../exec',  // ← ton URL
    paymentLink: 'https://pay.wave.com/m/XXXX/c/ci/',               // ← ton lien de paiement
    depositAmount: 15000,
    totalAmount: 30000,
    minPhotos: 30
};
```

- **`scriptUrl`** : l'URL copiée à l'étape 2.
- **`paymentLink`** : ton lien marchand pour l'acompte (Wave, Orange Money, Djamo…).
  Si tu le laisses vide, le client lira « Nous vous enverrons le lien de paiement
  sur WhatsApp ».

### 4. Vérifier

1. Ouvre ton URL `/exec` dans un navigateur : tu dois voir
   `Peace Magazine — API commandes opérationnelle ✅`.
2. Lance le site en local (`npm start`) et passe une commande test avec 2 ou 3 photos.
3. Dans ton Drive, le dossier **« Peace Magazine — Commandes »** doit contenir le
   classeur de suivi et le dossier de la commande.

---

## Le déroulé d'une commande

| Étape | Qui | Ce qui se passe |
|---|---|---|
| 1 | Cliente | Remplit le questionnaire, ajoute ses photos — pour chacune, une légende courte et un texte long, tous deux facultatifs ; l'étoile désigne la couverture |
| 2 | Script | Crée le dossier Drive et la ligne du Sheet — statut **💰 En attente de paiement de l'acompte** |
| 3 | Cliente | Paie l'acompte via ton lien, puis t'envoie nom + numéro + heure sur WhatsApp |
| 4 | **Toi** | Tu vérifies le paiement :<br>✅ reçu → tu passes le statut à « En création » et tu commences<br>❌ rien reçu → tu supprimes le dossier Drive et la ligne du Sheet |

---

## Modifier le script plus tard

**Déployer → Gérer les déploiements → ✏️ (crayon) → Version : Nouvelle version → Déployer.**

⚠️ Si tu crées un *nouveau déploiement* au lieu d'une *nouvelle version*, l'URL
change et il faut la remettre dans `index.html`.

---

## « Vous n'êtes pas autorisé à appeler DocumentApp.create »

Cette erreur apparaît quand le script a été autorisé **avant** d'utiliser Google
Docs. Google n'ajoute jamais une autorisation tout seul : il faut la redonner
une fois.

1. Ouvre ton projet sur [script.google.com](https://script.google.com).
2. **Paramètres du projet** (l'engrenage à gauche) → coche
   **« Afficher le fichier manifeste appsscript.json dans l'éditeur »**.
3. Reviens à l'éditeur, ouvre `appsscript.json` et remplace son contenu par
   celui de [`apps-script/appsscript.json`](apps-script/appsscript.json).
   Enregistre.
4. Dans la barre du haut, choisis la fonction **`doGet`** dans la liste
   déroulante, puis clique sur **Exécuter**.
5. Google redemande l'autorisation, cette fois avec Google Docs :
   *Autoriser l'accès* → ton compte → **Paramètres avancés** →
   **Accéder à … (non sécurisé)** → **Autoriser**.
6. **Déployer → Gérer les déploiements → ✏️ → Nouvelle version → Déployer.**

Vérifie ensuite en passant une commande test.

> **Si tu préfères ne pas t'en occuper maintenant** : ce n'est pas bloquant.
> Depuis la dernière version du script, une commande qui ne peut pas créer de
> Google Docs crée un `Fiche commande.txt` à la place — avec exactement les
> mêmes informations, photos, légendes et textes compris. **Aucune commande
> n'est perdue.** Tu auras simplement un fichier texte au lieu d'un document
> mis en forme, jusqu'à ce que tu donnes l'autorisation.

## Limites de Google (très larges)

- ~20 000 appels par jour
- Stockage = ton quota Drive (15 Go gratuits ; une commande de 30 photos ≈ 60 Mo)
