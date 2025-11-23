import { useEffect, useRef } from 'react'
import DateRangePicker from 'flowbite-datepicker/DateRangePicker'

/**
 * Composant DateRangePicker basé sur Flowbite
 * Pour sélectionner une plage de dates (vacances, etc.)
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

            // Écouter les changements sur les deux inputs
            const startInput = containerRef.current.querySelector('[name="start"]')
            const endInput = containerRef.current.querySelector('[name="end"]')

            if (startInput) {
                startInput.addEventListener('changeDate', (e) => {
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

            if (endInput) {
                endInput.addEventListener('changeDate', (e) => {
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
                        datepicker-format="dd/mm/yyyy"
                        value={startValue}
                        placeholder="Date de début"
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
                        datepicker-format="dd/mm/yyyy"
                        value={endValue}
                        placeholder="Date de fin"
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
