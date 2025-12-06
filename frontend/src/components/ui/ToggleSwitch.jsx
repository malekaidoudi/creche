import { Check, X } from 'lucide-react';

/**
 * Toggle Switch style Flowbite/Tailwind avec icônes Check/X
 * Design compact, accessible avec support RTL
 */
const ToggleSwitch = ({
  checked = false,
  onChange,
  size = 'sm',
  disabled = false,
  className = '',
  ariaLabel = '',
  activeColor = 'peer-checked:bg-primary-600'
}) => {
  // Classes par taille avec RTL support
  const sizeConfig = {
    sm: {
      track: 'w-10 h-5',
      thumb: 'h-4 w-4',
      icon: 'h-2.5 w-2.5',
      translateOn: 'translate-x-5 rtl:-translate-x-5'
    },
    md: {
      track: 'w-12 h-6',
      thumb: 'h-5 w-5',
      icon: 'h-3 w-3',
      translateOn: 'translate-x-6 rtl:-translate-x-6'
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'h-6 w-6',
      icon: 'h-3.5 w-3.5',
      translateOn: 'translate-x-7 rtl:-translate-x-7'
    }
  };

  const s = sizeConfig[size] || sizeConfig.sm;

  return (
    <label className={`inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
        aria-label={ariaLabel}
      />
      <div
        className={`
          relative ${s.track} rounded-full
          bg-gray-200 dark:bg-gray-700
          peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-700
          ${activeColor}
          transition-colors duration-200
        `}
      >
        {/* Thumb avec icône */}
        <span
          className={`
            absolute top-0.5 start-0.5
            ${s.thumb} rounded-full bg-white shadow-md
            flex items-center justify-center
            transition-transform duration-200 ease-in-out
            ${checked ? s.translateOn : 'translate-x-0'}
          `}
        >
          {checked ? (
            <Check className={`${s.icon} text-green-600`} strokeWidth={3} />
          ) : (
            <X className={`${s.icon} text-gray-400`} strokeWidth={2.5} />
          )}
        </span>
      </div>
    </label>
  );
};

export default ToggleSwitch;
