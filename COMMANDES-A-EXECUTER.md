# 🚀 Commandes à exécuter dans VOTRE Terminal

## ⚠️ IMPORTANT : Ouvrez votre Terminal et copiez-collez ces commandes une par une

---

## Étape 1 : Installer Homebrew

**Copiez-collez cette commande dans votre Terminal :**

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Quand on vous demande votre mot de passe :**
- Tapez : `Juillet2003@`
- ⚠️ Vous ne verrez RIEN à l'écran (c'est normal !)
- Appuyez sur **Entrée**

L'installation prendra quelques minutes. Attendez la fin.

---

## Étape 2 : Configurer Homebrew

**Après l'installation de Homebrew, copiez-collez ces commandes :**

```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
```

---

## Étape 3 : Installer Node.js

```bash
brew install node
```

---

## Étape 4 : Vérifier l'installation

```bash
node --version
npm --version
```

Vous devriez voir des numéros de version (ex: v20.x.x et 10.x.x)

---

## Étape 5 : Installer les dépendances du projet

```bash
cd "/Users/ephremkouadio/Peace magazine/backend"
npm install
```

---

## Étape 6 : Démarrer le backend

```bash
npm run dev
```

---

## ✅ C'est terminé !

Si tout fonctionne, vous verrez le serveur démarrer.

---

## 🆘 En cas de problème

**Si "command not found: brew" après l'installation :**
```bash
eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Si vous avez des erreurs, dites-moi et je vous aiderai !**







