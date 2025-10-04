import { authenticateDemo, demoAccounts } from '../data/demoAccounts'

// Test simple des comptes de démo
export const testDemoAccounts = () => {
  console.log('🧪 Test des comptes de démonstration:')
  
  const testCases = [
    { email: 'admin@mimaelghalia.tn', password: 'admin123' },
    { email: 'staff@mimaelghalia.tn', password: 'staff123' },
    { email: 'parent@mimaelghalia.tn', password: 'parent123' },
    { email: 'wrong@email.com', password: 'wrongpass' }
  ]
  
  testCases.forEach((testCase, index) => {
    console.log(`\n--- Test ${index + 1} ---`)
    const result = authenticateDemo(testCase.email, testCase.password)
    console.log('Résultat:', result.success ? '✅ SUCCÈS' : '❌ ÉCHEC')
    if (!result.success) {
      console.log('Erreur:', result.error)
    }
  })
  
  console.log('\n📋 Comptes disponibles:')
  Object.values(demoAccounts).forEach(account => {
    console.log(`- ${account.role}: ${account.email} / ${account.password}`)
  })
}

// Appeler automatiquement le test
if (typeof window !== 'undefined') {
  window.testDemoAccounts = testDemoAccounts
}
