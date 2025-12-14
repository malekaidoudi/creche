# 📱 Composants Mobile - Crèche Mima Elghalia

## Vue d'ensemble

Cette documentation couvre les composants mobiles optimisés pour l'application Crèche Mima Elghalia. Ces composants sont conçus pour offrir une expérience mobile-first tout en maintenant la cohérence avec la version desktop.

## Architecture

```
src/components/mobile/
├── MobileNavigation.jsx     # Bottom navigation bar (5 items max)
├── MobileHeader.jsx         # Header contextuel avec recherche
├── MobileCard.jsx           # Carte universelle
├── MobileList.jsx           # Liste avec swipe actions
├── MobileForm.jsx           # Formulaire multi-étapes
├── MobileStatCard.jsx       # Carte statistique/KPI
├── MobileDashboard.jsx      # Dashboard admin/staff mobile
├── MobileParentSpace.jsx    # Espace parent "Mon Espace" mobile
├── MobileAttendance.jsx     # Gestion présences tactile
├── MobileChildrenList.jsx   # Liste enfants avec fiches
├── MobilePlanning.jsx       # Planning avec mini-calendrier
├── MobileMessages.jsx       # Interface chat-like
├── adapters/
│   ├── TableToListAdapter.jsx   # Conversion tableau → liste
│   ├── FormToStepsAdapter.jsx   # Conversion formulaire → étapes
│   └── index.js
├── index.js                 # Export principal
└── README.md                # Cette documentation
```

---

## Composants

### MobileNavigation

Bottom navigation bar fixe avec 5 éléments maximum.

```jsx
import { MobileNavigation } from '@/components/mobile';

// Utilisation dans le layout
<MobileNavigation />
```

**Caractéristiques :**
- Navigation fixe en bas de l'écran
- Affichée uniquement sur mobile (< 1024px)
- Menu "Plus" avec bottom sheet
- Support RTL automatique
- Filtrage par rôle utilisateur

---

### MobileHeader

Header contextuel avec titre, actions et recherche.

```jsx
import { MobileHeader } from '@/components/mobile';

<MobileHeader 
  title="Présences"
  subtitle="Aujourd'hui"
  showBack={true}
  showSearch={true}
  showNotifications={true}
  actions={[
    { icon: Filter, onClick: handleFilter, label: 'Filtrer' }
  ]}
  onSearch={(query) => handleSearch(query)}
/>
```

**Props :**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | Titre principal |
| `subtitle` | string | - | Sous-titre optionnel |
| `showBack` | boolean | false | Afficher bouton retour |
| `showSearch` | boolean | false | Activer la recherche |
| `showNotifications` | boolean | true | Afficher icône notifications |
| `actions` | array | [] | Actions personnalisées |
| `onSearch` | function | - | Callback de recherche |

---

### MobileCard

Carte universelle optimisée pour mobile.

```jsx
import { MobileCard } from '@/components/mobile';

<MobileCard 
  title="Ahmed Bennani"
  subtitle="3 ans - Groupe Papillons"
  icon={Baby}
  iconColor="blue"
  badge={{ text: "Présent", color: "green" }}
  showChevron={true}
  onClick={() => navigate(`/child/${id}`)}
  actions={[
    { icon: Eye, label: 'Voir', onClick: handleView },
    { icon: Edit, label: 'Modifier', variant: 'primary', onClick: handleEdit }
  ]}
>
  {/* Contenu additionnel */}
</MobileCard>
```

**Props :**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | Titre de la carte |
| `subtitle` | string | - | Sous-titre |
| `description` | string | - | Description longue |
| `icon` | component | - | Icône Lucide |
| `iconColor` | string | 'primary' | Couleur de l'icône |
| `image` | string | - | URL d'image |
| `badge` | object | - | Badge { text, color } |
| `badges` | array | [] | Badges multiples |
| `actions` | array | [] | Actions en bas de carte |
| `onClick` | function | - | Callback click |
| `showChevron` | boolean | false | Afficher flèche |
| `variant` | string | 'default' | default/outlined/elevated |

---

### MobileList

Liste avec support swipe pour actions.

```jsx
import { MobileList } from '@/components/mobile';

<MobileList 
  items={children}
  keyExtractor={(item) => item.id}
  renderItem={(child) => (
    <MobileCard 
      title={child.name}
      subtitle={child.group}
    />
  )}
  swipeActions={[
    { icon: Edit, label: 'Modifier', color: 'blue', onClick: handleEdit },
    { icon: Trash, label: 'Supprimer', color: 'red', onClick: handleDelete }
  ]}
  emptyMessage="Aucun enfant"
  emptyIcon={Users}
/>
```

