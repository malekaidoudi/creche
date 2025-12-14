/**
 * Mobile Components - Index principal
 * 
 * Composants optimisés pour l'expérience mobile de l'application.
 * 
 * @example
 * import { MobileNavigation, MobileCard, MobileList } from '@/components/mobile';
 */

// Navigation & Layout
export { default as MobileNavigation } from './MobileNavigation';
export { default as MobileHeader } from './MobileHeader';

// Composants de base
export { default as MobileCard } from './MobileCard';
export { default as MobileList } from './MobileList';
export { default as MobileForm } from './MobileForm';
export { default as MobileStatCard } from './MobileStatCard';

// Pages mobiles
export { default as MobileDashboard } from './MobileDashboard';
export { default as MobileParentSpace } from './MobileParentSpace';
export { default as MobileAttendance } from './MobileAttendance';
export { default as MobileChildrenList } from './MobileChildrenList';
export { default as MobilePlanning } from './MobilePlanning';
export { default as MobileMessages } from './MobileMessages';

// Adaptateurs
export { TableToListAdapter, FormToStepsAdapter } from './adapters';
