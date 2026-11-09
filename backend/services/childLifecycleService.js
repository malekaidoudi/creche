/**
 * Service centralisé pour la gestion du cycle de vie des enfants
 * 
 * Ce service unifie toutes les opérations liées aux enfants :
 * - Création (inscription)
 * - Suppression
 * - Archivage
 * 
 * Toutes les méthodes d'inscription doivent utiliser ce service
 * pour garantir la cohérence des données.
 */

const db = require('../config/db_postgres');
const cloudinaryService = require('./cloudinaryService');
const pushNotificationService = require('./pushNotificationService');

/**
 * Crée un enfant avec toutes les étapes associées
 * 
 * @param {Object} childData - Données de l'enfant
 * @param {string} childData.first_name - Prénom (requis)
 * @param {string} childData.last_name - Nom (requis)
 * @param {string} childData.birth_date - Date de naissance (requis)
 * @param {string} childData.gender - Genre (male/female)
 * @param {string} childData.medical_info - Infos médicales
 * @param {number} childData.parent_id - ID du parent
 * @param {string} childData.emergency_contact_name - Contact d'urgence
 * @param {string} childData.emergency_contact_phone - Téléphone urgence
 * @param {string} childData.photo_url - URL photo
 * 
 * @param {Object} options - Options supplémentaires
 * @param {number} options.enrollment_id - ID de l'inscription (si via workflow inscription)
 * @param {number} options.created_by - ID de l'utilisateur qui crée
 * @param {boolean} options.transfer_documents - Transférer les documents d'inscription
 * @param {boolean} options.create_birthday_event - Créer l'événement anniversaire (défaut: true)
 * @param {boolean} options.create_notification - Créer notification parent (défaut: true)
 * @param {boolean} options.archive_enrollment - Archiver l'inscription (défaut: true si enrollment_id)
 * @param {Object} options.enrollment_data - Données d'inscription pour l'archive
 * 
 * @returns {Object} { success, childId, child, error }
 */
async function createChild(childData, options = {}) {
    const {
        first_name,
        last_name,
        birth_date,
        gender: rawGender,
        medical_info,
        parent_id,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_choice,
        father_name,
        father_phone,
        mother_name,
        mother_phone,
        account_holder,
        photo_url,
        saturday_attendance,
        care_schedule,
        monthly_discount,
        doctor_name,
        doctor_phone,
        allergies,
        habits_notes,
        weight_kg,
        height_cm,
        trusted_contacts
    } = childData;

    const {
        enrollment_id,
        created_by,
        transfer_documents = true,
        create_birthday_event = false,
        create_notification = true,
        archive_enrollment = !!enrollment_id,
        enrollment_data = {}
    } = options;

    try {
        console.log(`👶 [ChildLifecycle] Création enfant: ${first_name} ${last_name || ''}`);

        // 1. Normaliser le genre
        let gender = 'male';
        const genderLower = (rawGender || '').toLowerCase();
        if (['f', 'female', 'fille', 'féminin'].includes(genderLower)) {
            gender = 'female';
        }

        // 2. Vérifier les doublons
        const duplicateCheck = await db.query(`
            SELECT id, first_name, last_name, birth_date FROM children 
            WHERE LOWER(first_name) = LOWER($1) 
            AND LOWER(last_name) = LOWER($2) 
            AND birth_date = $3 
            AND is_active = true
        `, [first_name, last_name || '', birth_date]);

        if (duplicateCheck.rows.length > 0) {
            console.log(`⚠️ [ChildLifecycle] Enfant déjà existant: ${first_name} ${last_name}`);
            return {
                success: false,
                error: 'Un enfant avec le même nom, prénom et date de naissance existe déjà',
                duplicate: duplicateCheck.rows[0]
            };
        }

        const parsedWeight = (weight_kg !== undefined && weight_kg !== null && weight_kg !== '') ? parseFloat(weight_kg) : null;
        const parsedHeight = (height_cm !== undefined && height_cm !== null && height_cm !== '') ? parseFloat(height_cm) : null;
        const safeTrustedContacts = Array.isArray(trusted_contacts) ? JSON.stringify(trusted_contacts.slice(0, 2)) : (trusted_contacts ? JSON.stringify(trusted_contacts) : '[]');

        let safeAllergies = '[]';
        if (typeof allergies === 'string') {
            const trimmed = allergies.trim();
            if (trimmed) {
                try {
                    JSON.parse(trimmed);
                    safeAllergies = trimmed;
                } catch (_) {
                    const items = trimmed.split(',').map(s => s.trim()).filter(Boolean);
                    safeAllergies = JSON.stringify(items);
                }
            }
        } else if (Array.isArray(allergies)) {
            safeAllergies = JSON.stringify(allergies);
        } else if (allergies) {
            safeAllergies = JSON.stringify(allergies);
        }

        // 3. Créer l'enfant
        const admissionDateVal = options.enrollment_date || new Date().toISOString().split('T')[0];
        const childResult = await db.query(`
            INSERT INTO children (
                first_name, last_name, birth_date, gender, 
                medical_info, parent_id, emergency_contact_name,
                emergency_contact_phone, emergency_contact_choice,
                father_name, father_phone, mother_name, mother_phone, account_holder,
                photo_url, saturday_attendance, care_schedule, monthly_discount,
                doctor_name, doctor_phone, allergies, habits_notes, weight_kg, height_cm,
                trusted_contacts, growth_measured_at, is_active, admission_date, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
                CASE WHEN $23::numeric IS NOT NULL OR $24::numeric IS NOT NULL THEN NOW() ELSE NULL END,
                true, $26::date, NOW()
            )
            RETURNING *
        `, [
            first_name,
            last_name || '',
            birth_date,
            gender,
            medical_info || null,
            parent_id || null,
            // Modèle unifié : 'father'/'mother' → coordonnées déjà portées par
            // les champs du parent ; 'custom' → nom + téléphone du tiers.
            ['father', 'mother'].includes(emergency_contact_choice)
                ? null
                : (emergency_contact_name || null),
            ['father', 'mother'].includes(emergency_contact_choice)
                ? null
                : (emergency_contact_phone || null),
            ['father', 'mother', 'custom'].includes(emergency_contact_choice)
                ? emergency_contact_choice
                : 'custom',
            father_name || null,
            father_phone || null,
            mother_name || null,
            mother_phone || null,
            account_holder || 'father',
            photo_url || null,
            !!saturday_attendance,
            care_schedule === 'half_day' ? 'half_day' : 'full_day',
            parseFloat(monthly_discount) || 0.00,
            doctor_name || null,
            doctor_phone || null,
            safeAllergies,
            habits_notes || null,
            parsedWeight,
            parsedHeight,
            safeTrustedContacts,
            admissionDateVal
        ]);

        const child = childResult.rows[0];
        const childId = child.id;
        console.log(`✅ [ChildLifecycle] Enfant créé avec ID: ${childId}`);

        // 3b. Enregistrer la mesure de croissance initiale si disponible
        if (parsedWeight !== null || parsedHeight !== null) {
            try {
                await db.query(`
                    INSERT INTO child_growth_records (child_id, weight_kg, height_cm, recorded_by)
                    VALUES ($1, $2, $3, $4)
                `, [childId, parsedWeight, parsedHeight, created_by || null]);
            } catch (growthErr) {
                console.warn('⚠️ [ChildLifecycle] Avertissement enregistrement croissance:', growthErr.message);
            }
        }

        // 4. Transférer les documents d'inscription si applicable
        if (enrollment_id && transfer_documents) {
            await transferEnrollmentDocuments(enrollment_id, childId);
        }

        // 5. Créer l'événement anniversaire
        if (create_birthday_event && birth_date) {
            await createBirthdayEvent(childId, first_name, last_name, birth_date, created_by);
        }

        // 6. Créer notification pour le parent
        if (create_notification && parent_id) {
            await createEnrollmentNotification(parent_id, first_name);
        }

        // 7. Archiver l'inscription
        if (archive_enrollment && enrollment_id) {
            await archiveEnrollment(enrollment_id, childId, parent_id, enrollment_data, created_by);
        }

        // 8. Créer placeholder document si pas de documents transférés
        if (!enrollment_id) {
            await createDocumentPlaceholder(childId, first_name, last_name);
        }

        // 9. Générer la première cotisation lors de l'admission
        let generatedInvoice = null;
        try {
            const billingService = require('./billingService');
            const billingSettings = await billingService.getSettings();
            if (billingSettings.billing_enabled || options.enrollment_id) {
                const enrollDate = options.enrollment_date ? new Date(options.enrollment_date) : new Date();
                const targetMonth = (!isNaN(enrollDate.getTime())) ? enrollDate.getMonth() + 1 : (new Date().getMonth() + 1);
                const targetYear = (!isNaN(enrollDate.getTime())) ? enrollDate.getFullYear() : (new Date().getFullYear());

                const prorataAmount = (options.first_month_prorata !== undefined && options.first_month_prorata !== null && options.first_month_prorata !== '')
                    ? parseFloat(options.first_month_prorata)
                    : null;

                generatedInvoice = await billingService.generateInvoiceForChild(child, targetMonth, targetYear, {
                    isFirstEnrollment: true,
                    includeInsurance: true,
                    prorataAmount: prorataAmount,
                    customDiscount: parseFloat(child.monthly_discount) || 0,
                    createdBy: created_by
                });
                console.log(`💳 [ChildLifecycle] Cotisation initiale générée pour ${first_name} (${targetMonth}/${targetYear}, prorata: ${prorataAmount}, remise: ${child.monthly_discount})`);
            }
        } catch (billingErr) {
            console.warn('⚠️ [ChildLifecycle] Avertissement génération facture initiale:', billingErr.message);
        }

        console.log(`🎉 [ChildLifecycle] Inscription complète pour ${first_name} ${last_name} (ID: ${childId})`);

        return {
            success: true,
            childId,
            child,
            invoice: generatedInvoice
        };

    } catch (error) {
        console.error(`❌ [ChildLifecycle] Erreur création enfant:`, error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Supprime un enfant et toutes ses données associées
 * 
 * @param {number} childId - ID de l'enfant
 * @param {Object} options - Options
 * @param {boolean} options.archive - Archiver au lieu de supprimer définitivement (défaut: true)
 * @param {number} options.deleted_by - ID de l'utilisateur qui supprime
 * @param {string} options.reason - Raison de la suppression
 * 
 * @returns {Object} { success, error }
 */
async function deleteChild(childId, options = {}) {
    const {
        archive = true,
        deleted_by,
        reason
    } = options;

    try {
        console.log(`🗑️ [ChildLifecycle] ${archive ? 'Archivage' : 'Suppression'} enfant ID: ${childId}`);

        // 1. Vérifier que l'enfant existe
        console.log(`🔍 [ChildLifecycle] Vérification existence enfant...`);
        const childCheck = await db.query(`
            SELECT * FROM children WHERE id = $1
        `, [childId]);

        if (childCheck.rows.length === 0) {
            console.log(`❌ [ChildLifecycle] Enfant ID ${childId} non trouvé`);
            return { success: false, error: 'Enfant non trouvé' };
        }

        const child = childCheck.rows[0];
        console.log(`✅ [ChildLifecycle] Enfant trouvé: ${child.first_name} ${child.last_name}`);

        // 2. Supprimer les événements anniversaire
        console.log(`🎂 [ChildLifecycle] Suppression événements anniversaire...`);
        try {
            await db.query(`
                DELETE FROM events 
                WHERE child_id = $1 AND type = 'birthday'
            `, [childId]);
            console.log(`🎂 [ChildLifecycle] Événements anniversaire supprimés`);
        } catch (eventErr) {
            console.warn(`⚠️ [ChildLifecycle] Erreur suppression événements (ignorée):`, eventErr.message);
        }

        // 3. Archiver ou supprimer les documents Cloudinary
        if (cloudinaryService.isConfigured()) {
            if (archive) {
                // Déplacer vers archives
                const archiveResult = await cloudinaryService.archiveChildFolder(childId);
                if (archiveResult.success) {
                    console.log(`☁️ [ChildLifecycle] Documents archivés: ${archiveResult.archivedCount} fichier(s)`);
                }
            } else {
                // Supprimer définitivement
                const deleteResult = await cloudinaryService.deleteFolder(`children/child_${childId}`);
                if (deleteResult.success) {
                    console.log(`☁️ [ChildLifecycle] Documents Cloudinary supprimés`);
                }
            }
        }

        if (archive) {
            // 4a. Archiver l'enfant (soft delete)
            await db.query(`
                UPDATE children 
                SET is_active = false, 
                    status = 'archived',
                    updated_at = NOW(),
                    departure_date = NOW(),
                    departure_reason = $2
                WHERE id = $1
            `, [childId, reason || 'Archivé']);

            // 4b. Synchronisation cycle de vie : Archiver également le dossier d'inscription lié
            try {
                await db.query(`
                    UPDATE enrollments 
                    SET status = 'archived', updated_at = NOW() 
                    WHERE child_id = $1 AND status != 'archived'
                `, [childId]);
            } catch (enrErr) {
                console.warn(`⚠️ [ChildLifecycle] Erreur archivage inscription liée (ignorée):`, enrErr.message);
            }

            // 4c. Annuler les rendez-vous en cours ou proposés pour cet enfant
            try {
                await db.query(`
                    UPDATE appointments 
                    SET status = 'cancelled', updated_at = NOW() 
                    WHERE (child_id = $1 OR enrollment_id IN (SELECT id FROM enrollments WHERE child_id = $1))
                      AND status NOT IN ('completed', 'cancelled')
                `, [childId]);
            } catch (aptErr) {
                console.warn(`⚠️ [ChildLifecycle] Erreur annulation RDV liés (ignorée):`, aptErr.message);
            }

            // 4d. Annuler les tâches associées encore en attente
            try {
                await db.query(`
                    UPDATE tasks 
                    SET status = 'cancelled', updated_at = NOW() 
                    WHERE enrollment_id IN (SELECT id FROM enrollments WHERE child_id = $1)
                      AND status = 'pending'
                `, [childId]);
            } catch (taskErr) {
                console.warn(`⚠️ [ChildLifecycle] Erreur annulation tâches liées (ignorée):`, taskErr.message);
            }

            console.log(`📦 [ChildLifecycle] Enfant ${child.first_name} archivé avec synchronisation enrollments et RDV`);
        } else {
            // 4e. Supprimer définitivement (cascade sur enrollments, documents, etc.)
            try {
                await db.query(`DELETE FROM enrollments WHERE child_id = $1`, [childId]);
                await db.query(`DELETE FROM children_documents WHERE child_id = $1`, [childId]);
            } catch (cascadeErr) {
                console.warn(`⚠️ [ChildLifecycle] Erreur cascade suppression dossiers/documents:`, cascadeErr.message);
            }
            await db.query(`DELETE FROM children WHERE id = $1`, [childId]);
            console.log(`🗑️ [ChildLifecycle] Enfant ${child.first_name} et ses dossiers supprimés définitivement`);
        }

        return { success: true, archived: archive };

    } catch (error) {
        console.error(`❌ [ChildLifecycle] Erreur suppression enfant:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Rejette une inscription
 * 
 * @param {number} enrollmentId - ID de l'inscription
 * @param {Object} options - Options
 * @param {string} options.reason - Raison du rejet
 * @param {boolean} options.incomplete_file - Dossier incomplet (garde les documents)
 * @param {number} options.rejected_by - ID de l'utilisateur qui rejette
 * 
 * @returns {Object} { success, error }
 */
async function rejectEnrollment(enrollmentId, options = {}) {
    const {
        reason,
        incomplete_file = false,
        rejected_by
    } = options;

    try {
        console.log(`❌ [ChildLifecycle] Rejet inscription #${enrollmentId} (dossier incomplet: ${incomplete_file})`);

        // 1. Vérifier que l'inscription existe
        const enrollmentCheck = await db.query(`
            SELECT * FROM enrollments WHERE id = $1
        `, [enrollmentId]);

        if (enrollmentCheck.rows.length === 0) {
            return { success: false, error: 'Inscription non trouvée' };
        }

        const enrollment = enrollmentCheck.rows[0];

        if (incomplete_file) {
            // 2a. Dossier incomplet - garder les documents, mettre en attente
            await db.query(`
                UPDATE enrollments 
                SET status = 'pending',
                    admin_notes = COALESCE(admin_notes, '') || $2,
                    updated_at = NOW()
                WHERE id = $1
            `, [enrollmentId, `\n[${new Date().toLocaleDateString('fr-FR')}] Dossier incomplet: ${reason || 'Documents manquants'}`]);

            console.log(`📋 [ChildLifecycle] Inscription #${enrollmentId} mise en attente (dossier incomplet)`);

            return { success: true, status: 'pending', incomplete: true };
        } else {
            // 2b. Rejet définitif - supprimer les documents Cloudinary
            if (cloudinaryService.isConfigured()) {
                const deleteResult = await cloudinaryService.deleteFolder(`enrollments/enrollment_${enrollmentId}`);
                if (deleteResult.success) {
                    console.log(`☁️ [ChildLifecycle] Documents Cloudinary supprimés pour inscription #${enrollmentId}`);
                }
            }

            // 3. Archiver l'inscription comme rejetée
            await db.query(`
                INSERT INTO enrollments_archive (
                    id, parent_id, child_id, enrollment_date, status, new_status,
                    admin_notes, created_at, updated_at, applicant_first_name,
                    applicant_last_name, applicant_email, approved_by, approved_at
                ) SELECT 
                    id, parent_id, child_id, enrollment_date, 'rejected', 'rejected',
                    COALESCE(admin_notes, '') || $2, created_at, NOW(), applicant_first_name,
                    applicant_last_name, applicant_email, $3, NOW()
                FROM enrollments WHERE id = $1
            `, [enrollmentId, `\n[${new Date().toLocaleDateString('fr-FR')}] Rejeté: ${reason || 'Non spécifié'}`, rejected_by]);

            // 4. Supprimer les documents de la base
            await db.query(`DELETE FROM enrollment_documents WHERE enrollment_id = $1`, [enrollmentId]);

            // 5. Supprimer l'inscription
            await db.query(`DELETE FROM enrollments WHERE id = $1`, [enrollmentId]);

            console.log(`🗑️ [ChildLifecycle] Inscription #${enrollmentId} rejetée et archivée`);

            return { success: true, status: 'rejected', archived: true };
        }

    } catch (error) {
        console.error(`❌ [ChildLifecycle] Erreur rejet inscription:`, error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// FONCTIONS INTERNES
// =====================================================

/**
 * Transfère les documents d'inscription vers l'enfant
 */
async function transferEnrollmentDocuments(enrollmentId, childId) {
    try {
        const docsResult = await db.query(`
            SELECT * FROM enrollment_documents WHERE enrollment_id = $1
        `, [enrollmentId]);

        if (docsResult.rows.length === 0) {
            console.log(`📄 [ChildLifecycle] Aucun document à transférer pour inscription #${enrollmentId}`);
            return;
        }

        console.log(`📄 [ChildLifecycle] Transfert de ${docsResult.rows.length} document(s)`);

        // Migrer les fichiers Cloudinary
        if (cloudinaryService.isConfigured()) {
            console.log(`☁️ [ChildLifecycle] Migration Cloudinary: enrollments/enrollment_${enrollmentId} → children/child_${childId}`);
            const migrationResult = await cloudinaryService.migrateEnrollmentToChild(enrollmentId, childId);

            if (migrationResult.success) {
                console.log(`✅ [ChildLifecycle] Migration Cloudinary réussie: ${migrationResult.migratedCount} fichier(s)`);

                // Mettre à jour les URLs après migration
                for (const migratedFile of migrationResult.migratedFiles || []) {
                    // Mettre à jour dans enrollment_documents d'abord
                    await db.query(`
                        UPDATE enrollment_documents 
                        SET cloudinary_url = $1, cloudinary_public_id = $2
                        WHERE enrollment_id = $3 AND cloudinary_url = $4
                    `, [migratedFile.newUrl, migratedFile.newPublicId, enrollmentId, migratedFile.oldUrl]);
                }
            } else {
                console.error(`❌ [ChildLifecycle] Erreur migration Cloudinary:`, migrationResult.error);
            }
        }

        // Copier les documents vers children_documents
        for (const doc of docsResult.rows) {
            await db.query(`
                INSERT INTO children_documents (
                    child_id, filename, original_filename, file_path,
                    mime_type, file_size, document_type, transferred_from_enrollment,
                    uploaded_by, uploaded_at, cloudinary_url, cloudinary_public_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT DO NOTHING
            `, [
                childId,
                doc.filename,
                doc.original_filename,
                doc.file_path,
                doc.mime_type,
                doc.file_size,
                doc.document_type,
                enrollmentId,
                doc.uploaded_by,
                doc.uploaded_at,
                doc.cloudinary_url,
                doc.cloudinary_public_id
            ]);
        }

        console.log(`✅ [ChildLifecycle] Documents transférés vers enfant #${childId}`);

    } catch (error) {
        console.error(`❌ [ChildLifecycle] Erreur transfert documents:`, error);
    }
}

/**
 * Crée l'événement anniversaire récurrent (Désactivé : un événement anniversaire dans `events`
 * ne doit être créé QUE lorsque le parent soumet explicitement une demande avec decision = 'yes'
 * via POST /api/birthdays/child/:childId/decision).
 */
async function createBirthdayEvent(childId, firstName) {
    console.log(`ℹ️ [ChildLifecycle] Aucun événement anniversaire auto-créé pour ${firstName} (#${childId}) — attente décision explicite du parent.`);
}

/**
 * Crée une notification pour le parent
 */
async function createEnrollmentNotification(parentId, childFirstName) {
    try {
        const title = '🎉 Inscription finalisée !';
        const message = `L'inscription de ${childFirstName} à la crèche Mima Elghalia est maintenant complète. Bienvenue !`;

        await db.query(`
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
            VALUES ($1, $2, $3, 'enrollment_completed', false, NOW())
        `, [parentId, title, message]);

        console.log(`📬 [ChildLifecycle] Notification envoyée au parent #${parentId}`);

        await pushNotificationService.sendPushToUser(parentId, { title, message, url: '/mon-espace' });

    } catch (error) {
        console.error(`❌ [ChildLifecycle] Erreur création notification:`, error);
    }
}

/**
 * Archive l'inscription
 */
async function archiveEnrollment(enrollmentId, childId, parentId, enrollmentData, approvedBy) {
    try {
        await db.query(`
            INSERT INTO enrollments_archive (
                id, parent_id, child_id, enrollment_date, status, new_status,
                saturday_attendance, care_schedule, monthly_discount, regulation_accepted, admin_notes,
                doctor_name, doctor_phone, allergies, habits_notes, weight_kg, height_cm, trusted_contacts,
                created_at, updated_at, applicant_first_name,
                applicant_last_name, applicant_email, approved_by, approved_at
            ) SELECT 
                id, COALESCE($2, parent_id), $3, COALESCE(enrollment_date, NOW()), 'approved', 'approved',
                saturday_attendance, COALESCE(care_schedule, 'full_day'), COALESCE(monthly_discount, 0), regulation_accepted, admin_notes,
                doctor_name, doctor_phone, allergies, habits_notes, weight_kg, height_cm, COALESCE(trusted_contacts, '[]'::jsonb),
                created_at, NOW(), applicant_first_name,
                applicant_last_name, applicant_email, $4, NOW()
            FROM enrollments WHERE id = $1
        `, [enrollmentId, parentId, childId, approvedBy]);

        // Supprimer l'inscription de la table active
        await db.query(`DELETE FROM enrollments WHERE id = $1`, [enrollmentId]);

        console.log(`📦 [ChildLifecycle] Inscription #${enrollmentId} archivée`);

    } catch (error) {
        console.error(`❌ [ChildLifecycle] Erreur archivage inscription:`, error);
    }
}

/**
 * Crée un placeholder document pour les enfants sans documents
 */
async function createDocumentPlaceholder(childId, firstName, lastName) {
    try {
        await db.query(`
            INSERT INTO children_documents (
                child_id, filename, original_filename, file_path, 
                mime_type, file_size, document_type, uploaded_at, notes
            ) VALUES ($1, 'dossier_non_disponible.txt', 'Dossier non disponible', 
                      'non_disponible', 'text/plain', 0, 'dossier_complet', NOW(), 
                      'Dossier non disponible - Documents à fournir')
        `, [childId]);

        console.log(`📄 [ChildLifecycle] Placeholder document créé pour ${firstName} ${lastName}`);

    } catch (error) {
        // Ignorer si le placeholder existe déjà
        if (!error.message.includes('duplicate')) {
            console.error(`❌ [ChildLifecycle] Erreur création placeholder:`, error);
        }
    }
}

module.exports = {
    createChild,
    deleteChild,
    rejectEnrollment
};