**Props :**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | array | [] | Données à afficher |
| `renderItem` | function | - | Render function |
| `keyExtractor` | function | item.id | Extracteur de clé |
| `swipeActions` | array | [] | Actions swipe |
| `emptyMessage` | string | - | Message si vide |
| `emptyIcon` | component | - | Icône si vide |
| `gap` | string | 'md' | Espacement sm/md/lg |

---

### MobileForm

Formulaire multi-étapes avec navigation.

```jsx
import { MobileForm } from '@/components/mobile';

<MobileForm 
  steps={[
    { 
      title: 'Informations enfant',
      description: 'Renseignez les informations de base',
      content: <ChildInfoStep />
    },
    { 
      title: 'Informations parent',
      content: <ParentInfoStep />
    },
    { 
      title: 'Confirmation',
      content: <ConfirmationStep />
    }
  ]}
  onSubmit={handleSubmit}
  onStepChange={(step) => console.log('Step:', step)}
  validateStep={async (stepIndex) => {
    // Retourner un objet d'erreurs ou {}
    return {};
  }}
  submitLabel="Confirmer l'inscription"
  isSubmitting={loading}
/>
```

---

### MobileStatCard

Carte de statistique/KPI.

```jsx
import { MobileStatCard } from '@/components/mobile';

<MobileStatCard 
  title="Enfants présents"
  value="18/24"
  change="+2 cette semaine"
  trend="up"
  icon={Users}
  color="green"
  onClick={() => navigate('/attendance')}
/>
```

---

## Adaptateurs

### TableToListAdapter

Convertit automatiquement un tableau en liste mobile.

```jsx
import { TableToListAdapter } from '@/components/mobile';

<TableToListAdapter 
  columns={[
    { key: 'name', label: 'Nom', isPrimary: true },
    { key: 'email', label: 'Email', isSecondary: true },
    { key: 'status', label: 'Statut', isBadge: true, badgeColors: {
      'active': 'green',
      'inactive': 'red'
    }},
    { key: 'createdAt', label: 'Créé le', type: 'date' }
  ]}
  rows={users}
  onRowClick={(row) => navigate(`/user/${row.id}`)}
  actions={[
    { icon: Eye, label: 'Voir', onClick: handleView }
  ]}
  swipeActions={[
    { icon: Trash, label: 'Supprimer', color: 'red', onClick: handleDelete }
  ]}
  sortable={true}
  filterable={true}
/>
```

### FormToStepsAdapter

Convertit un formulaire complexe en étapes.

```jsx
import { FormToStepsAdapter } from '@/components/mobile';

<FormToStepsAdapter 
  sections={[
    {
      title: 'Informations personnelles',
      fields: [
        { name: 'firstName', label: 'Prénom', type: 'text', required: true },
        { name: 'lastName', label: 'Nom', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'birthDate', label: 'Date de naissance', type: 'date' },
        { name: 'gender', label: 'Genre', type: 'select', options: [
          { value: 'male', label: 'Masculin' },
          { value: 'female', label: 'Féminin' }
        ]}
      ]
    }
  ]}
  onSubmit={handleSubmit}
  initialValues={defaultValues}
/>
```

---

## Hook useIsMobile

Détection du viewport mobile.

```jsx
import useIsMobile from '@/hooks/useIsMobile';

const MyComponent = () => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileView />;
  }
  return <DesktopView />;
};
```

---

## Styles CSS

Les styles mobiles sont dans `src/styles/mobile.css` et incluent :

- **Safe Area** : Support iOS notch et home indicator
- **Touch Targets** : Minimum 44px pour l'accessibilité
- **Bottom Sheet** : Animations et styles
- **Skeleton Loading** : Placeholders de chargement
- **Transitions** : Animations fluides

---

## Bonnes pratiques

### 1. Touch Targets
Tous les éléments interactifs doivent avoir une taille minimum de 44x44px.

### 2. Espacement
Utiliser les classes Tailwind avec les préfixes responsive :
- Mobile first : `p-4`
- Desktop : `lg:p-6`

### 3. Navigation
- Maximum 5 éléments dans la bottom nav
- Actions secondaires dans le menu "Plus"

### 4. Formulaires
- Un champ par ligne sur mobile
- Labels au-dessus des champs
- Utiliser les types d'input appropriés (tel, email, date)

### 5. Listes
- Utiliser swipe pour actions secondaires
- Afficher les infos essentielles en premier
- "Voir plus" pour les détails

---

## Tests

Les composants incluent des tests unitaires dans `src/test/mobile/`.

```bash
# Exécuter les tests mobiles
npm run test -- --grep mobile
```

---

## Support

Pour toute question, consulter la documentation principale ou contacter l'équipe de développement.
