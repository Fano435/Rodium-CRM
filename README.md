# CRM — Gestion de contacts

Application de gestion de contacts façon tableur : édition directe des cellules, tri et filtre par colonne, colonnes personnalisées (ajout, renommage, suppression, réorganisation par glisser-déposer), import en masse.

![alt text](<screenshot.png>)

## Stack technique

**Backend** — NestJS, Prisma, PostgreSQL
**Frontend** — React, TypeScript, Vite, CSS natif (aucun framework CSS)
**Infrastructure** — Docker / Docker Compose (3 services : `db`, `api`, `web`)

### Bibliothèques d'infrastructure (frontend)

| Bibliothèque | Rôle |
|---|---|
| `@tanstack/react-query` | Cache et synchronisation des données serveur — source de vérité unique pour les contacts et les colonnes, séparée de l'état d'interface |
| `@tanstack/react-virtual` | Virtualisation de la liste — nécessaire dès le départ vu le volume attendu (milliers de contacts, aucune pagination côté serveur) |
| `zod` | Validation ET normalisation des données (numéros de téléphone, casse des noms), un seul schéma réutilisé partout : édition cellule par cellule, création, import en masse |
| `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` | Réorganisation des colonnes personnalisées par glisser-déposer |
| `lucide-react` | Icônes |

---

## 1. Lancer l'application

### Prérequis

- Docker et Docker Compose installés

### Étapes

```bash
git clone https://github.com/Fano435/Rodium-CRM.git 
cd Rodium-CRM
cp .env.example .env
docker compose up --build -d
```

- **Frontend** : http://localhost:5173

### Commandes utiles

```bash
# Voir les logs d'un service
docker compose logs -f api
docker compose logs -f web

# Arrêter l'application
docker compose down

# Arrêter et supprimer les données de la base (reset complet)
docker compose down -v
```

---

## 2. Initialiser la base et les données de démonstration

La base PostgreSQL démarre vide. Le schéma (tables `Contact` et `ContactColumn`) est géré par Prisma.

### Appliquer le schéma (migrations)

```bash
docker compose exec api npx prisma migrate dev --name init
```

### Données de démonstration

> **Note** : aucun script de seed automatisé n'est fourni à ce stade (voir *Améliorations prioritaires*). Pour peupler la base, utiliser directement l'interface (ajout de contacts et de colonnes personnalisées, import en masse).

---

## 3. Exécuter les tests

**Aucun test automatisé n'a été écrit sur ce projet** — choix fait pour concentrer le temps disponible sur la maîtrise du CRUD, de l'architecture des colonnes dynamiques et de l'expérience tableur, plutôt que sur la couverture de tests (voir *Limites connues*).

La vérification manuelle se fait via l'interface elle-même, ou via `curl`/Postman sur les endpoints de l'API.

---

## 4. Architecture et principaux choix techniques

### Modèle de données (Prisma)

```prisma
model Contact {
  id           Int            @id @default(autoincrement())
  nom          String
  entreprise   String?
  telephone    String
  score        Int            @default(0)
  statut       StatutContact  @default(PROSPECT)
  customFields Json           @default("{}")
  createdAt    DateTime       @default(now())
}

model ContactColumn {
  id        Int        @id @default(autoincrement())
  label     String
  type      ColumnType
  order     Int
  createdAt DateTime   @default(now())
}
```

**Point d'architecture à noter** : les valeurs dans `customFields` sont indexées par l'**id** de `ContactColumn`, pas par son libellé (`{ "3": "Rennes" }`). Ça permet de renommer une colonne sans jamais avoir à migrer les données déjà stockées dans les contacts existants — renommer une colonne est un simple `UPDATE` sur `ContactColumn.label`.

### Endpoints

```
GET    /contacts
POST   /contacts
POST   /contacts/bulk
PATCH  /contacts/:id
DELETE /contacts/:id

GET    /contact-columns
POST   /contact-columns
PATCH  /contact-columns/reorder   { orderedIds: number[] }
PATCH  /contact-columns/:id       { label }   (le type n'est pas modifiable)
DELETE /contact-columns/:id
```

### Séparation DTO / types Prisma générés

Les **DTO** (`CreateContactDto`, `UpdateContactDto`) valident les données **entrantes depuis le client HTTP** via `class-validator`, tandis que les **types Prisma générés** (`Prisma.ContactCreateInput`, `Prisma.ContactWhereInput`...) sécurisent les données **sortantes vers la base PostgreSQL**. Cette séparation garantit qu'aucune donnée non validée n'atteint la couche de persistance, tout en gardant chaque type synchronisé automatiquement avec sa source de vérité respective.

### État serveur vs état UI, séparation stricte

