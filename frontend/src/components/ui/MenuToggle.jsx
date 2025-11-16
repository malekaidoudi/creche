import { useState, useEffect } from 'react';
import { LayoutGrid, Menu } from 'lucide-react';

/**
 * Composant pour basculer entre le menu latéral et le bouton flottant
 */
export default function MenuToggle({ onToggle }) {
  const [menuType, setMenuType] = useState(() => {
    // Récupérer la préférence depuis localStorage
    return localStorage.getItem('menuType') || 'side';
  });

  useEffect(() => {
    // Sauvegarder la préférence
    localStorage.setItem('menuType', menuType);
    onToggle(menuType);
  }, [menuType, onToggle]);

  const toggleMenu = () => {
    setMenuType(prev => prev === 'side' ? 'floating' : 'side');
  };

  return (
    <button
      onClick={toggleMenu}
      className="fixed bottom-4 left-4 z-50 p-3 rounded-full bg-white shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200 group"
      title={menuType === 'side' ? 'Passer au bouton flottant' : 'Passer au menu latéral'}
    >
      {menuType === 'side' ? (
        <LayoutGrid className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
      ) : (
        <Menu className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
      )}
      
      {/* Tooltip */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {menuType === 'side' ? 'Bouton flottant' : 'Menu latéral'}
      </div>
    </button>
  );
}
