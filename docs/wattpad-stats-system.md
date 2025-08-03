# Système de Stats Wattpad avec PocketBase

Ce document décrit le système intégré de récupération et de gestion des statistiques Wattpad avec PocketBase.

## 🎯 Vue d'ensemble

Le système combine :

- **Crawling automatique** des stats depuis Wattpad
- **Stockage centralisé** dans PocketBase
- **Mise à jour automatique** via cron jobs
- **Intégration frontend** avec Next.js

## 📁 Structure des fichiers

```
scripts/
├── update-wattpad-stats.mjs          # Script principal de mise à jour
├── setup-cron.mjs                    # Configuration des cron jobs
├── test-wattpad-stats-system.mjs     # Tests du système
└── revalidate-stats.js               # Script de revalidation Next.js

src/
├── app/api/pocketbase/
│   ├── wattpad-stats/route.ts        # API endpoint pour récupérer les stats
│   └── update-wattpad-stats/route.ts # API endpoint pour mettre à jour les stats
├── services/pocketbase.ts            # Service PocketBase pour les stats
├── contexts/WattpadStatsContext.tsx  # Context React pour les stats
├── hooks/
│   ├── useWattpadStats.ts            # Hook pour récupérer les stats
│   └── useFormattedWattpadStats.ts   # Hook pour formater les stats
└── components/
    ├── WattpadStats.tsx              # Composant d'affichage des stats
    └── WattpadStatsText.tsx          # Composant texte des stats
```

## 🔧 Configuration

### Variables d'environnement requises

```bash
# PocketBase
PB_URL=https://api.esperancem.fr
PB_TOKEN=your_pocketbase_admin_token

# Site
SITE_URL=https://esperancem.fr
REVALIDATE_SECRET=your_revalidation_secret
```

### Installation des dépendances

```bash
npm install cheerio pocketbase
```

## 🚀 Utilisation

### 1. Mise à jour manuelle des stats

```bash
# Avec variables d'environnement
PB_URL=https://api.esperancem.fr PB_TOKEN=your_token node scripts/update-wattpad-stats.mjs

# Ou avec un fichier .env
node scripts/update-wattpad-stats.mjs
```

### 2. Configuration automatique

```bash
# Générer les fichiers de configuration
node scripts/setup-cron.mjs
```

### 3. Test du système

```bash
# Tester l'intégration complète
node scripts/test-wattpad-stats-system.mjs
```

## 📊 API Endpoints

### GET /api/pocketbase/wattpad-stats

Récupère les stats actuelles depuis PocketBase.

**Réponse :**

```json
{
	"id": "1m8ljil72kpaz7a",
	"reads": "145K",
	"readsComplete": "145350",
	"votes": "4.6K",
	"parts": "48",
	"is_active": true,
	"created": "2025-07-18T17:22:12.648Z",
	"updated": "2025-07-18T17:22:12.648Z"
}
```

### POST /api/pocketbase/update-wattpad-stats

Met à jour les stats en récupérant les données fraîches depuis Wattpad.

**Headers requis :**

```
Authorization: Bearer YOUR_REVALIDATE_SECRET
Content-Type: application/json
```

**Réponse :**

```json
{
	"success": true,
	"message": "Wattpad stats updated successfully",
	"stats": {
		"reads": "145K",
		"readsComplete": "145350",
		"votes": "4.6K",
		"parts": "48"
	},
	"timestamp": "2025-07-18T17:22:12.648Z"
}
```

## 🔄 Automatisation

### Option 1: Cron Job (Linux/Unix)

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne (mise à jour toutes les 6 heures)
0 */6 * * * cd /path/to/project && PB_URL=https://api.esperancem.fr PB_TOKEN=your_token SITE_URL=https://esperancem.fr REVALIDATE_SECRET=your_secret node scripts/update-wattpad-stats.mjs >> logs/wattpad-stats.log 2>&1
```

### Option 2: Systemd Timer (Linux)

```bash
# Copier les fichiers générés
sudo cp wattpad-stats-update.service /etc/systemd/system/
sudo cp wattpad-stats-update.timer /etc/systemd/system/

