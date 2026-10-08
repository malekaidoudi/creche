/**
 * <Can> - affichage déclaratif conditionné à une fonctionnalité de FEATURES.
 *
 * Convention d'équipe :
 * - Besoin de la valeur dans une logique (if/variable) → useAccess().can()
 * - Simplement afficher/cacher un bloc JSX                → <Can feature="...">
 *
 * Usage:
 *   <Can feature="ATTENDANCE_TODAY">
 *     <button onClick={...}>Présences</button>
 *   </Can>
 *
 *   <Can feature="ATTENDANCE_TODAY" fallback={<p>Accès non autorisé</p>}>
 *     ...
 *   </Can>
 */
import { useAccess } from './useAccess';

const Can = ({ feature, fallback = null, children }) => {
  const { can } = useAccess();
  return can(feature) ? children : fallback;
};

export default Can;
