/**
 * Controller pour la gestion des fournitures (supplies)
 * Gère le stock de couches, les fournitures apportées par les parents, etc.
 */

const db = require('../config/db_postgres');
const pushNotificationService = require('../services/pushNotificationService');

/**
 * GET /api/supplies/child/:childId
 * Récupérer le stock de fournitures d'un enfant
 */
const getChildSupplies = async (req, res) => {
    try {
        const { childId } = req.params;

        const result = await db.query(`
            SELECT 
                cs.*,
                c.first_name,
                c.last_name
            FROM child_supplies cs
            JOIN children c ON cs.child_id = c.id
            WHERE cs.child_id = $1
            ORDER BY cs.supply_type
        `, [childId]);

        res.json({
            success: true,
            supplies: result.rows
        });
    } catch (error) {
        console.error('Erreur getChildSupplies:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * POST /api/supplies/child/:childId/refill
 * Ajouter des fournitures au stock d'un enfant (quand le parent apporte)
 */
const refillSupply = async (req, res) => {
    try {
        const { childId } = req.params;
        const { supply_type, quantity = 1, notes, date } = req.body;
        const recordedBy = req.user.id;
        const targetDate = date || new Date().toISOString().split('T')[0];

        // Mettre à jour ou créer le stock
        const result = await db.query(`
            INSERT INTO child_supplies (child_id, supply_type, quantity, last_refill_date, last_refill_quantity, notes)
            VALUES ($1, $2, $3, $5::date, $3, $4)
            ON CONFLICT (child_id, supply_type)
            DO UPDATE SET 
                quantity = child_supplies.quantity + $3,
                last_refill_date = $5::date,
                last_refill_quantity = $3,
                notes = COALESCE($4, child_supplies.notes),
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `, [childId, supply_type, quantity, notes, targetDate]);

        // Enregistrer dans l'historique des fournitures apportées
        await db.query(`
            INSERT INTO daily_supplies_brought (child_id, brought_date, supply_type, quantity, description, recorded_by)
            VALUES ($1, $2::date, $3, $4, $5, $6)
        `, [childId, targetDate, supply_type, quantity, notes, recordedBy]);

        res.json({
            success: true,
            message: 'Stock mis à jour avec succès',
            supply: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur refillSupply:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * POST /api/supplies/child/:childId/use
 * Utiliser une fourniture (décrémenter le stock)
 */
const useSupply = async (req, res) => {
    try {
        const { childId } = req.params;
        const { supply_type, quantity = 1 } = req.body;

        // Décrémenter le stock
        const result = await db.query(`
            UPDATE child_supplies 
            SET quantity = GREATEST(0, quantity - $3),
                updated_at = CURRENT_TIMESTAMP
            WHERE child_id = $1 AND supply_type = $2
            RETURNING *
        `, [childId, supply_type, quantity]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Stock non trouvé' });
        }

        const supply = result.rows[0];
        const lowStock = supply.quantity <= supply.alert_threshold;

        // Si stock bas, créer une notification pour les parents
        if (lowStock) {
            await createLowStockNotification(childId, supply_type, supply.quantity);
        }

        res.json({
            success: true,
            supply,
            low_stock_alert: lowStock
        });
    } catch (error) {
        console.error('Erreur useSupply:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * Créer une notification de stock bas pour les parents
 */
const createLowStockNotification = async (childId, supplyType, remainingQuantity) => {
    try {
        // Récupérer les infos de l'enfant et du parent
        const childResult = await db.query(`
            SELECT c.first_name, c.last_name, e.parent_id
            FROM children c
            JOIN enrollments e ON c.id = e.child_id AND e.status = 'approved'
            WHERE c.id = $1
        `, [childId]);

        if (childResult.rows.length === 0) return;

        const child = childResult.rows[0];
        const supplyNames = {
            diapers: 'couches',
            wipes: 'lingettes',
            cream: 'crème',
            tissues: 'mouchoirs',
            clothes: 'vêtements de rechange',
            serum: 'sérum physiologique',
            other: 'fournitures'
        };

        const supplyName = supplyNames[supplyType] || supplyType;
        const title = `Stock bas - ${supplyName}`;
        const message = `Le stock de ${supplyName} de ${child.first_name} est bas (${remainingQuantity} restantes). Merci d'en apporter.`;

        // Créer la notification
        await db.query(`
            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES ($1, 'supply_alert', $2, $3, $4)
        `, [
            child.parent_id,
            title,
            message,
            JSON.stringify({ child_id: childId, supply_type: supplyType, remaining: remainingQuantity })
        ]);

        pushNotificationService.sendPushToUser(child.parent_id, { title, message, url: '/mon-espace' });
    } catch (error) {
        console.error('Erreur createLowStockNotification:', error);
    }
};

/**
 * GET /api/supplies/child/:childId/history
 * Historique des fournitures apportées par les parents
 */
const getSuppliesHistory = async (req, res) => {
    try {
        const { childId } = req.params;
        const { limit = 30 } = req.query;

        const result = await db.query(`
            SELECT 
                dsb.*,
                u.first_name as recorded_by_first_name,
                u.last_name as recorded_by_last_name
            FROM daily_supplies_brought dsb
            LEFT JOIN users u ON dsb.recorded_by = u.id
            WHERE dsb.child_id = $1
            ORDER BY dsb.brought_date DESC, dsb.created_at DESC
            LIMIT $2
        `, [childId, limit]);

        res.json({
            success: true,
            history: result.rows
        });
    } catch (error) {
        console.error('Erreur getSuppliesHistory:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * POST /api/supplies/daily-brought
 * Enregistrer ce que le parent a apporté aujourd'hui (couches, lingettes, crème, mouchoirs, vêtements, autres consommables)
 */
const recordDailySupplies = async (req, res) => {
    try {
        const { child_id, supplies, date } = req.body;
        const recordedBy = req.user.id;
        const targetDate = date || new Date().toISOString().split('T')[0];

        const results = [];

        for (const supply of supplies) {
            const supplyType = supply.type || 'other';
            const qty = supply.quantity || 1;
            const desc = supply.description || null;

            const result = await db.query(`
                INSERT INTO daily_supplies_brought (child_id, brought_date, supply_type, quantity, description, recorded_by)
                VALUES ($1, $2::date, $3, $4, $5, $6)
                RETURNING *
            `, [child_id, targetDate, supplyType, qty, desc, recordedBy]);

            results.push(result.rows[0]);

            // Mettre à jour le stock pour les couches et produits consommables suivis
            if (['diapers', 'wipes', 'cream', 'other'].includes(supplyType) && qty > 0) {
                await db.query(`
                    INSERT INTO child_supplies (child_id, supply_type, quantity, last_refill_date, last_refill_quantity, notes)
                    VALUES ($1, $2, $3, $4::date, $3, $5)
                    ON CONFLICT (child_id, supply_type)
                    DO UPDATE SET 
                        quantity = child_supplies.quantity + $3,
                        last_refill_date = $4::date,
                        last_refill_quantity = $3,
                        notes = COALESCE($5, child_supplies.notes),
                        updated_at = CURRENT_TIMESTAMP
                `, [child_id, supplyType, qty, targetDate, desc]);
            }
        }

        res.json({
            success: true,
            message: 'Fournitures enregistrées avec succès',
            supplies: results
        });
    } catch (error) {
        console.error('Erreur recordDailySupplies:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

/**
 * GET /api/supplies/today/:childId
 * Récupérer les fournitures apportées à une date donnée (ou aujourd'hui) pour un enfant
 */
const getTodaySupplies = async (req, res) => {
    try {
        const { childId } = req.params;
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];

        const result = await db.query(`
            SELECT * FROM daily_supplies_brought
            WHERE child_id = $1 AND brought_date = $2::date
            ORDER BY created_at DESC
        `, [childId, targetDate]);

        res.json({
            success: true,
            supplies: result.rows
        });
    } catch (error) {
        console.error('Erreur getTodaySupplies:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getChildSupplies,
    refillSupply,
    useSupply,
    getSuppliesHistory,
    recordDailySupplies,
    getTodaySupplies
};
