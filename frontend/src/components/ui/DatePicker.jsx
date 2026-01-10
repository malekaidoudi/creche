import { useEffect, useRef } from 'react'
import Datepicker from 'flowbite-datepicker/Datepicker'
import { useLanguage } from '../../hooks/useLanguage'

/**
 * Composant DatePicker basé sur Flowbite
 * Format: jj/mm/aaaa
 * Autohide activé
 */
const DatePicker = ({
    label,
    error,
    required = false,
    title = '',
    value,
    onChange,
    className = '',
    containerClassName = '',
    placeholder,
    ...props
}) => {
    const inputRef = useRef(null)
    const datepickerRef = useRef(null)
    const { isRTL } = useLanguage()

    useEffect(() => {
        if (inputRef.current && !datepickerRef.current) {
            // Détecter si on est sur mobile
            const isMobile = window.innerWidth < 640

            // Initialiser Flowbite Datepicker
            datepickerRef.current = new Datepicker(inputRef.current, {
                autohide: true,
                format: 'dd/mm/yyyy',  // Format français
                title: isMobile ? '' : (title || label || ''),  // Pas de titre sur mobile
                todayBtn: false,
                clearBtn: false,
                language: 'fr',
                orientation: 'auto',  // Auto pour position intelligente
                buttonClass: 'btn'
            })

            // Écouter les changements de date
            const handleChangeDate = (e) => {
                if (onChange) {
                    const date = datepickerRef.current.getDate()
                    if (date) {
                        // Formater en dd/mm/yyyy
                        const day = String(date.getDate()).padStart(2, '0')
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const year = date.getFullYear()
                        onChange(`${day}/${month}/${year}`)
                    } else {
                        onChange('')
                    }
                }
                // Forcer la fermeture après sélection
                if (datepickerRef.current) {
                    datepickerRef.current.hide()
                }
            }

            inputRef.current.addEventListener('changeDate', handleChangeDate)

            // Cleanup
            const currentInput = inputRef.current
            return () => {
                if (currentInput) {
                    currentInput.removeEventListener('changeDate', handleChangeDate)
                }
                if (datepickerRef.current) {
                    datepickerRef.current.destroy()
                    datepickerRef.current = null
                }
            }
        }
    }, [title, label, onChange])

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
                    type="text"
                    readOnly
                    value={value || ''}
                    placeholder={placeholder || (isRTL ? 'اختر التاريخ' : 'Sélectionner une date')}
                    className={`cursor-pointer
            block w-full px-4 py-3 
            border rounded-lg 
            !bg-white dark:!bg-gray-700 
            text-gray-900 dark:text-white 
            placeholder-gray-400
            focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    )
}

export default DatePicker
