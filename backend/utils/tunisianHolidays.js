/**
 * Générateur de jours fériés tunisiens
 * Génère automatiquement les jours fériés nationaux et religieux pour une année donnée
 * Utilise les politiques définies par l'admin pour déterminer le nombre de jours
 */

// Mapping des clés de politiques vers les données de base
const NATIONAL_HOLIDAYS_MAP = {
    new_year: { name: "Jour de l'An", name_ar: "رأس السنة الميلادية", day: 1, month: 1 },
    revolution_day: { name: "Fête de la Révolution", name_ar: "عيد الثورة", day: 14, month: 1 },
    independence_day: { name: "Fête de l'Indépendance", name_ar: "عيد الاستقلال", day: 20, month: 3 },
    martyrs_day: { name: "Fête des Martyrs", name_ar: "عيد الشهداء", day: 9, month: 4 },
    labor_day: { name: "Fête du Travail", name_ar: "عيد العمال", day: 1, month: 5 },
    republic_day: { name: "Fête de la République", name_ar: "عيد الجمهورية", day: 25, month: 7 },
    womens_day: { name: "Fête de la Femme", name_ar: "عيد المرأة", day: 13, month: 8 },
    evacuation_day: { name: "Fête de l'Évacuation", name_ar: "عيد الجلاء", day: 15, month: 10 },
};

// Jours fériés nationaux tunisiens (dates fixes) - version par défaut
const getNationalHolidays = (year) => [
    { name: "Jour de l'An", name_ar: "رأس السنة الميلادية", date: `${year}-01-01`, type: 'national', holiday_key: 'new_year' },
    { name: "Fête de la Révolution", name_ar: "عيد الثورة", date: `${year}-01-14`, type: 'national', holiday_key: 'revolution_day' },
    { name: "Fête de l'Indépendance", name_ar: "عيد الاستقلال", date: `${year}-03-20`, type: 'national', holiday_key: 'independence_day' },
    { name: "Fête des Martyrs", name_ar: "عيد الشهداء", date: `${year}-04-09`, type: 'national', holiday_key: 'martyrs_day' },
    { name: "Fête du Travail", name_ar: "عيد العمال", date: `${year}-05-01`, type: 'national', holiday_key: 'labor_day' },
    { name: "Fête de la République", name_ar: "عيد الجمهورية", date: `${year}-07-25`, type: 'national', holiday_key: 'republic_day' },
    { name: "Fête de la Femme", name_ar: "عيد المرأة", date: `${year}-08-13`, type: 'national', holiday_key: 'womens_day' },
    { name: "Fête de l'Évacuation", name_ar: "عيد الجلاء", date: `${year}-10-15`, type: 'national', holiday_key: 'evacuation_day' },
];

// Dates approximatives des fêtes islamiques (à ajuster chaque année)
// Ces dates sont basées sur le calendrier hégirien et varient chaque année
const getIslamicHolidays = (year) => {
    // Dates approximatives pour 2025-2027 (à mettre à jour régulièrement)
    const islamicDates = {
        2025: {
            newYear: '2025-06-26',      // 1er Muharram 1447
            achoura: '2025-07-05',      // 10 Muharram 1447
            mawlid: '2025-09-04',       // 12 Rabi' al-Awwal 1447
            isra: '2025-01-27',         // 27 Rajab 1446
            eidFitr: ['2025-03-30', '2025-03-31', '2025-04-01'], // 1-3 Shawwal 1446
            arafat: '2025-06-05',       // 9 Dhu al-Hijja 1446
            eidAdha: ['2025-06-06', '2025-06-07', '2025-06-08', '2025-06-09'], // 10-13 Dhu al-Hijja 1446
        },
        2026: {
            newYear: '2026-06-16',      // 1er Muharram 1448
            achoura: '2026-06-25',      // 10 Muharram 1448
            mawlid: '2026-08-25',       // 12 Rabi' al-Awwal 1448
            isra: '2026-01-16',         // 27 Rajab 1447
            eidFitr: ['2026-03-20', '2026-03-21', '2026-03-22'], // 1-3 Shawwal 1447
            arafat: '2026-05-26',       // 9 Dhu al-Hijja 1447
            eidAdha: ['2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'], // 10-13 Dhu al-Hijja 1447
        },
        2027: {
            newYear: '2027-06-06',      // 1er Muharram 1449
            achoura: '2027-06-15',      // 10 Muharram 1449
            mawlid: '2027-08-14',       // 12 Rabi' al-Awwal 1449
            isra: '2027-01-05',         // 27 Rajab 1448
            eidFitr: ['2027-03-09', '2027-03-10', '2027-03-11'], // 1-3 Shawwal 1448
            arafat: '2027-05-15',       // 9 Dhu al-Hijja 1448
            eidAdha: ['2027-05-16', '2027-05-17', '2027-05-18', '2027-05-19'], // 10-13 Dhu al-Hijja 1448
        },
    };

    const dates = islamicDates[year];
    if (!dates) {
        console.warn(`⚠️ Dates islamiques non définies pour l'année ${year}`);
        return [];
    }

    const holidays = [
        { name: "Nouvel An Hégirien", name_ar: "رأس السنة الهجرية", date: dates.newYear, type: 'religious', holiday_key: 'hijri_new_year' },
        { name: "Achoura", name_ar: "عاشوراء", date: dates.achoura, type: 'religious', holiday_key: 'achoura' },
        { name: "Mawlid (Naissance du Prophète)", name_ar: "المولد النبوي الشريف", date: dates.mawlid, type: 'religious', holiday_key: 'mawlid' },
        { name: "Isra et Miraj", name_ar: "ليلة الإسراء والمعراج", date: dates.isra, type: 'religious', holiday_key: 'isra_miraj' },
        { name: "Jour d'Arafat", name_ar: "وقفة عرفة", date: dates.arafat, type: 'religious', holiday_key: 'arafat' },
    ];

    // Ajouter les jours de l'Aïd el-Fitr (max 4 jours possibles)
    dates.eidFitr.forEach((date, index) => {
        holidays.push({
            name: `Aïd el-Fitr (${index + 1}${index === 0 ? 'er' : 'e'} jour)`,
            name_ar: `عيد الفطر (اليوم ${index + 1})`,
            date,
            type: 'religious',
            holiday_key: 'eid_fitr',
            day_index: index + 1
        });
    });

    // Ajouter les jours de l'Aïd el-Adha (max 4 jours possibles)
    dates.eidAdha.forEach((date, index) => {
        holidays.push({
            name: `Aïd el-Adha (${index + 1}${index === 0 ? 'er' : 'e'} jour)`,
            name_ar: `عيد الأضحى (اليوم ${index + 1})`,
            date,
            type: 'religious',
            holiday_key: 'eid_adha',
            day_index: index + 1
        });
    });

    return holidays;
};

