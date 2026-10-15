# Analyse Rugby

Application d’analyse vidéo rugby : lecture + tagging manuel au clavier.

- **Desktop** : Electron + React
- **Web / Docker** : SPA servie sur le port **8087**

## Stack

- React + TypeScript + Vite
- Electron (optionnel, mode desktop)
- Docker + nginx (mode web)

## MVP

- Lecteur vidéo (play/pause, Espace)
- Ouverture d’un MP4 local (dialogue Electron ou sélecteur navigateur)
- Tagging par boutons : zone **gauche** / zone **droite**
- Touches, mêlées, rucks (gagné/perdu), essais, transformations, pénalités, cartons
- Résumé statistiques en fin de vidéo (ou bouton « Voir le résumé »)
- Liste des tags cliquables (seek) + suppression
- **Pas** de détection automatique

### Tagging

| Zone gauche | Zone droite |
|-------------|-------------|
| Équipe A    | Équipe B    |

Boutons : touche/mêlée/ruck gagné·e ou perdu·e, essai, transformation, pénalité, carton jaune/rouge.  
Espace = play/pause.

## Docker (port 8087)

```bash
make up
# → http://localhost:8087
```

Arrêt : `make down`

Les sessions (tags) sont persistées dans le volume Docker `video-analyse-data`.  
La vidéo reste **locale au navigateur** (pas d’upload) : après un chargement, rouvre le même fichier MP4.

### Sauvegarde

- **Export JSON / CSV** — téléchargement local
- **Sauvegarder / Charger** — API serveur (`/api/sessions`)
- **Brouillon** — autosave `localStorage` (survit au refresh)

## Démarrage local

```bash
npm install
npm run dev       # Electron + Vite
npm run dev:web   # navigateur seul
npm run build:web # build SPA
```

Node.js 20+ requis.

## Structure

```
electron/          # main + preload (desktop)
src/
  components/      # VideoPlayer, TaggingPanel, Toolbar
  hooks/           # useKeyboardTagging
  types/           # événements rugby
Dockerfile         # image nginx :8087
docker-compose.yml
```
