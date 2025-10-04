import { useState } from 'react'
import { Eye, EyeOff, Copy, Check } from 'lucide-react'
import { demoAccounts } from '../../data/demoAccounts'

const DemoAccountsInfo = ({ onFillForm }) => {
  const [showPasswords, setShowPasswords] = useState(false)
  const [copiedAccount, setCopiedAccount] = useState(null)

  const copyToClipboard = async (text, accountType) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedAccount(accountType)
      setTimeout(() => setCopiedAccount(null), 2000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  const accounts = [
    {
      type: 'admin',
      data: demoAccounts.admin,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      icon: '👑',
      description: 'Accès complet au système'
    },
    {
      type: 'staff',
      data: demoAccounts.staff,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      icon: '👥',
      description: 'Gestion des enfants et activités'
    },
    {
      type: 'parent',
      data: demoAccounts.parent,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      icon: '👨‍👩‍👧‍👦',
      description: 'Espace parent dédié'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-lg border border-blue-200 p-4 sm:p-6 mb-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
          <span className="text-2xl">🎭</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Comptes de Démonstration
        </h3>
        <p className="text-gray-600 mb-4">
          Testez les différents rôles avec ces comptes prêts à l'emploi
        </p>
        <button
          onClick={() => setShowPasswords(!showPasswords)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200"
        >
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
          {showPasswords ? 'Masquer' : 'Afficher'} les mots de passe
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="flex flex-col gap-6 mb-6 max-w-2xl mx-auto">
        {accounts.map(({ type, data, bgColor, borderColor, textColor, icon, description }) => (
          <div
            key={type}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-100 w-full"
          >
            {/* Card Header */}
            <div className={`${bgColor} px-6 py-4 border-b border-gray-100`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-2xl">{icon}</span>
                </div>
                <div>
                  <h4 className={`font-bold text-lg ${textColor} capitalize`}>
                    {type === 'admin' ? 'Administrateur' : type === 'staff' ? 'Personnel' : 'Parent'}
                  </h4>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded-lg border font-mono">
                    {data.email}
                  </code>
                  <button
                    onClick={() => copyToClipboard(data.email, `${type}-email`)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copier l'email"
                  >
                    {copiedAccount === `${type}-email` ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Mot de passe
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-gray-50 px-3 py-2 rounded-lg border font-mono">
                    {showPasswords ? data.password : '••••••••'}
                  </code>
                  <button
                    onClick={() => copyToClipboard(data.password, `${type}-password`)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copier le mot de passe"
                  >
                    {copiedAccount === `${type}-password` ? (
                      <Check size={16} className="text-green-600" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Login Button */}
              <button
                onClick={() => {
                  if (onFillForm) {
                    // Utiliser la fonction fournie par le parent (React Hook Form)
                    onFillForm(data.email, data.password)
                    
                    // Notification de succès
                    setTimeout(() => {
                      import('react-hot-toast').then(toast => {
                        toast.default.success('Champs remplis automatiquement !')
                      })
                    }, 100)
                  } else {
                    // Fallback : copier dans le presse-papiers
                    copyToClipboard(data.email, `${type}-email`)
                    copyToClipboard(data.password, `${type}-password`)
                    
                    setTimeout(() => {
                      import('react-hot-toast').then(toast => {
                        toast.default.success('Identifiants copiés ! Collez-les dans le formulaire.')
                      })
                    }, 100)
                  }
                }}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  type === 'admin' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : type === 'staff'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                ✨ Utiliser ce compte
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-amber-600 text-sm">ℹ️</span>
          </div>
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Mode Démonstration</p>
            <p className="text-amber-700">
              Cette version fonctionne sans backend réel. Les données sont simulées et ne persistent pas entre les sessions.
              <br />
              <span className="font-medium">💡 Cliquez sur "✨ Utiliser ce compte" pour remplir automatiquement le formulaire de connexion.</span>
              <br />
              <span className="font-medium">Pour une version complète avec base de données, contactez-nous !</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoAccountsInfo
