# 📥 Installation Simple de Node.js (SANS mot de passe dans le terminal)

## ✅ Option 1 : Installation via le site web (RECOMMANDÉ - Le plus simple)

1. **Ouvrez votre navigateur** et allez sur : https://nodejs.org/

2. **Téléchargez la version LTS** (Long Term Support) pour macOS
   - Cliquez sur le gros bouton vert "LTS" 
   - Le fichier téléchargé s'appellera quelque chose comme `node-v20.x.x.pkg`

3. **Double-cliquez sur le fichier téléchargé** dans votre dossier Téléchargements

4. **Suivez l'assistant d'installation** :
   - Cliquez sur "Continuer" plusieurs fois
   - Acceptez les conditions
   - **Entrez votre mot de passe macOS** (celui que vous utilisez pour déverrouiller votre Mac)
   - Cliquez sur "Installer"

5. **Redémarrez votre Terminal** (fermez-le et rouvrez-le)

6. **Vérifiez l'installation** :
   ```bash
   node --version
   npm --version
   ```

✅ **C'est tout !** Node.js est maintenant installé.

---

## ✅ Option 2 : Si vous préférez utiliser le terminal

### Comment entrer votre mot de passe dans le terminal :

1. **Ouvrez le Terminal**

2. **Exécutez cette commande** :
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

3. **Quand on vous demande votre mot de passe** :
   - ⚠️ **IMPORTANT** : Le terminal ne montre PAS ce que vous tapez (c'est normal pour la sécurité)
   - Tapez votre mot de passe macOS normalement
   - Appuyez sur **Entrée**
   - Même si vous ne voyez rien à l'écran, votre mot de passe est bien enregistré !

4. **Installez Node.js** :
   ```bash
   brew install node
   ```

---

## 🎯 Après l'installation (quelle que soit la méthode)

Une fois Node.js installé, dans votre Terminal :

```bash
# Aller dans le dossier du projet
cd "/Users/ephremkouadio/Peace magazine/backend"

# Installer les dépendances
npm install

# Démarrer le backend
npm run dev
```

---

## ❓ Questions fréquentes

**Q : Le terminal ne montre rien quand je tape mon mot de passe, c'est normal ?**  
R : Oui ! C'est pour votre sécurité. Tapez normalement et appuyez sur Entrée.

**Q : J'ai oublié mon mot de passe macOS**  
R : Utilisez l'Option 1 (installation via le site web) qui utilise l'interface graphique de macOS.

**Q : Quelle version installer ?**  
R : La version LTS (Long Term Support) est la meilleure pour la stabilité.

---

**Besoin d'aide ?** Dites-moi quelle méthode vous préférez et je vous guiderai étape par étape !












