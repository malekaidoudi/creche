# Tests et Assurance Qualité

Ce document dresse l'état des suites de tests automatisés et des procédures de validation du projet.

---

## 1. Tests automatisés existants

### A. Backend (Jest & Supertest)
Les tests backend sont situés dans `backend/tests/` :
- `tests/middleware/auth.test.js` : Teste les middlewares d'authentification et les vérifications de rôles.
- `tests/utils/logger.test.js` : Teste le fonctionnement du logger de sécurité.
- `tests/utils/apiResponse.test.js` : Teste les formateurs de réponses JSON.
- `tests/enrollments.test.js` : Teste les endpoints de soumission et traitement des inscriptions.

Pour exécuter les tests du backend :
```bash
cd backend
npm test
```

### B. Frontend (Vitest & React Testing Library)
Les tests frontend se trouvent dans `frontend/src/test/` :
- `src/test/HomePage.test.jsx` : Teste le rendu de la page d'accueil publique.
- `src/test/components/StatsCard.test.jsx` : Teste l'affichage d'un composant de statistique.

Pour exécuter les tests du frontend :
```bash
cd frontend
npm test
```

---

## 2. Collections Postman et tests d'API manuels

Le dépôt contient des collections d'API historiques à la racine et dans `tests/` :
- `POSTMAN_COLLECTION.json` : Collection Postman des endpoints de l'application.
- `tests/Creche_API.postman_collection.json` : Variante de collection d'intégration.
- Un ensemble d'environ 70 comptes-rendus de tests au format Markdown (`tests/*.md`) documentant des sessions de tests manuelles passées.

---

## 3. Couverture et axes d'amélioration

- **Faible couverture globale** : Seule une infime fraction des 317 routes d'API est couverte par des tests automatisés Jest.
- **Absence de tests End-to-End (E2E)** : Aucun outil de test de bout en bout (Cypress, Playwright) n'est configuré pour valider les scénarios complets (ex: inscription → réception e-mail → approbation admin → pointage).
- **Priorité recommandée** : Écrire des tests d'intégration systématiques pour les routes non protégées identifiées lors de l'audit afin de valider leur verrouillage futur.
