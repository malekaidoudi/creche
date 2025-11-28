import { Check, X } from 'lucide-react';

/**
 * Toggle Switch avec icônes (style Tailwind)
 * Track fin, thumb cercle avec icône Check/X
 */
const ToggleSwitch = ({
  checked = false,
  onChange,
  size = 'md',
  disabled = false,
  className = '',
  activeColor = 'bg-primary-600',
  ariaLabel = ''
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`
        relative inline-flex h-[1px] w-[72px] shrink-0 cursor-pointer items-center
        rounded-full
        transition-colors duration-300 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        ${checked ? activeColor : 'bg-gray-300 dark:bg-gray-600'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {/* Thumb cercle avec icône */}
      <span
        className={`
          pointer-events-none inline-flex h-4 w-4 items-center justify-center
          rounded-full bg-white shadow-md
          transform transition-all duration-300 ease-in-out
          ${checked ? 'translate-x-[56px] rtl:-translate-x-[56px]' : 'translate-x-0'}
        `}
      >
        {checked ? (
          <Check className="h-2.5 w-2.5 text-green-600" strokeWidth={3} />
        ) : (
          <X className="h-2.5 w-2.5 text-gray-400" strokeWidth={3} />
        )}
      </span>
    </button>
  );
};

export default ToggleSwitch;