Les contacts et les colonnes ne vivent que dans le cache React Query, jamais dupliqués dans un state React à côté. L'état d'interface (tri, filtres, ligne en cours de création) reste en `useState` local à `ContactsView`.

### Un seul chargement complet, tri/filtre côté client

`GET /contacts` ne prend aucun paramètre ; tri et filtre se font entièrement côté client sur les données déjà en mémoire. Choix assumé compte tenu du volume attendu (quelques milliers de contacts) et de la simplicité recherchée — la virtualisation (`@tanstack/react-virtual`) absorbe le coût de rendu associé à ce chargement complet.

### Édition "tableur" plutôt que formulaire

Chaque cellule s'édite et se valide indépendamment. Pour un contact existant, la sauvegarde envoie un `PATCH` immédiat par cellule modifiée. Pour un nouveau contact, les valeurs saisies restent en brouillon local (aucun appel réseau) jusqu'à ce que les deux champs obligatoires (`nom`, `telephone`) soient remplis — un seul `POST /contacts` part alors, avec tout ce qui a été saisi jusque-là.

### Validation et normalisation partagées

Un seul schéma Zod (`contact.schema.ts`) sert à la validation d'une cellule isolée, du brouillon de création et de l'import en masse — une seule source de vérité pour les règles de validation côté frontend.

### Architecture multi-conteneurs (api / web / db)

Trois conteneurs Docker indépendants, chacun avec son propre `Dockerfile` et son cycle de build isolé. La base de données ne communique qu'avec l'API via le réseau interne Docker (aucun port exposé côté hôte sur `db`), et le frontend ne consomme que l'API HTTP, jamais la base directement. Le hot-reload est préservé malgré la conteneurisation grâce à des bind mounts combinés à des volumes anonymes dédiés à `node_modules`.

---

## 5. Fonctionnalités terminées / incomplètes

### Terminées

- CRUD complet sur les contacts (création, lecture, mise à jour, suppression)
- Édition directe des cellules, façon tableur
- Colonnes personnalisées : ajout, renommage, suppression, réorganisation par glisser-déposer
- Tri et filtre par colonne (côté client)
- Virtualisation de la liste
- Import en masse de contacts
- Validation et normalisation partagées (Zod) entre édition, création et import
- Frontend fonctionnel, connecté à l'API

### Incomplètes / non traitées

- Pas d'authentification (hors périmètre du test)
- Pas de tests automatisés
- Pas de script de seed automatisé pour les données de démonstration
- Pas de pagination ni de tri/filtre côté serveur — adapté au volume actuel, mais non conçu pour scaler au-delà de quelques milliers de contacts

---

## 6. Limites connues

Par souci de simplicité et compte tenu du temps imparti, certains choix d'implémentation privilégient la rapidité de mise en œuvre au détriment de la robustesse ou de l'expérience utilisateur optimale :

- **Soumission automatique du formulaire de création** : le contact est envoyé (`POST /contacts`) dès que les champs obligatoires `nom` et `telephone` sont renseignés, sans bouton de validation explicite ni étape de relecture.
- **Import en masse (bulk) sans rapport détaillé par ligne** : bien que le même schéma Zod soit réutilisé pour la validation, le bulk import ne fournit pas de rapport ligne par ligne des entrées rejetées — le lot est traité de façon globale.
- **Confirmation de suppression via popup natif du navigateur** : plutôt qu'une modale personnalisée cohérente avec le reste de l'interface, la confirmation de suppression utilise le `confirm()` natif du navigateur.
- **Tri/filtre et chargement entièrement côté client** : pas de pagination ni de requêtage côté serveur — un choix qui tient tant que le volume de contacts reste dans un ordre de grandeur de quelques milliers.

Ces raccourcis reflètent un arbitrage assumé entre exhaustivité et délai plutôt que des angles morts non maîtrisés.

---

## 7. Améliorations prioritaires

1. **Tests automatisés** (unitaires sur les services, e2e sur les endpoints critiques du CRUD)
2. **Rapport détaillé du bulk import**, avec identification précise des lignes rejetées et la raison du rejet
3. **Confirmation de suppression personnalisée** (modale cohérente avec le design du reste de l'interface)
4. **Bouton de soumission explicite** sur le formulaire de création, avec étape de relecture avant envoi
5. **Script de seed** pour initialiser des données de démonstration de façon reproductible
6. **Pagination et tri/filtre côté serveur**, si le volume de contacts dépasse ce que la virtualisation peut absorber confortablement

---

## 8. Outils d'IA utilisés

- **Claude (Anthropic)** : utilisé sur l'ensemble du projet et la rédaction de cette documentation.

