/**
 * TEST DE RESPONSIVITÉ - Toutes les pages
 * 
 * Ce script teste la responsivité de toutes les pages sur différentes tailles d'écran
 * Utilise Playwright pour automatiser les tests
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Tailles d'écran à tester
const viewports = {
    mobile: { width: 375, height: 667, name: '📱 Mobile (iPhone SE)' },
    mobileModern: { width: 390, height: 844, name: '📱 Mobile (iPhone 12/13)' },
    mobileLarge: { width: 414, height: 896, name: '📱 Mobile Large (iPhone 11)' },
    tablet: { width: 768, height: 1024, name: '📱 Tablet (iPad)' },
    desktop: { width: 1366, height: 768, name: '💻 Desktop (Laptop)' },
    desktopLarge: { width: 1920, height: 1080, name: '🖥️  Desktop Large (Full HD)' }
};

// Pages à tester (pages critiques uniquement pour ne pas surcharger)
const pagesToTest = [
    // Pages publiques
    { url: '/', name: 'Page d\'accueil', requiresAuth: false },
    { url: '/articles', name: 'Articles', requiresAuth: false },
    { url: '/inscription', name: 'Page d\'inscription', requiresAuth: false },
    { url: '/contact', name: 'Contact', requiresAuth: false },
    { url: '/visite-virtuelle', name: 'Visite Virtuelle', requiresAuth: false },

    // Pages authentifiées
    { url: '/profile', name: 'Profil utilisateur', requiresAuth: true },
    { url: '/mon-espace', name: 'Mon Espace', requiresAuth: true },

    // Dashboard principal
    { url: '/dashboard', name: 'Dashboard Home', requiresAuth: true },
    { url: '/dashboard/children', name: 'Gestion des enfants', requiresAuth: true },
    { url: '/dashboard/children/add', name: 'Ajouter enfant', requiresAuth: true },
    { url: '/dashboard/enrollments', name: 'Demandes d\'inscription', requiresAuth: true },
    { url: '/dashboard/attendance', name: 'Présences', requiresAuth: true },
    { url: '/dashboard/documents', name: 'Documents', requiresAuth: true },
    { url: '/dashboard/staff', name: 'Gestion du personnel', requiresAuth: true },
    { url: '/dashboard/parents', name: 'Gestion des parents', requiresAuth: true },
    { url: '/dashboard/messages', name: 'Messages', requiresAuth: true },
    { url: '/dashboard/settings', name: 'Paramètres', requiresAuth: true },
];

// Critères de test
const responsiveCriteria = {
    noHorizontalScroll: 'Pas de scroll horizontal',
    readableText: 'Texte lisible (min 14px)',
    clickableButtons: 'Boutons cliquables (min 44x44px)',
    visibleContent: 'Contenu visible sans débordement',
    workingNavigation: 'Navigation fonctionnelle',
    properSpacing: 'Espacement approprié'
};

async function testResponsiveness() {
    const browser = await chromium.launch({ headless: true });
    const results = [];

    console.log('🚀 Démarrage des tests de responsivité...\n');

    for (const [viewportKey, viewport] of Object.entries(viewports)) {
        console.log(`\n${viewport.name} (${viewport.width}x${viewport.height})`);
        console.log('='.repeat(60));

        const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height }
        });
        const page = await context.newPage();

        // Connexion si nécessaire
        let isAuthenticated = false;

        for (const pageTest of pagesToTest) {
            try {
                // Se connecter si la page nécessite l'authentification
                if (pageTest.requiresAuth && !isAuthenticated) {
                    // Simuler une connexion en injectant le token dans localStorage
                    await page.goto('http://localhost:5173/connexion');

                    // Injecter le token et les données utilisateur dans localStorage
                    await page.evaluate(() => {
                        const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwiZW1haWwiOiJtYWxla2FpZG91ZGlAZ21haWwuY29tIn0.mock';
                        const mockUser = {
                            id: 1,
                            email: 'malekaidoudi@gmail.com',
                            role: 'admin',
                            first_name: 'Directeur',
                            last_name: 'Système'
                        };
                        localStorage.setItem('token', mockToken);
                        localStorage.setItem('user', JSON.stringify(mockUser));
                    });

                    await page.waitForTimeout(500);
                    isAuthenticated = true;
                }

                // Naviguer vers la page
                await page.goto(`http://localhost:5173${pageTest.url}`, {
                    waitUntil: 'domcontentloaded',
                    timeout: 15000
                });
                await page.waitForTimeout(1500);

                // Tests de responsivité
                const tests = {
                    noHorizontalScroll: await checkNoHorizontalScroll(page),
                    readableText: await checkReadableText(page),
                    clickableButtons: await checkClickableButtons(page),
                    visibleContent: await checkVisibleContent(page),
                    workingNavigation: await checkWorkingNavigation(page),
                    properSpacing: await checkProperSpacing(page)
                };

                const passed = Object.values(tests).filter(t => t).length;
                const total = Object.keys(tests).length;
                const percentage = Math.round((passed / total) * 100);

                const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';

                console.log(`  ${status} ${pageTest.name}: ${passed}/${total} (${percentage}%)`);

                results.push({
                    viewport: viewport.name,
                    page: pageTest.name,
                    tests,
                    passed,
                    total,
                    percentage
                });

                // Prendre une capture d'écran
                const screenshotDir = path.join(__dirname, 'screenshots', viewportKey);
                if (!fs.existsSync(screenshotDir)) {
                    fs.mkdirSync(screenshotDir, { recursive: true });
                }
                const screenshotPath = path.join(screenshotDir, `${pageTest.name.replace(/[^a-z0-9]/gi, '_')}.png`);
                await page.screenshot({ path: screenshotPath, fullPage: true });

            } catch (error) {
                console.log(`  ❌ ${pageTest.name}: ERREUR - ${error.message}`);
                results.push({
                    viewport: viewport.name,
                    page: pageTest.name,
                    error: error.message,
                    passed: 0,
                    total: 6,
                    percentage: 0
                });
            }
        }

        await context.close();
    }

    await browser.close();

    // Générer le rapport
    generateReport(results);
}

// Fonctions de test individuelles
async function checkNoHorizontalScroll(page) {
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    return scrollWidth <= clientWidth;
}

async function checkReadableText(page) {
    const minFontSize = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, span, div, a, button, label');
        let minSize = 100;
        elements.forEach(el => {
            const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
            if (fontSize > 0 && fontSize < minSize) minSize = fontSize;
        });
        return minSize;
    });
    return minFontSize >= 14;
}

async function checkClickableButtons(page) {
    const smallButtons = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button, a[role="button"]');
        let count = 0;
        buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) count++;
        });
        return count;
    });
    return smallButtons === 0;
}

async function checkVisibleContent(page) {
    const overflow = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let hasOverflow = false;
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > window.innerWidth + 10) hasOverflow = true;
        });
        return hasOverflow;
    });
    return !overflow;
}

async function checkWorkingNavigation(page) {
    const navVisible = await page.evaluate(() => {
        const nav = document.querySelector('nav, [role="navigation"], header');
        return nav !== null && nav.offsetParent !== null;
    });
    return navVisible;
}

async function checkProperSpacing(page) {
    const hasSpacing = await page.evaluate(() => {
        const containers = document.querySelectorAll('main, section, article, div[class*="container"]');
        let properSpacing = true;
        containers.forEach(container => {
            const padding = window.getComputedStyle(container).padding;
            if (padding === '0px') properSpacing = false;
        });
        return properSpacing;
    });
    return hasSpacing;
}

function generateReport(results) {
    console.log('\n\n📊 RAPPORT DE RESPONSIVITÉ');
    console.log('='.repeat(80));

    // Grouper par viewport
    const byViewport = {};
    results.forEach(r => {
        if (!byViewport[r.viewport]) byViewport[r.viewport] = [];
        byViewport[r.viewport].push(r);
    });

    Object.entries(byViewport).forEach(([viewport, pages]) => {
        console.log(`\n${viewport}`);
        console.log('-'.repeat(80));

        const avgPercentage = Math.round(
            pages.reduce((sum, p) => sum + p.percentage, 0) / pages.length
        );

        console.log(`Score moyen: ${avgPercentage}%`);

        pages.forEach(p => {
            const status = p.percentage === 100 ? '✅' : p.percentage >= 80 ? '⚠️' : '❌';
            console.log(`  ${status} ${p.page}: ${p.percentage}%`);

            if (p.tests) {
                Object.entries(p.tests).forEach(([test, passed]) => {
                    const icon = passed ? '  ✓' : '  ✗';
                    console.log(`    ${icon} ${responsiveCriteria[test]}`);
                });
            }
        });
    });

    // Résumé global
    console.log('\n\n🎯 RÉSUMÉ GLOBAL');
    console.log('='.repeat(80));

    const totalTests = results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const globalPercentage = Math.round((totalPassed / totalTests) * 100);

    console.log(`Total tests: ${totalTests}`);
    console.log(`Tests réussis: ${totalPassed}`);
    console.log(`Score global: ${globalPercentage}%`);

    if (globalPercentage === 100) {
        console.log('\n✅ EXCELLENT! Toutes les pages sont parfaitement responsives!');
    } else if (globalPercentage >= 80) {
        console.log('\n⚠️  BON! Quelques améliorations mineures nécessaires.');
    } else {
        console.log('\n❌ ATTENTION! Des corrections importantes sont nécessaires.');
    }

    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, 'responsive-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Rapport détaillé sauvegardé: ${reportPath}`);
    console.log(`📸 Captures d'écran sauvegardées dans: ${path.join(__dirname, 'screenshots')}`);
}

// Exécuter les tests
testResponsiveness().catch(console.error);
