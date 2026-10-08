# Glossaire

| Terme | Signification dans l'application |
|---|---|
| **Inscription (enrollment)** | Dossier de demande d'admission d'un enfant, soumis publiquement par un parent. |
| **Statuts d'inscription** | `pending` (en attente), `in_progress` (approuvée, en attente du RDV), `approved` (validée), `rejected_incomplete` (dossier incomplet), `rejected_deleted` (refusée), `archived`. |
| **RDV (appointment)** | Rendez-vous : soit lié à une inscription (venue à la crèche), soit proposé entre parent et direction. |
| **Événement (event)** | Entrée du calendrier : tâche, RDV, mémo, anniversaire… |
| **Mémo** | Note personnelle (`personal_memos`) ou événement de type `memo` visible de son créateur. |
| **Rapport journalier** | Fiche quotidienne d'un enfant (repas, couches, sommeil…). Type `baby` ou `child`. |
| **Fournitures** | Stock de consommables apportés par les parents (couches, lingettes, crème, autre). |
| **Traitement** | Médicament prescrit à un enfant, déclaré par le parent et administré par le personnel. |
| **Permission** | Droit fin assignable à un membre du personnel (ex. `attendance.manage`). |
| **Permission « commune »** | Accordée automatiquement à tout le personnel. |
| **Mon Espace** | Espace parent (aussi accessible aux admin/staff **s'ils ont des enfants**). |
| **Direction** | Libellé métier de `admin`. Le code mentionne parfois un rôle `direction` qui **n'existe pas** dans la base (voir audit). |
| **Developer** | Rôle technique ≙ admin + outils internes. |
| **Cloudinary** | Service d'hébergement de fichiers/images/vidéos. |
| **Neon** | Hébergeur PostgreSQL. |
| **Mode récupération** | Page `/recovery` + API `/api/recovery` protégées par une clé secrète pour restaurer une sauvegarde sans compte. |
