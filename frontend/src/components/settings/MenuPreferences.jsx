import { useState, useEffect } from 'react';
import { LayoutGrid, Menu, Check } from 'lucide-react';

/**
 * Composant de préférences pour le type de menu
 * À intégrer dans la page des paramètres utilisateur
 */
export default function MenuPreferences() {
  const [menuType, setMenuType] = useState(() => {
    return localStorage.getItem('menuType') || 'side';
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (type) => {
    setMenuType(type);
    localStorage.setItem('menuType', type);
    setSaved(true);
    
    // Recharger la page pour appliquer le changement
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Type de Menu
      </h3>
      
      <p className="text-sm text-gray-600 mb-6">
        Choisissez comment vous souhaitez accéder aux actions rapides dans le dashboard.
      </p>

      <div className="space-y-4">
        {/* Option Menu Latéral */}
        <button
          onClick={() => handleChange('side')}
          className={`
            w-full p-4 rounded-lg border-2 transition-all
            ${menuType === 'side' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              p-3 rounded-lg
              ${menuType === 'side' ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
              <Menu className={`w-6 h-6 ${menuType === 'side' ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">Menu Latéral</h4>
                {menuType === 'side' && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Boutons d'action fixés sur le côté droit de l'écran, toujours visibles.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  Accès direct
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  Toujours visible
                </span>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                  Moderne
                </span>
              </div>
            </div>
          </div>
        </button>

        {/* Option Bouton Flottant */}
        <button
          onClick={() => handleChange('floating')}
          className={`
            w-full p-4 rounded-lg border-2 transition-all
            ${menuType === 'floating' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
        >
          <div className="flex items-start gap-4">
            <div className={`
              p-3 rounded-lg
              ${menuType === 'floating' ? 'bg-blue-100' : 'bg-gray-100'}
            `}>
              <LayoutGrid className={`w-6 h-6 ${menuType === 'floating' ? 'text-blue-600' : 'text-gray-600'}`} />
            </div>
            
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">Bouton Flottant</h4>
                {menuType === 'floating' && (
                  <Check className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                Bouton (+) en bas à droite qui ouvre un menu avec toutes les actions.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Compact
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Familier
                </span>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  Économise l'espace
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Message de confirmation */}
      {saved && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-700">
            Préférence enregistrée ! Rechargement en cours...
          </span>
        </div>
      )}

      {/* Aperçu visuel */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Aperçu :</h4>
        <div className="flex items-center justify-center h-32 bg-white rounded border-2 border-dashed border-gray-300 relative">
          {menuType === 'side' ? (
            <>
              <div className="text-center text-gray-500 text-sm">
                Votre dashboard
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                <div className="w-10 h-10 rounded-l-lg bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg"></div>
                <div className="w-10 h-10 rounded-l-lg bg-gradient-to-br from-blue-400 to-cyan-500 shadow-lg"></div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center text-gray-500 text-sm">
                Votre dashboard
              </div>
              <div className="absolute right-4 bottom-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center text-white text-xl font-bold">
                  +
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
