import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { suspendGlobalShortcuts } from '@/utils/shortcuts'

type Props = {
  open: boolean
  onClose: () => void
}

function HelpSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="help-section">
      <h3 className="help-section__title">{title}</h3>
      {children}
    </section>
  )
}

const DEMO_SRC = 'demo/demo-coachs.mp4'
const DEMO_CREDIT_URL =
  'https://commons.wikimedia.org/wiki/File:2023_Rugby_World_Cup_warm-up_matches_-_Uruguay_vs_Chile_-_Video_1.webm'

export function HelpModal({ open, onClose }: Props) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const bodyRef = useRef<HTMLDivElement>(null)
  const demoRef = useRef<HTMLVideoElement | null>(null)

  const bindDemo = useCallback((node: HTMLVideoElement | null) => {
    if (node === null) demoRef.current?.pause()
    demoRef.current = node
  }, [])

  const close = () => {
    demoRef.current?.pause()
    onClose()
  }

  useEffect(() => {
    if (!open) return
    return suspendGlobalShortcuts(() => {
      demoRef.current?.pause()
      onCloseRef.current()
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' || event.repeat) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      // Espace sur la démo ne doit pas atteindre le lecteur du match.
      if (target === demoRef.current) {
        event.stopPropagation()
        return
      }
      if (tag === 'VIDEO') {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (
        tag === 'BUTTON' ||
        tag === 'INPUT' ||
        tag === 'SELECT' ||
        tag === 'TEXTAREA' ||
        tag === 'A'
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      const body = bodyRef.current
      if (!body) return
      const delta = Math.max(120, body.clientHeight * 0.85)
      body.scrollBy({ top: event.shiftKey ? -delta : delta })
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    bodyRef.current?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={close}>
      <div
        className="modal modal--help"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header">
          <h2 id="help-title" className="modal__title">
            Mode d’emploi
          </h2>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={close}
            aria-label="Fermer"
          >
            ✕
          </button>
        </header>

        <div className="modal__body help-body" ref={bodyRef} tabIndex={0}>
          <figure className="help-demo">
            <figcaption className="help-demo__title" id="help-demo-title">
              Vidéo de démonstration
            </figcaption>
            {/* Chemin relatif : servi depuis public/ en http et en file:// (Electron). */}
            <video
              ref={bindDemo}
              className="help-demo__player"
              controls
              preload="metadata"
              src={DEMO_SRC}
              aria-labelledby="help-demo-title"
            />
            <p className="help-demo__credit">
              Images du match : NaBUru38,{' '}
              <a href={DEMO_CREDIT_URL} target="_blank" rel="noopener noreferrer">
                Wikimedia Commons
              </a>
              , CC BY-SA 4.0
            </p>
          </figure>
          <p className="help-lead">
            Analyse Rugby sert à revoir un match et à poser des tags à la
            main, à l’instant où se trouve la vidéo. Rien n’est détecté
            automatiquement. La vidéo reste sur ta machine : elle n’est pas
            envoyée au serveur.
          </p>

          <HelpSection title="Ouvrir une vidéo">
            <p>
              Clique <strong>Ouvrir une vidéo…</strong> dans la barre du
              haut. Dans le navigateur, un sélecteur de fichier s’ouvre
              (MP4, M4V, MOV). Dans l’application de bureau, c’est le
              dialogue du système. Le lecteur accepte un fichier local, y
              compris de plusieurs gigaoctets (H.264).
            </p>
            <p>
              Tant qu’aucune vidéo n’est choisie, le centre de l’écran
              affiche « Aucune vidéo » et « Ouvre un fichier MP4 local
              (H.264) — jusqu’à plusieurs Go. »
            </p>
            <p>
              Ouvrir un <em>autre</em> fichier remet les tags à zéro,
              renomme la session d’après le fichier et rétablit les noms
              d’équipes. Rouvrir <em>le même nom de fichier</em> après un
              brouillon, un import ou un chargement conserve les tags. Le
              bandeau indique alors « Vidéo liée — N tag(s) conservé(s). »
            </p>
          </HelpSection>

          <HelpSection title="Lecture">
            <ul>
              <li>
                Lecture et pause : bouton ▶ / ❚❚, clic sur l’image, ou
                touche <kbd>Espace</kbd>.
              </li>
              <li>
                Boutons <strong>−5s</strong> et <strong>+5s</strong> pour
                sauter de cinq secondes.
              </li>
              <li>
                Liste <strong>Vitesse</strong> : ×0,5, ×0,75, ×1, ×1,25,
                ×1,5, ×2, ×2,5 et ×3.
              </li>
              <li>
                La barre de temps porte une pastille colorée par tag. Un
                clic dessus amène la vidéo à cet instant.
              </li>
              <li>
                À la fin de la vidéo, s’il y a au moins un tag, le résumé
                s’ouvre tout seul.
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="Tagging">
            <p>
              Le panneau <strong>Tagging équipes</strong> reste inactif
              tant qu’aucune vidéo n’est ouverte (« Ouvre une vidéo pour
              activer le tagging »). Chaque clic enregistre l’événement à
              la position affichée sous le titre (« Position : mm:ss »).
            </p>

            <h4 className="help-subtitle">Temps de jeu</h4>
            <p>
              Quatre boutons communs, attribués au match et non à une
              équipe : <strong>Début match</strong>, <strong>Fin MT</strong>
              , <strong>Début MT</strong>, <strong>Fin match</strong>. Ils
              servent de bornes. Sans « Fin MT » et « Début MT », le résumé
              ne peut pas séparer les mi-temps.
            </p>

            <h4 className="help-subtitle">Jeu effectif</h4>
            <p>
              <strong>En jeu</strong> (ballon en jeu) et{' '}
              <strong>Arrêté</strong> (ballon arrêté). Le temps effectif
              est la somme des intervalles « En jeu » → « Arrêté ». « Fin
              MT » et « Fin match » referment aussi un intervalle encore
              ouvert. Le résumé affiche la durée totale, le nombre de
              séquences et la durée moyenne. Un « En jeu » sans « Arrêté »
              est signalé comme segment ouvert.
            </p>

            <h4 className="help-subtitle">Zones gauche et droite</h4>
            <p>
              Deux pavés côte à côte. Le nom se modifie dans le champ en
              haut de chaque pavé (par défaut « Équipe gauche » et « Équipe
              droite »). Sur une analyse en cours, on y lit par exemple le
              nom du club à gauche et celui de l’adversaire à droite.
            </p>
            <ul>
              <li>
                <span className="help-swatch help-swatch--home" aria-hidden />
                <strong>Gauche</strong> — équipe du pavé de gauche (bord
                bleu).
              </li>
              <li>
                <span className="help-swatch help-swatch--away" aria-hidden />
                <strong>Droite</strong> — équipe du pavé de droite (bord
                rose).
              </li>
            </ul>
            <p>Les mêmes boutons existent des deux côtés :</p>
            <ul>
              <li>
                <strong>Conquête</strong> — touche, mêlée et ruck, chacun
                en gagné ou perdu.
              </li>
              <li>
                <strong>Score</strong> — essai (5 pts), transformation
                (2 pts), transformation manquée, pénalité réussie (3 pts),
                pénalité manquée. Les boutons courts affichent « Transfo »,
                « Transfo ✗ », « Péna. ✓ » et « Péna. ✗ ». Le survol
                indique le libellé complet.
              </li>
              <li>
                <strong>Faute</strong> — en avant. « Pénalité » et « Coup
                franc » ouvrent une liste de motifs (ballon gardé au sol,
                hors-jeu, plaquage haut, etc.). La sanction est comptée
                pour l’équipe du pavé cliqué.
              </li>
              <li>
                <strong>Discipline</strong> — carton jaune, carton rouge.
              </li>
            </ul>

            <h4 className="help-subtitle">Raccourcis clavier</h4>
            <p>
              Il n’y a pas de touche par type d’événement : un tag se pose
              en cliquant le bouton, pas au clavier. Les seuls raccourcis
              réellement branchés sont ceux-ci.
            </p>
            <dl className="help-keys">
              <div>
                <dt>
                  <kbd>Espace</kbd>
                </dt>
                <dd>
                  Lecture ou pause. Sans effet dans un champ (nom
                  d’équipe, timecode, motif) et tant que ce mode d’emploi
                  est ouvert : la vidéo ne démarre pas pendant la lecture
                  de l’aide.
                </dd>
              </div>
              <div>
                <dt>
                  <kbd>Échap</kbd>
                </dt>
                <dd>
                  Ferme ce mode d’emploi. Ferme aussi le filtre « Tous les
                  types » et le réglage de timecode (−1 s / +1 s) quand ils
                  sont ouverts.
                </dd>
              </div>
              <div>
                <dt>
                  <kbd>Entrée</kbd>
                </dt>
                <dd>
                  Valide un timecode saisi à la main (mm:ss, hh:mm:ss, ou
                  un nombre de secondes).
                </dd>
              </div>
            </dl>
            <p className="help-note">
              −5 s, +5 s, −1 s et +1 s sont des boutons : il faut cliquer
              dessus. Les touches lettres ou chiffres ne créent aucun tag,
              y compris pendant que cette fenêtre est ouverte.
            </p>
          </HelpSection>

          <HelpSection title="Liste d’événements">
            <p>
              Le panneau <strong>Événements</strong> est à gauche sur un
              grand écran, en bas sur un petit. Le nombre en haut est le
              total affiché. La liste est triée du timecode le plus récent
              au plus ancien. Chaque ligne montre une pastille de couleur,
              le temps, le libellé (et le motif de faute s’il y en a un),
              puis l’équipe ou « Match ».
            </p>
            <ul>
              <li>
                Clic sur le libellé : la vidéo se place à cet instant.
              </li>
              <li>
                Clic sur le timecode : la vidéo s’y place et les boutons{' '}
                <strong>−1s</strong> / <strong>+1s</strong> apparaissent.
                Un second clic ouvre la saisie. <kbd>Entrée</kbd> valide,{' '}
                <kbd>Échap</kbd> annule. La vidéo suit le nouveau temps.
              </li>
              <li>
                <strong>✕</strong> en bout de ligne : supprime ce tag.
              </li>
              <li>
                Filtre <strong>Tous les types</strong> : coche les types à
                garder, ou utilise Tous / Rien / OK. Le compteur devient
                « affichés / total » quand le filtre n’est pas complet.
                « Aucun événement pour ce filtre. » s’affiche si rien ne
                correspond.
              </li>
              <li>
                Le bouton <strong>⟨</strong> masque le panneau. Le rail
                « Événements » le rouvre. Le séparateur vertical règle la
                largeur (mémorisée dans le navigateur).
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="Résumé et statistiques">
            <p>
              <strong>Voir le résumé</strong> (en haut à droite du
              tagging) s’active dès qu’il y a au moins un tag. Le résumé
              s’ouvre aussi tout seul à la fin de la lecture.
            </p>
            <p>
              L’onglet <strong>Match entier</strong> est toujours là. Les
              onglets <strong>1re mi-temps</strong> et{' '}
              <strong>2e mi-temps</strong> apparaissent quand les bornes
              de temps de jeu le permettent. Le score affiché compte 5
              points par essai, 2 par transformation réussie et 3 par
              pénalité réussie. Les tentatives manquées sont comptées à
              part, sans point.
            </p>
            <p>Les tableaux couvrent :</p>
            <ul>
              <li>le temps de jeu effectif ;</li>
              <li>
                le score (essais, transformations, pénalités) ;
              </li>
              <li>les fautes (en avant, pénalités sifflées, coups francs) ;</li>
              <li>
                la conquête, avec le pourcentage de touches, mêlées et
                rucks gagnés ;
              </li>
              <li>la discipline (cartons jaunes et rouges).</li>
            </ul>
            <p>
              En bas du résumé, quatre exports téléchargent un fichier
              horodaté : <strong>Télécharger PDF</strong>,{' '}
              <strong>TXT</strong>, <strong>CSV</strong> (une ligne par
              équipe et par période) et <strong>JSON</strong> (tags et
              périodes). Ce JSON de résumé peut être réimporté avec
              « Importer JSON… ».
            </p>
          </HelpSection>

          <HelpSection title="Importer et exporter">
            <ul>
              <li>
                <strong>Export JSON</strong> — session complète : nom,
                fichier vidéo, chemin local (bureau), noms d’équipes et
                événements. Inactif sans tag.
              </li>
              <li>
                <strong>Export CSV</strong> — un tag par ligne (identifiant,
                type, libellé, motif, temps en secondes, timecode, équipe,
                nom d’équipe, date). Fichier UTF-8, trié par temps. Inactif
                sans tag.
              </li>
              <li>
                <strong>Importer JSON…</strong> — reprend un export de
                session ou le JSON du résumé, à condition qu’il contienne
                une liste <em>events</em>. Les tags à l’écran sont
                remplacés. Rouvre ensuite la vidéo du même nom pour les
                relier. Un fichier illisible ou mal formé affiche l’erreur
                dans le bandeau.
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="Sauvegarder et charger">
            <p>
              <strong>Sauvegarder</strong> et <strong>Charger…</strong> ne
              s’activent que si le serveur répond. Dans le navigateur servi
              par l’application (Docker ou serveur local), c’est le cas.
              Dans le bureau Electron lancé sans serveur, les boutons
              restent inactifs : utilise alors l’export JSON. Le survol
              indique « API serveur indisponible ».
            </p>
            <ul>
              <li>
                <strong>Sauvegarder</strong> enregistre les tags sur le
                serveur. La vidéo n’est pas stockée. Le bouton est inactif
                sans tag, ou pendant l’envoi (« Sauvegarde… »). Le bandeau
                confirme le nombre de tags.
              </li>
              <li>
                <strong>Charger…</strong> liste les sessions (nom, fichier
                vidéo, nombre de tags, date). <strong>Charger</strong>{' '}
                reprend les tags : il faut rouvrir le même fichier vidéo.{' '}
                <strong>Supprimer</strong> retire la session du serveur,
                après confirmation.
              </li>
            </ul>
          </HelpSection>

          <HelpSection title="Brouillon automatique">
            <p>
              Chaque changement de tags, de noms d’équipes, de session ou
              de fichier est enregistré dans le navigateur. Au
              rechargement de la page, s’il reste des tags, un bandeau vert
              s’affiche : « Brouillon restauré — rouvre « nom-du-fichier.mp4
              ». » ou, sans nom de fichier, « Brouillon restauré — ouvre
              une vidéo. » La vidéo elle-même n’est pas restaurée : il faut
              la rouvrir.
            </p>
            <p>
              Le <strong>✕</strong> du bandeau masque seulement le message.
              Il n’efface pas les tags. Le brouillon ne réapparaît plus
              au prochain chargement une fois les tags vidés.
            </p>
          </HelpSection>

          <HelpSection title="Effacer">
            <p>
              <strong>Effacer (N)</strong> retire tous les tags d’un coup
              et le bandeau confirme « Tags effacés. » La vidéo reste
              ouverte, les noms d’équipes aussi. Le bouton est inactif
              quand N vaut 0. Pour retirer un seul tag, utilise le ✕ de sa
              ligne dans la liste.
            </p>
          </HelpSection>

          <HelpSection title="Panneaux">
            <p>
              Le bouton <strong>˅</strong> du tagging masque ce panneau ;
              le rail « Tagging » le rouvre. Le séparateur horizontal règle
              sa hauteur. Largeur de la liste et hauteur du tagging sont
              mémorisées dans le navigateur.
            </p>
          </HelpSection>
        </div>

        <footer className="modal__footer">
          <p className="modal__hint">
            Échap, le bouton ✕ ou un clic à l’extérieur ferment cette
            fenêtre.
          </p>
          <button type="button" className="btn btn--primary" onClick={close}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  )
}
