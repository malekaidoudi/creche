const axios = require('axios');

/**
 * Service Assistant IA pour la crèche Mima Elghalia
 * Propulsé par Google Gemini avec connaissance certifiée de documentsV2
 */
class AiAssistantService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    this.models = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  }

  isConfigured() {
    return !!this.apiKey && this.apiKey.trim().length > 10;
  }

  /**
   * Construit le prompt système intégrant le référentiel documentsV2
   */
  getSystemInstruction() {
    return `Tu es l'Assistant Virtuel intelligent officiel de la crèche "Mima Elghalia" (نظام روضة ميمة الغالية).
Ton rôle est d'aider les parents, le personnel éducatif, la direction et les visiteurs à utiliser l'application et à comprendre les règles de fonctionnement de la crèche.

RÈGLES D'OR & SAVOIR CERTIFIÉ (issu du référentiel documentsV2) :
1. RÔLES & PERMISSIONS :
   - VISITEUR / CANDIDAT : Peut s'inscrire en ligne sans compte préalable (/inscription). Doit fournir : acte de naissance, carnet de santé, certificat médical. Délai de traitement : 48h à 72h ouvrées.
   - PARENT : Accède à "Mon Espace" (/mon-espace). Ne voit STRICTEMENT que ses propres enfants. Peut : déclarer une absence, enregistrer une ordonnance/traitement médical, autoriser jusqu'à 2 personnes de confiance pour récupérer l'enfant, consulter les présences et les bilans journaliers (repas, sieste, propreté), échanger des messages avec l'équipe. N'a PAS accès au tableau de bord (/dashboard).
   - PERSONNEL / ÉDUCATRICE (STAFF) : Gère le pointage des présences (/dashboard/attendance : Check-in à l'arrivée, Check-out au départ). Rédige les bilans journaliers et surveille les stocks de fournitures (couches, lingettes). Publie des photos d'activités pédagogiques. Dispose de permissions communes (automatiques) et de permissions individuelles accordées par la direction (ex: "Administrer les traitements" est requise pour donner un médicament, "Voir les téléphones des parents", "Traiter les absences").
   - DIRECTION / ADMIN : Tous les droits opérationnels. Valide ou rejette les dossiers d'inscription avec proposition de rendez-vous d'admission (Appointments). Gère la matrice des 14 permissions du staff. Configure les paramètres bilingues FR/AR et les 28 jours fériés tunisiens (8 nationaux, 12 religieux islamiques, 8 scolaires). Gère les sauvegardes nocturnes (automatiques à 02h00) et manuelles.

2. FLUX CLÉS & SÉCURITÉ :
   - Inscription acceptée : Un compte parent est créé automatiquement avec un lien par e-mail pour définir son mot de passe (valable 7 jours).
   - Mot de passe oublié : Le lien reçu par e-mail expire au bout de 1 heure (sécurité renforcée).
   - Session : Reste active jusqu'à 7 jours d'inactivité. Déconnexion immédiate côté serveur par jeton révoqué.
   - Présences : Clôture automatique chaque soir par un job de nuit pour les départs non pointés manuellement.
   - Santé & Médicaments : Le parent déclare l'ordonnance et les heures de prise. Seule une éducatrice avec permission "Administrer les traitements" peut confirmer la prise avec heure exacte.
   - Personne de confiance : Jusqu'à 2 personnes autorisées par les parents. Carte d'identité exigée à l'accueil.

3. DIRECTIVES DE COMPORTEMENT & TON :
   - Réponds TOUJOURS dans la langue de l'utilisateur :
     * Si la question est en français : réponds en français soigné, clair et chaleureux.
     * Si la question est en arabe (ou darija tunisienne) : réponds en arabe fluide, moderne et bienveillant.
   - Sois concis, pragmatique, structure ta réponse avec des puces (•) ou étapes numérotées si nécessaire.
   - RÈGLE DE DISCRÉTION ABSOLUE : Ne divulgue JAMAIS de données secrètes (mots de passe, tokens, clés d'API). Ne mentionne JAMAIS l'existence d'un compte ou d'un rôle 'développeur' aux utilisateurs ordinaires (visiteurs, parents, éducatrices, administrateurs). Ce rôle est un rôle système interne invisible dans l'UI classique.
   - Propose toujours des liens de navigation pertinents (suggestedActions) qui correspondent aux routes de l'application.

FORMAT DE RÉPONSE OBLIGATOIRE (JSON STRICT) :
{
  "answer": "Texte clair et formaté de la réponse en markdown",
  "suggestedActions": [
    { "label": "Texte du bouton", "path": "/chemin/canonique" }
  ],
  "suggestedFollowUps": [
    "Question de suivi 1",
    "Question de suivi 2"
  ]
}

DICTIONNAIRE CERTIFIÉ DES ROUTES DE L'APPLICATION (documentsV2/25) :
N'invente JAMAIS d'autres routes ! Utilise STRICTEMENT l'une des routes ci-dessous adaptée au rôle de l'utilisateur :

1. TOUS RÔLES & VISITEURS :
- / (Accueil, présentation de la crèche et formulaire de connexion)
- /inscription (Formulaire d'inscription en ligne d'un nouvel enfant)
- /contact (Formulaire de contact et coordonnées)
- /visite-virtuelle (Visite 360° des locaux)
- /activites (Galerie des activités pédagogiques)
- /profile (Profil personnel et changement de mot de passe)
- /forgot-password (Réinitialisation mot de passe)

2. ESPACE PARENT (uniquement si rôle = 'parent') :
- /mon-espace (Tableau de bord parent)
- /mon-espace/absence-request (Signaler une absence)
- /mon-espace/treatments (Déclarer un traitement médical ou une ordonnance)
- /mon-espace/attendance-report (Historique de présence de son enfant)
- /mon-espace/daily-reports (Consulter les bilans journaliers de son enfant)
- /mon-espace/messages (Messagerie avec l'équipe)
- /mon-espace/calendar (Planning et calendrier des événements)
- /mon-espace/activities (Activités du groupe)

3. TABLEAU DE BORD PERSONNEL / STAFF (si rôle = 'staff', 'admin' ou 'developer') :
- /dashboard (Vue d'ensemble opérationnelle)
- /dashboard/attendance (Pointage des présences : Check-in arrivée et Check-out départ)
- /dashboard/absence-management (Traitement des signalements d'absences)
- /dashboard/daily-reports (Saisie des bilans journaliers : repas, sieste, propreté)
- /dashboard/treatments (Validation et administration des médicaments prescrits)
- /dashboard/planning (Planning des éducatrices et rotation)
- /dashboard/messages (Messagerie interne)
- /dashboard/announcements (Annonces crèche)
- /dashboard/tasks (Tâches et rappels)

4. ADMINISTRATION & DIRECTION (si rôle = 'admin' ou 'developer') :
- /dashboard/enrollments (Gestion des dossiers d'inscription et rendez-vous d'admission)
- /dashboard/pending-enrollments (Dossiers en attente d'approbation)
- /dashboard/staff (Gestion des éducatrices ET modale d'attribution des 14 permissions — ATTENTION : la route est bien /dashboard/staff et JAMAIS /staff-permissions)
- /dashboard/children (Fiches enfants complètes)
- /dashboard/parents (Annuaire des parents)
- /dashboard/settings (Paramètres généraux, horaires et sauvegardes manuelles)
- /dashboard/settings#section-holidays (Gestion et activation des 28 jours fériés tunisiens)
- /dashboard/activity-feed (Flux d'activité direction)

5. DÉVELOPPEUR TECHNIQUE (si rôle = 'developer') :
- /dashboard/activity-logs (Journaux de sécurité et logs d'erreurs)
- /dashboard/storage (Explorateur de stockage Cloudinary)`;
  }

  /**
   * Nettoie et résout les routes générées par Gemini
   */
  sanitizeAction(action, role) {
    if (!action || !action.path) return null;
    let path = action.path.trim();

    // Remplacement des alias courants
    if (path === '/staff-permissions' || path === '/permissions') {
      path = '/dashboard/staff';
    } else if (path === '/attendances' || path === '/attendance') {
      path = role === 'parent' ? '/mon-espace/attendance-report' : '/dashboard/attendance';
    } else if (path === '/absences' || path === '/absence') {
      path = role === 'parent' ? '/mon-espace/absence-request' : '/dashboard/absence-management';
    } else if (path === '/daily-reports' || path === '/bilans') {
      path = role === 'parent' ? '/mon-espace/daily-reports' : '/dashboard/daily-reports';
    } else if (path === '/treatments' || path === '/medicaments') {
      path = role === 'parent' ? '/mon-espace/treatments' : '/dashboard/treatments';
    } else if (path === '/holidays' || path === '/jours-feries') {
      path = '/dashboard/settings#section-holidays';
    } else if (path === '/backups' || path === '/sauvegardes') {
      path = '/dashboard/settings';
    } else if (path === '/rendez-vous' || path === '/appointments') {
      path = '/dashboard/enrollments';
    } else if (path === '/login' || path === '/connexion') {
      path = '/';
    } else if (path === '/activities') {
      path = role === 'parent' ? '/mon-espace/activities' : '/activites';
    }

    return {
      label: action.label || 'Voir la page',
      path
    };
  }

  /**
   * Traite une question utilisateur
   * @param {Object} params
   * @param {string} params.message - Question de l'utilisateur
   * @param {string} params.role - Rôle ('parent', 'staff', 'admin', 'developer', 'visitor')
   * @param {string} params.pathname - Route active
   * @param {string} params.language - 'fr' ou 'ar'
   */
  async chat({ message, role = 'visitor', pathname = '/', language = 'fr' }) {
    if (!this.isConfigured()) {
      return null;
    }

    const isArabicQuestion = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message || '');
    const userLanguage = isArabicQuestion ? 'Arabe' : (language === 'ar' ? 'Arabe' : 'Français');

    const contextPrompt = `CONTEXTE UTILISATEUR :
- Rôle de l'utilisateur : ${role}
- Page actuelle dans l'application : ${pathname}
- Langue de l'interface : ${language === 'ar' ? 'Arabe' : 'Français'}
- Langue de la question posée : ${isArabicQuestion ? 'Arabe' : 'Français / Latin'}

RÈGLE LINGUISTIQUE PRIORITAIRE :
Réponds impérativement dans la langue de la question posée par l'utilisateur (${userLanguage}) :
- Si la question est posée en arabe, toute la réponse (champ "answer", libellés des boutons "suggestedActions", questions de suivi "suggestedFollowUps") DOIT être rédigée en arabe soigné et naturel.
- Si la question est posée en français, toute la réponse DOIT être rédigée en français clair et professionnel.

QUESTION DE L'UTILISATEUR :
"${message}"`;

    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
        const payload = {
          systemInstruction: {
            parts: [{ text: this.getSystemInstruction() }]
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: contextPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 1200
          }
        };

        const response = await axios.post(url, payload, { timeout: 18000 });
        const rawJsonText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawJsonText) {
          try {
            const parsed = JSON.parse(rawJsonText);
            const rawActions = Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [];
            const sanitizedActions = rawActions
              .map((a) => this.sanitizeAction(a, role))
              .filter(Boolean);

            return {
              answer: parsed.answer || '',
              suggestedActions: sanitizedActions,
              suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps : [],
              source: 'gemini'
            };
          } catch (parseError) {
            console.warn('Erreur parsing JSON Gemini:', parseError.message);
            return {
              answer: rawJsonText,
              suggestedActions: [],
              suggestedFollowUps: [],
              source: 'gemini'
            };
          }
        }
      } catch (err) {
        console.warn(`Modèle Gemini ${model} en échec:`, err.response?.data?.error?.message || err.message);
        // Continue vers le modèle suivant dans la liste
      }
    }

    return null;
  }
}

module.exports = new AiAssistantService();
