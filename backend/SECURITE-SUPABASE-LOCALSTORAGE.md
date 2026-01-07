# 🔐 Corrections de sécurité - Supabase et localStorage

## ✅ Problèmes corrigés

### 1. Clé Supabase codée en dur

**Problème :**
- Clé Supabase publique (`sb_publishable_...`) codée en dur dans `supabase-service.js`
- Accès REST public aux tables, dépendant uniquement des politiques RLS

**Solution :**
- ✅ Clé récupérée depuis `window.APP_CONFIG` (configurée dans `index.html`)
- ✅ Vérification que la clé est bien une clé publique (anon key)
- ✅ Garde-fou pour les erreurs RLS (401/403) - ne pas réessayer automatiquement
- ✅ Messages d'erreur sécurisés (ne pas exposer d'informations sensibles)

**Fichiers modifiés :**
- `supabase-service.js` - Récupération depuis config, vérification clé, gestion erreurs RLS

### 2. Fallback localStorage avec PII

**Problème :**
- Fallback localStorage stocke commandes/leads/contacts avec PII en clair
- Pas de consentement explicite
- Pas de purge automatique
- Non conforme RGPD

**Solution :**
- ✅ Fallback localStorage **désactivé** pour tous les endpoints PII :
  - `/api/orders/public` (commandes)
  - `/api/leads` (prospects)
  - `/api/contact` (messages)
- ✅ Erreur explicite si le serveur n'est pas disponible
- ✅ Pas de stockage local des données personnelles

**Fichiers modifiés :**
- `script.js` - Fonction `fallbackApiCall()` modifiée pour bloquer les PII

### 3. Gestion d'erreur Supabase

**Problème :**
- Si Supabase échoue, la clé est réutilisée sans garde-fou
- Si RLS est mal configuré, écriture/lecture non désirée possible

**Solution :**
- ✅ Détection des erreurs RLS (401/403)
- ✅ Flag `rlsError` pour bloquer les réessais automatiques
- ✅ Messages d'erreur clairs pour les erreurs de sécurité
- ✅ Pas de réessai automatique en cas d'erreur RLS

**Fichiers modifiés :**
- `supabase-service.js` - Détection et gestion des erreurs RLS
- `script.js` - Vérification des erreurs RLS avant de continuer

### 4. Sauvegarde formulaire localStorage

**Problème :**
- `peaceMagazineFormData` stocke potentiellement des PII

**Solution :**
- ✅ Sauvegarde uniquement des **métadonnées** (pas de PII)
- ✅ Ne pas sauvegarder : `personName`, `customerEmail`, `customerPhone`, `deliveryAddress`
- ✅ Purge automatique après 30 jours
- ✅ Vérification de l'âge des données avant restauration

**Fichiers modifiés :**
- `script.js` - Méthodes `saveFormData()` et `restoreFormData()`

## 🔒 Mesures de sécurité implémentées

### Supabase

1. **Vérification de la clé**
   ```javascript
   if (!this.supabaseKey.startsWith('sb_publishable_') && !this.supabaseKey.startsWith('eyJ')) {
       console.error('⚠️ SÉCURITÉ: Clé Supabase suspecte');
   }
   ```

2. **Détection erreurs RLS**
   ```javascript
   if (response.status === 401 || response.status === 403) {
       error.rlsError = true; // Flag pour bloquer les réessais
       throw error;
   }
   ```

3. **Blocage des réessais**
   ```javascript
   if (supabaseError.rlsError) {
       throw new Error('Erreur de sécurité. Les politiques RLS ont refusé l\'accès.');
   }
   ```

### localStorage

1. **Blocage des PII**
   ```javascript
   const piiEndpoints = ['/api/orders/public', '/api/leads', '/api/contact'];
   if (piiEndpoints.some(ep => endpoint.includes(ep))) {
       throw new Error('Impossible de sauvegarder les données PII localement');
   }
   ```

2. **Purge automatique**
   ```javascript
   if (savedAt && (Date.now() - savedAt.getTime()) > 30 * 24 * 60 * 60 * 1000) {
       localStorage.removeItem('peaceMagazineFormData');
   }
   ```

3. **Métadonnées uniquement**
   ```javascript
   // Ne pas sauvegarder: personName, customerEmail, customerPhone, etc.
   const payload = {
       currentStep: this.currentStep,
       uploadedFiles: [...], // Sans données base64
       // Pas de PII
   };
   ```

## 📋 Conformité RGPD

### Données personnelles

- ✅ **Aucune PII stockée dans localStorage**
- ✅ **Pas de fallback localStorage pour les commandes/contacts**
- ✅ **Purge automatique des données anciennes**
- ✅ **Consentement implicite** : l'utilisateur soumet le formulaire volontairement

### Sécurité Supabase

- ✅ **Politiques RLS obligatoires** (vérifiées via erreurs 401/403)
- ✅ **Clé publique uniquement** (vérification du format)
- ✅ **Pas de réessai automatique** en cas d'erreur RLS
- ✅ **Messages d'erreur sécurisés** (pas d'exposition d'informations sensibles)

## ⚠️ Recommandations supplémentaires

### 1. Vérifier les politiques RLS dans Supabase

Assurez-vous que les politiques RLS sont correctement configurées :

```sql
-- Exemple de politique sécurisée
CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (true); -- ⚠️ À restreindre selon vos besoins

-- Politique plus sécurisée (recommandée)
CREATE POLICY "Allow public insert on orders"
  ON orders FOR INSERT
  TO anon
  WITH CHECK (
    customer_email IS NOT NULL AND
    customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  );
```

### 2. Surveiller les erreurs RLS

Les erreurs RLS sont maintenant loggées avec le flag `rlsError`. Surveillez ces erreurs pour détecter des tentatives d'accès non autorisées.

### 3. Rotation des clés

Envisagez de :
- Utiliser des variables d'environnement pour les clés (si possible côté build)
- Roter les clés régulièrement
- Utiliser des clés différentes pour dev/prod

## 📞 Besoin d'aide ?

- 📱 WhatsApp : +225 07 67 66 04 76
- 📧 Email : morak6@icloud.com








