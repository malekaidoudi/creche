// Utilitaire de debug pour l'authentification
export const debugAuth = () => {
  console.log('🔍 Debug authentification:')
  console.log('- import.meta.env.PROD:', import.meta.env.PROD)
  console.log('- import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL)
  console.log('- import.meta.env.MODE:', import.meta.env.MODE)
  
  const apiUrl = import.meta.env.VITE_API_URL
  const isDemo = import.meta.env.PROD && (!apiUrl || apiUrl.includes('votre-backend-url'))
  
  console.log('- isDemo calculé:', isDemo)
  console.log('- Condition 1 (PROD):', import.meta.env.PROD)
  console.log('- Condition 2 (!apiUrl):', !apiUrl)
  console.log('- Condition 3 (placeholder):', apiUrl && apiUrl.includes('votre-backend-url'))
  
  return isDemo
}

// Forcer le mode démo pour GitHub Pages
export const forceDemo = () => {
  // Vérifier si on est sur GitHub Pages
  const isGitHubPages = window.location.hostname.includes('github.io')
  const isProduction = import.meta.env.PROD
  
  console.log('🌐 Détection environnement:')
  console.log('- Hostname:', window.location.hostname)
  console.log('- GitHub Pages:', isGitHubPages)
  console.log('- Production:', isProduction)
  
  return isGitHubPages || isProduction
}
