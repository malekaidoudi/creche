import { useEffect, useRef, useCallback } from 'react'
import Datepicker from 'flowbite-datepicker/Datepicker'
import { useLanguage } from '../../hooks/useLanguage'
import { formatDateInput } from '../../utils/dateUtils'

/**
 * Composant DatePicker basé sur Flowbite
 * Format: jj/mm/aaaa
 * Autohide activé
 * Saisie directe avec slash automatique supportee
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

    // Formate la saisie avec slash auto JJ/MM/AAAA
    const handleInput = useCallback((e) => {
        const raw = e.target.value
        const formatted = formatDateInput(raw)
        e.target.value = formatted
        if (onChange) {
            onChange(formatted)
        }
    }, [onChange])

    // Bloque les touches non numeriques sauf backspace/delete/arrows/slash
    const handleKeyDown = useCallback((e) => {
        const allowedKeys = [
            'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Tab', 'Home', 'End', 'Escape', 'Enter'
        ]
        if (allowedKeys.includes(e.key)) return
        if (e.ctrlKey || e.metaKey) return // autorise Ctrl+A, Ctrl+C, etc.
        if (/^\d$/.test(e.key)) return // chiffres OK
        if (e.key === '/') return // slash OK (mais on en ajoutera auto)
        e.preventDefault()
    }, [])

    // Sync le datepicker Flowbite quand la valeur change de l'exterieur
    useEffect(() => {
        if (datepickerRef.current && inputRef.current) {
            const val = value || ''
            inputRef.current.value = val
            // Si date complete valide, mettre a jour le datepicker interne
            if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
                const [day, month, year] = val.split('/').map(Number)
                const date = new Date(year, month - 1, day)
                if (!isNaN(date.getTime())) {
                    datepickerRef.current.setDate(date)
                }
            }
        }
    }, [value])

    useEffect(() => {
        if (inputRef.current && !datepickerRef.current) {
            const isMobile = window.innerWidth < 640

            datepickerRef.current = new Datepicker(inputRef.current, {
                autohide: true,
                format: 'dd/mm/yyyy',
                title: isMobile ? '' : (title || label || ''),
                todayBtn: false,
                clearBtn: false,
                language: 'fr',
                orientation: 'auto',
                buttonClass: 'btn'
            })

            const handleChangeDate = (e) => {
                if (onChange) {
                    const date = datepickerRef.current.getDate()
                    if (date) {
                        const day = String(date.getDate()).padStart(2, '0')
                        const month = String(date.getMonth() + 1).padStart(2, '0')
                        const year = date.getFullYear()
                        const formatted = `${day}/${month}/${year}`
                        if (inputRef.current) inputRef.current.value = formatted
                        onChange(formatted)
                    } else {
                        onChange('')
                    }
                }
                if (datepickerRef.current) {
                    datepickerRef.current.hide()
                }
            }

            inputRef.current.addEventListener('changeDate', handleChangeDate)

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
                    inputMode="numeric"
                    maxLength={10}
                    defaultValue={value || ''}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || (isRTL ? 'JJ/MM/AAAA' : 'JJ/MM/AAAA')}
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
                {/* Icône calendrier pour indiquer le datepicker */}
                <svg
                    className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    )
}

export default DatePicker
