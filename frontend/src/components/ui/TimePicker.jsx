import { useEffect, useRef } from 'react'

/**
 * Composant TimePicker avec le même style que Flowbite Datepicker
 * Utilise l'input HTML5 time avec styles personnalisés
 */
const TimePicker = ({
    label,
    error,
    required = false,
    value,
    onChange,
    className = '',
    containerClassName = '',
    ...props
}) => {
    const inputRef = useRef(null)

    const handleChange = (e) => {
        if (onChange) {
            onChange(e.target.value)
        }
    }

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative w-full">
                <input
                    ref={inputRef}
                    type="time"
                    value={value}
                    onChange={handleChange}
                    className={`
            block w-full px-4 py-3 
            border rounded-lg 
            bg-white dark:bg-gray-700 
            text-gray-900 dark:text-white 
            placeholder-gray-400
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
                    style={{
                        width: '100%',
                        maxWidth: '100%',
                        minWidth: '0',
                        boxSizing: 'border-box'
                    }}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    )
}

export default TimePicker
