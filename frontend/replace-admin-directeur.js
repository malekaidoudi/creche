const fs = require('fs');
const path = require('path');

// Fichiers à traiter
const filesToProcess = [
    'src/components/layout/DashboardSidebar.jsx',
    'src/pages/dashboard/DashboardSettingsPage.jsx',
    'src/components/ui/SideMenu.jsx',
    'src/pages/dashboard/DashboardHome.jsx',
    'src/components/layout/DashboardHeader.jsx',
    'src/pages/dashboard/EnrollmentsPage.jsx',
    'src/pages/dashboard/StaffPage.jsx',
    'src/pages/events/EventsCalendar.jsx',
    'src/pages/dashboard/AddUserPage.jsx',
    'src/pages/staff/StaffMemoForm.jsx',
    'src/components/ui/FloatingActionButton.jsx',
    'src/pages/dashboard/DocumentsPage.jsx',
    'src/pages/messages/MessagesPage.jsx',
    'src/components/modals/TaskModal.jsx',
    'src/data/demoAccounts.js',
    'src/pages/dashboard/ChildrenPage.jsx',
    'src/pages/tasks/TasksPage.jsx',
    'src/components/layout/PublicHeader.jsx',
    'src/components/dashboard/SimpleNotificationCenter.jsx',
    'src/pages/dashboard/ParentsPage.jsx',
    'src/pages/dashboard/PendingEnrollmentsPage.jsx',
    'src/components/dashboard/NotificationCenter.jsx',
    'src/pages/public/EnrollmentPage.jsx',
    'src/pages/public/HomePage.jsx',
    'src/pages/staff/AbsenceManagementPage.jsx',
    'src/components/auth/LoginFormHero.jsx',
    'src/components/modals/RequestAppointmentModal.jsx',
    'src/components/modals/RescheduleAppointmentModal.jsx',
    'src/pages/UnifiedProfilePage.jsx',
    'src/pages/dashboard/AttendancePage.jsx',
    'src/pages/events/EventDetails.jsx',
    'src/pages/parent/AbsenceRequestPage.jsx',
    'src/pages/parent/AnnouncementsPage.jsx'
];

// Remplacements à effectuer (texte visible uniquement, pas le code)
const replacements = [
    // Français
    { from: /Admin seulement/g, to: 'Directeur seulement' },
    { from: /Administrateur/g, to: 'Directeur' },
    { from: /administrateur/g, to: 'directeur' },
    { from: /Admin/g, to: 'Directeur' },
    { from: /"admin"/g, to: '"directeur"' },
    { from: /'admin'/g, to: "'directeur'" },

    // Arabe
    { from: /مدير النظام/g, to: 'مدير' },
    { from: /المدير/g, to: 'المدير' }, // Déjà correct
];

// NE PAS remplacer dans le code (user.role === 'admin', etc.)
const codePatterns = [
    /user\.role\s*===\s*['"]admin['"]/,
    /role\s*===\s*['"]admin['"]/,
    /user\?\.role\s*===\s*['"]admin['"]/,
    /isAdmin/,
    /checkAdmin/,
];

let totalReplacements = 0;
let filesModified = 0;

filesToProcess.forEach(file => {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
        console.log(`⚠️  Fichier non trouvé: ${file}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let fileReplacements = 0;

    // Appliquer les remplacements
    replacements.forEach(({ from, to }) => {
        const matches = content.match(from);
        if (matches) {
            content = content.replace(from, to);
            fileReplacements += matches.length;
        }
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesModified++;
        totalReplacements += fileReplacements;
        console.log(`✅ ${file} - ${fileReplacements} remplacement(s)`);
    }
});

console.log(`\n📊 Résumé:`);
console.log(`   Fichiers modifiés: ${filesModified}`);
console.log(`   Total remplacements: ${totalReplacements}`);
console.log(`\n✅ Terminé!`);
