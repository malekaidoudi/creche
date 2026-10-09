import { useEffect, useRef, useCallback } from 'react'
import Datepicker from 'flowbite-datepicker/Datepicker'
import { useLanguage } from '../../hooks/useLanguage'
import { formatDateInput, convertFromISO } from '../../utils/dateUtils'

/**
 * Composant DatePicker
 * Format: JJ/MM/AAAA
 * - Saisie manuelle souple et fluide sans blocage ni corruption d'année
 * - Préservation intelligente de la position du curseur
 * - Calendrier Flowbite synchronisé sans fermeture prématurée
 */
const DatePicker = ({
    label,
    error,
    required = false,
    title = '',
    value,
    onChange,
    readOnlyInput = false,
    className = '',
    containerClassName = '',
    placeholder,
    ...props
}) => {
    const inputRef = useRef(null)         // input visible (saisie manuelle)
    const pickerRef = useRef(null)        // input caché (flowbite datepicker)
    const datepickerRef = useRef(null)
    const isProgrammaticRef = useRef(false) // Flag pour ignorer les événements déclenchés par setDate()
    const { isRTL } = useLanguage()

    // Normaliser la valeur d'affichage (supporte JJ/MM/AAAA ou YYYY-MM-DD ISO)
    const normalizeDisplayValue = useCallback((val) => {
        if (!val || typeof val !== 'string') return ''
        const trimmed = val.trim()
        if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
            return convertFromISO(trimmed)
        }
        return trimmed
    }, [])

    // Formate la saisie en conservant la position du curseur
    const handleInput = useCallback((e) => {
        const input = e.target
        const raw = input.value
        const cursor = input.selectionStart || 0

        // Compter combien de chiffres se trouvaient avant le curseur dans la saisie brute
        const digitsBefore = raw.slice(0, cursor).replace(/\D/g, '').length

        // Formater avec slashes (max 8 chiffres JJMMAAAA)
        const formatted = formatDateInput(raw)
        input.value = formatted

        // Calculer la nouvelle position du curseur basée sur les chiffres précédents
        let newCursor = 0
        let count = 0
        for (let i = 0; i < formatted.length; i++) {
            if (formatted[i] !== '/') {
                count++
            }
            if (count === digitsBefore) {
                newCursor = i + 1
                break
            }
        }
        if (digitsBefore === 0) newCursor = 0
        if (newCursor > formatted.length) newCursor = formatted.length

        // Restaurer la position du curseur
        try {
            input.setSelectionRange(newCursor, newCursor)
        } catch (_) {
            // Ignorer si non supporté
        }

        if (onChange) {
            onChange(formatted)
        }
    }, [onChange])

    // Gestion des touches : évite le blocage lors du Backspace sur un slash
    const handleKeyDown = useCallback((e) => {
        const input = e.target
        const cursor = input.selectionStart

        // Si l'utilisateur appuie sur Backspace juste après un slash (ex: "11/" ou "11/02/")
        // On supprime le chiffre précédent plutôt que de laisser le slash se ré-insérer
        if (e.key === 'Backspace' && input.selectionStart === input.selectionEnd) {
            if (cursor === 3 || cursor === 6) {
                e.preventDefault()
                const currentVal = input.value
                const before = currentVal.slice(0, cursor - 2)
                const after = currentVal.slice(cursor)
                const nextVal = formatDateInput(before + after)
                input.value = nextVal

                const targetPos = Math.max(0, cursor - 2)
                try {
                    input.setSelectionRange(targetPos, targetPos)
                } catch (_) {}

                if (onChange) {
                    onChange(nextVal)
                }
                return
            }
        }

        // Touches de contrôle autorisées
        const allowedKeys = [
            'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
            'Tab', 'Home', 'End', 'Escape', 'Enter'
        ]
        if (allowedKeys.includes(e.key)) return
        if (e.ctrlKey || e.metaKey) return
        if (/^\d$/.test(e.key)) return
        if (e.key === '/') return

        e.preventDefault()
    }, [onChange])

    // À la perte de focus, auto-complétion intelligente si année à 2 chiffres
    const handleBlur = useCallback((e) => {
        const input = e.target
        const currentVal = input.value.trim()
        if (!currentVal) return

        const parts = currentVal.split('/')
        if (parts.length === 3) {
            let [d, m, y] = parts
            if (y && y.length === 2) {
                y = `20${y}`
                const fixed = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`
                input.value = fixed
                if (onChange) onChange(fixed)
            }
        }
    }, [onChange])

    // Ouvre le calendrier Flowbite
    const openCalendar = useCallback((e) => {
        if (e && typeof e.preventDefault === 'function') {
            e.preventDefault()
        }
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation()
        }
        if (!datepickerRef.current || !pickerRef.current) return

        const currentVal = normalizeDisplayValue(inputRef.current?.value || value || '')
        pickerRef.current.value = currentVal

        // Si date valide JJ/MM/AAAA, initialiser la vue du calendrier
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(currentVal)) {
            const [day, month, year] = currentVal.split('/').map(Number)
            if (year >= 1900 && year <= 2100) {
                const date = new Date(year, month - 1, day)
                if (!isNaN(date.getTime())) {
                    isProgrammaticRef.current = true
                    try {
                        datepickerRef.current.setDate(date)
                    } catch (_) {}
                    setTimeout(() => {
                        isProgrammaticRef.current = false
                    }, 60)
                }
            }
        }

        datepickerRef.current.show()
    }, [value, normalizeDisplayValue])

    // Synchronisation de la valeur externe vers le champ DOM
    useEffect(() => {
        if (inputRef.current) {
            const displayVal = normalizeDisplayValue(value)
            if (inputRef.current.value !== displayVal) {
                inputRef.current.value = displayVal
            }
        }
    }, [value, normalizeDisplayValue])

    // Initialisation du datepicker Flowbite sur l'input caché
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

            const handleChangeDate = (e) => {
                // Ne rien faire si déclenché par setDate() interne
                if (isProgrammaticRef.current) return

                if (!datepickerRef.current) return
                const selectedDate = e?.detail?.date || datepickerRef.current.getDate()

                if (selectedDate && !isNaN(selectedDate.getTime())) {
                    const day = String(selectedDate.getDate()).padStart(2, '0')
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
                    const year = selectedDate.getFullYear()

                    // S'assurer que l'année est valide (4 chiffres entre 1900 et 2100)
                    if (year >= 1900 && year <= 2100) {
                        const formatted = `${day}/${month}/${year}`
                        if (inputRef.current) {
                            inputRef.current.value = formatted
                        }
                        if (onChange) {
                            onChange(formatted)
                        }
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
                    try {
                        datepickerRef.current.destroy()
                    } catch (_) {}
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
            <div 
                className={`relative w-full ${readOnlyInput ? 'cursor-pointer' : ''}`}
                onClick={readOnlyInput ? openCalendar : undefined}
            >
                {/* Input visible : saisie manuelle fluide ou mode calendrier au clic direct */}
                <input
                    ref={inputRef}
                    type="text"
                    readOnly={readOnlyInput}
                    inputMode={readOnlyInput ? 'none' : 'numeric'}
                    maxLength={10}
                    defaultValue={normalizeDisplayValue(value)}
                    onInput={readOnlyInput ? undefined : handleInput}
                    onKeyDown={readOnlyInput ? (e) => {
                        if (['Enter', ' '].includes(e.key)) {
                            e.preventDefault()
                            openCalendar(e)
                        }
                    } : handleKeyDown}
                    onBlur={readOnlyInput ? undefined : handleBlur}
                    onClick={readOnlyInput ? openCalendar : undefined}
                    placeholder={placeholder || 'JJ/MM/AAAA'}
                    className={`block w-full px-4 py-3 pr-10 rtl:pr-4 rtl:pl-10
            border rounded-lg 
            ${readOnlyInput 
                ? 'cursor-pointer select-none !bg-gray-50 hover:!bg-gray-100 dark:!bg-gray-700/60 dark:hover:!bg-gray-700 focus:ring-2 focus:ring-primary-500' 
                : '!bg-white dark:!bg-gray-700 focus:ring-2 focus:ring-primary-500'
            }
            text-gray-900 dark:text-white 
            placeholder-gray-400
            focus:border-transparent
            transition-all
            ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            ${className}
          `}
                    {...props}
                />
                {/* Input caché : Flowbite datepicker s'y attache */}
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
                    className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
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