# Activer et démarrer
sudo systemctl daemon-reload
sudo systemctl enable wattpad-stats-update.timer
sudo systemctl start wattpad-stats-update.timer
```

### Option 3: Docker

```bash
# Utiliser le fichier docker-cron généré
docker run -v $(pwd)/docker-cron:/etc/cron.d/wattpad-stats -d your-image
```

### Option 4: Plateformes Cloud

- **Vercel**: Utiliser les Cron Jobs intégrés
- **Netlify**: Utiliser les Scheduled Functions
- **AWS**: Utiliser EventBridge + Lambda
- **Google Cloud**: Utiliser Cloud Scheduler + Cloud Functions

## 🧪 Tests

### Test manuel

```bash
# Tester la récupération des stats
node scripts/update-wattpad-stats.mjs

# Tester l'intégration complète
node scripts/test-wattpad-stats-system.mjs

# Valider le contenu PocketBase
node scripts/validate-pocketbase-content.mjs
```

### Test des endpoints

```bash
# Tester l'endpoint de récupération
curl http://localhost:3000/api/pocketbase/wattpad-stats

# Tester l'endpoint de mise à jour (avec token)
curl -X POST http://localhost:3000/api/pocketbase/update-wattpad-stats \
  -H "Authorization: Bearer YOUR_REVALIDATE_SECRET" \
  -H "Content-Type: application/json"
```

## 📈 Monitoring

### Logs

Les logs sont automatiquement sauvegardés dans `logs/wattpad-stats.log` :

```bash
# Voir les derniers logs
tail -f logs/wattpad-stats.log

# Voir les erreurs
grep "ERROR\|❌" logs/wattpad-stats.log
```

### Métriques

Le système enregistre :

- Timestamp de chaque mise à jour
- Nombre de lectures, votes, parties
- Statut de succès/échec
- Temps de réponse

## 🔧 Dépannage

### Problèmes courants

1. **Erreur d'authentification PocketBase**
   - Vérifier `PB_TOKEN` dans les variables d'environnement
   - S'assurer que le token a les permissions admin

2. **Erreur de crawling Wattpad**
   - Vérifier la connectivité internet
   - Wattpad peut avoir changé sa structure HTML
   - Vérifier les logs pour plus de détails

3. **Erreur de revalidation Next.js**
   - Vérifier `REVALIDATE_SECRET` dans les variables d'environnement
   - S'assurer que l'endpoint `/api/revalidate-stats` fonctionne

### Debug

```bash
# Mode debug avec plus de logs
DEBUG=* node scripts/update-wattpad-stats.mjs

# Tester la connexion PocketBase
node scripts/test-pocketbase.mjs

# Vérifier les variables d'environnement
echo "PB_URL: $PB_URL"
echo "PB_TOKEN: $PB_TOKEN"
echo "SITE_URL: $SITE_URL"
echo "REVALIDATE_SECRET: $REVALIDATE_SECRET"
```

## 🔄 Migration depuis l'ancien système

Si vous migrez depuis l'ancien système de stats :

1. **Sauvegarder les anciennes stats**
2. **Exécuter le script de migration**
3. **Mettre à jour les composants frontend**
4. **Configurer l'automatisation**
5. **Tester l'intégration**

## 📝 Maintenance

### Mise à jour régulière

- Vérifier les logs hebdomadairement
- Tester le système mensuellement
- Mettre à jour les dépendances trimestriellement

### Sauvegarde

- Les stats sont automatiquement sauvegardées dans PocketBase
- Considérer une sauvegarde externe des données importantes

## 🤝 Contribution

Pour contribuer au système :

1. Tester les modifications localement
2. Mettre à jour la documentation
3. Vérifier la compatibilité avec l'existant
4. Ajouter des tests si nécessaire

## 📞 Support

En cas de problème :

1. Vérifier les logs
2. Consulter ce document
3. Tester manuellement
4. Contacter l'équipe de développement
