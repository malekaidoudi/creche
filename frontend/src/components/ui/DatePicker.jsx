import { useEffect, useRef, useCallback } from 'react'
import Datepicker from 'flowbite-datepicker/Datepicker'
import { useLanguage } from '../../hooks/useLanguage'
import { formatDateInput } from '../../utils/dateUtils'

/**
 * Composant DatePicker
 * Format: jj/mm/aaaa
 * Saisie directe avec slash automatique
 * Calendrier Flowbite via bouton separe
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
    const inputRef = useRef(null)         // input visible (saisie manuelle)
    const pickerRef = useRef(null)        // input caché (flowbite datepicker)
    const datepickerRef = useRef(null)
    const { isRTL } = useLanguage()

    // Formate la saisie avec slash auto JJ/MM/AAAA
    const handleInput = useCallback((e) => {
        const raw = e.target.value
        const formatted = formatDateInput(raw)
        e.target.value = formatted
        if (onChange) {
            onChange(formatted)
        }
    }, [onChange])

    // Bloque les touches non numeriques
    const handleKeyDown = useCallback((e) => {
        const allowedKeys = [
            'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Tab', 'Home', 'End', 'Escape', 'Enter'
        ]
        if (allowedKeys.includes(e.key)) return
        if (e.ctrlKey || e.metaKey) return
        if (/^\d$/.test(e.key)) return
        if (e.key === '/') return
        e.preventDefault()
    }, [])

    // Ouvre le calendrier Flowbite
    const openCalendar = useCallback(() => {
        if (!datepickerRef.current || !pickerRef.current) return

        // Sync la valeur actuelle dans le picker caché
        const currentValue = inputRef.current?.value || value || ''
        pickerRef.current.value = currentValue

        // Si date valide, setter la date dans le datepicker
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(currentValue)) {
            const [day, month, year] = currentValue.split('/').map(Number)
            const date = new Date(year, month - 1, day)
            if (!isNaN(date.getTime())) {
                datepickerRef.current.setDate(date)
            }
        }

        datepickerRef.current.show()
    }, [value])

    // Sync valeur externe dans l'input visible
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.value = value || ''
        }
    }, [value])

    // Initialise le datepicker Flowbite sur l'input CACHÉ
    useEffect(() => {
        if (pickerRef.current && !datepickerRef.current) {
            const isMobile = window.innerWidth < 640

            datepickerRef.current = new Datepicker(pickerRef.current, {
                autohide: true,
                format: 'dd/mm/yyyy',
                title: isMobile ? '' : (title || label || ''),
                todayBtn: false,
                clearBtn: false,
                language: 'fr',
                orientation: 'auto',
                buttonClass: 'btn'
            })

            const handleChangeDate = () => {
                if (onChange && datepickerRef.current) {
                    const date = datepickerRef.current.getDate()
                    if (date) {
                        const day = String(date.getDate()).padStart(2, '0')
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const year = date.getFullYear()
                        const formatted = `${day}/${month}/${year}`
                        if (inputRef.current) inputRef.current.value = formatted
                        onChange(formatted)
                    }
                }
                if (datepickerRef.current) {
                    datepickerRef.current.hide()
                }
            }

            pickerRef.current.addEventListener('changeDate', handleChangeDate)

            const currentPicker = pickerRef.current
            return () => {
                if (currentPicker) {
                    currentPicker.removeEventListener('changeDate', handleChangeDate)
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
                {/* Input visible : saisie manuelle seule */}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    defaultValue={value || ''}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'JJ/MM/AAAA'}
                    className={`block w-full px-4 py-3 pr-10 rtl:pr-4 rtl:pl-10
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
                {/* Input caché : flowbite datepicker s'y attache */}
                <input
                    ref={pickerRef}
                    type="text"
                    className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none -z-10"
                    tabIndex="-1"
                    aria-hidden="true"
                />
                {/* Bouton calendrier */}
                <button
                    type="button"
                    onClick={openCalendar}
                    className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    title={isRTL ? 'فتح التقويم' : 'Ouvrir le calendrier'}
                >
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    )
}

export default DatePicker
