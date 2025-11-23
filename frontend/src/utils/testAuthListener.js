/**
 * Listener pour les tests de responsivité
 * Permet de contrôler l'authentification depuis l'iframe de test
 */

export const initTestAuthListener = () => {
    // Seulement en développement
    if (import.meta.env.MODE !== 'development') return;

    console.log('🧪 Test Auth Listener: Initialisation...');

    window.addEventListener('message', (event) => {
        console.log('📨 Message reçu:', event.origin, event.data);

        // Accepter tous les messages en développement (fichiers locaux = origin null)
        // En production, ce code ne s'exécute pas

        const { type, token, user } = event.data || {};

        // Vérifier que c'est bien un message d'auth
        if (!type || (type !== 'SET_AUTH' && type !== 'CLEAR_AUTH')) {
            return;
        }

        console.log('✅ Message d\'authentification valide:', type);

        switch (type) {
            case 'SET_AUTH':
                // Injecter le token et l'utilisateur dans localStorage
                if (token && user) {
                    localStorage.setItem('token', token);
                    localStorage.setItem('user', JSON.stringify(user));
                    console.log('🔒 Test Auth: Utilisateur connecté', user);
                    // Recharger pour appliquer les changements
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                }
                break;

            case 'CLEAR_AUTH':
                // Supprimer le token et l'utilisateur
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                console.log('🔓 Test Auth: Utilisateur déconnecté');
                // Recharger pour appliquer les changements
                setTimeout(() => {
                    window.location.reload();
                }, 100);
                break;

            default:
                break;
        }
    });

    console.log('✅ Test Auth Listener initialisé');
};