/**
 * Génère les jours fériés en appliquant les politiques définies par l'admin
 * @param {number} year - L'année pour laquelle générer les jours fériés
 * @param {Array} policies - Les politiques de jours fériés depuis la DB
 * @returns {Array} Liste des jours fériés filtrés selon les politiques
 */
const generateHolidaysWithPolicies = (year, policies = []) => {
    const national = getNationalHolidays(year);
    const islamic = getIslamicHolidays(year);

    // Créer un map des politiques par clé
    const policyMap = {};
    policies.forEach(p => {
        policyMap[p.holiday_key] = p;
    });

    const result = [];

    // Filtrer les jours nationaux selon les politiques
    national.forEach(holiday => {
        const policy = policyMap[holiday.holiday_key];
        // Si pas de politique ou politique active, inclure le jour
        if (!policy || policy.is_active) {
            result.push(holiday);
        }
    });

    // Filtrer les jours religieux selon les politiques (avec days_count)
    islamic.forEach(holiday => {
        const policy = policyMap[holiday.holiday_key];

        // Si pas de politique, inclure par défaut
        if (!policy) {
            result.push(holiday);
            return;
        }

        // Si politique inactive, ne pas inclure
        if (!policy.is_active) {
            return;
        }

        // Pour les fêtes multi-jours (Aïd), vérifier le day_index
        if (holiday.day_index) {
            // Inclure seulement si day_index <= days_count de la politique
            if (holiday.day_index <= (policy.days_count || 1)) {
                result.push(holiday);
            }
        } else {
            // Fête à jour unique, inclure
            result.push(holiday);
        }
    });

    return result;
};

// Vacances scolaires tunisiennes (dates approximatives)
const getSchoolVacations = (year) => {
    // Année scolaire: septembre année N à juin année N+1
    // Les vacances sont généralement:
    return [
        { name: "Vacances d'Automne (début)", name_ar: "عطلة الخريف (بداية)", date: `${year}-10-28`, type: 'school' },
        { name: "Vacances d'Automne (fin)", name_ar: "عطلة الخريف (نهاية)", date: `${year}-11-05`, type: 'school' },
        { name: "Vacances d'Hiver (début)", name_ar: "عطلة الشتاء (بداية)", date: `${year}-12-23`, type: 'school' },
        { name: "Vacances d'Hiver (fin)", name_ar: "عطلة الشتاء (نهاية)", date: `${year + 1}-01-08`, type: 'school' },
        { name: "Vacances de Printemps (début)", name_ar: "عطلة الربيع (بداية)", date: `${year + 1}-03-25`, type: 'school' },
        { name: "Vacances de Printemps (fin)", name_ar: "عطلة الربيع (نهاية)", date: `${year + 1}-04-08`, type: 'school' },
        { name: "Vacances d'Été (début)", name_ar: "عطلة الصيف (بداية)", date: `${year + 1}-06-15`, type: 'school' },
        { name: "Vacances d'Été (fin)", name_ar: "عطلة الصيف (نهاية)", date: `${year + 1}-09-15`, type: 'school' },
    ];
};

/**
 * Génère tous les jours fériés pour une année donnée
 * @param {number} year - L'année pour laquelle générer les jours fériés
 * @returns {Array} Liste des jours fériés
 */
const generateHolidaysForYear = (year) => {
    const national = getNationalHolidays(year);
    const islamic = getIslamicHolidays(year);
    const school = getSchoolVacations(year);

    return [...national, ...islamic, ...school];
};

/**
 * Génère les jours fériés pour l'année en cours et l'année suivante
 * @returns {Array} Liste des jours fériés pour 2 ans
 */
const generateUpcomingHolidays = () => {
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;

    const currentYearHolidays = generateHolidaysForYear(currentYear);
    const nextYearHolidays = generateHolidaysForYear(nextYear);

    // Combiner et trier par date
    const allHolidays = [...currentYearHolidays, ...nextYearHolidays];

    // Filtrer les dates passées (garder seulement les 30 derniers jours et le futur)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return allHolidays
        .filter(h => new Date(h.date) >= thirtyDaysAgo)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
};

module.exports = {
    getNationalHolidays,
    getIslamicHolidays,
    getSchoolVacations,
    generateHolidaysForYear,
    generateHolidaysWithPolicies,
    generateUpcomingHolidays,
};
