import { useEffect, useRef, useCallback } from 'react'
import DateRangePicker from 'flowbite-datepicker/DateRangePicker'
import { formatDateInput } from '../../utils/dateUtils'

/**
 * Composant DateRangePicker basé sur Flowbite
 * Pour sélectionner une plage de dates (vacances, etc.)
 * Supporte la saisie directe avec slash automatique JJ/MM/AAAA
 */
const DateRangePickerComponent = ({
    label,
    error,
    required = false,
    title = '',
    startValue,
    endValue,
    onStartChange,
    onEndChange,
    className = '',
    containerClassName = '',
    ...props
}) => {
    const containerRef = useRef(null)
    const dateRangePickerRef = useRef(null)
    const startInputRef = useRef(null)
    const endInputRef = useRef(null)

    // Formate la saisie avec slash auto
    const handleDateInput = useCallback((e, onChange) => {
        const raw = e.target.value
        const formatted = formatDateInput(raw)
        e.target.value = formatted
        if (onChange) {
            onChange(formatted)
        }
    }, [])

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

    useEffect(() => {
        if (containerRef.current && !dateRangePickerRef.current) {
            // Initialiser Flowbite DateRangePicker
            dateRangePickerRef.current = new DateRangePicker(containerRef.current, {
                autohide: true,
                format: 'dd/mm/yyyy',  // Format français
                title: title || label || '',
                todayBtn: false,
                clearBtn: false,
                language: 'fr',
                orientation: 'auto'  // Position intelligente
            })

            // Récupérer les inputs
            startInputRef.current = containerRef.current.querySelector('[name="start"]')
            endInputRef.current = containerRef.current.querySelector('[name="end"]')

            if (startInputRef.current) {
                startInputRef.current.addEventListener('changeDate', (e) => {
                    if (onStartChange) {
                        const date = e.detail?.date || e.target.datepicker?.getDate()
                        if (date) {
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            onStartChange(`${day}/${month}/${year}`)
                        } else {
                            onStartChange(e.target.value)
                        }
                    }
                })
            }

            if (endInputRef.current) {
                endInputRef.current.addEventListener('changeDate', (e) => {
                    if (onEndChange) {
                        const date = e.detail?.date || e.target.datepicker?.getDate()
                        if (date) {
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            onEndChange(`${day}/${month}/${year}`)
                        } else {
                            onEndChange(e.target.value)
                        }
                    }
                })
            }
        }

        return () => {
            if (dateRangePickerRef.current) {
                dateRangePickerRef.current.destroy()
                dateRangePickerRef.current = null
            }
        }
    }, [title, label, onStartChange, onEndChange])

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div ref={containerRef} date-rangepicker="true" datepicker-format="dd/mm/yyyy" className="flex items-center gap-2">
                <div className="relative flex-1">
                    <input
                        name="start"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        datepicker-format="dd/mm/yyyy"
                        value={startValue}
                        onInput={(e) => handleDateInput(e, onStartChange)}
                        onKeyDown={handleKeyDown}
                        placeholder="JJ/MM/AAAA"
                        className={`
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
                <span className="text-gray-500 dark:text-gray-400">→</span>
                <div className="relative flex-1">
                    <input
                        name="end"
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        datepicker-format="dd/mm/yyyy"
                        value={endValue}
                        onInput={(e) => handleDateInput(e, onEndChange)}
                        onKeyDown={handleKeyDown}
                        placeholder="JJ/MM/AAAA"
                        className={`
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
                    />
                </div>
            </div>
            {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
        </div>
    )
}

export default DateRangePickerComponent
