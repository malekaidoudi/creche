/**
 * FormToStepsAdapter - Convertit un formulaire complexe en étapes mobiles
 * 
 * Adaptateur qui transforme automatiquement les sections d'un formulaire
 * en étapes navigables pour mobile.
 * 
 * @usage
 * import FormToStepsAdapter from '@/components/mobile/adapters/FormToStepsAdapter';
 * <FormToStepsAdapter 
 *   sections={[
 *     { 
 *       title: 'Informations enfant',
 *       fields: [
 *         { name: 'firstName', label: 'Prénom', type: 'text', required: true },
 *         { name: 'birthDate', label: 'Date de naissance', type: 'date' }
 *       ]
 *     }
 *   ]}
 *   onSubmit={handleSubmit}
 *   initialValues={defaultValues}
 * />
 */

import { useState, useCallback } from 'react';
import MobileForm from '../MobileForm';
import { useLanguage } from '../../../hooks/useLanguage';
import { Eye, EyeOff, Calendar, Upload, X } from 'lucide-react';

const FormToStepsAdapter = ({
    sections = [],
    onSubmit,
    initialValues = {},
    submitLabel,
    isSubmitting = false,
    onChange
}) => {
    const { isRTL } = useLanguage();
    const [formData, setFormData] = useState(initialValues);
    const [showPasswords, setShowPasswords] = useState({});

    const handleFieldChange = useCallback((name, value) => {
        setFormData(prev => {
            const newData = { ...prev, [name]: value };
            if (onChange) onChange(newData);
            return newData;
        });
    }, [onChange]);

    const validateStep = useCallback(async (stepIndex) => {
        const section = sections[stepIndex];
        if (!section) return {};

        const errors = {};
        section.fields.forEach(field => {
            if (field.required && !formData[field.name]) {
                errors[field.name] = `${field.label} ${isRTL ? 'مطلوب' : 'est requis'}`;
            }
            if (field.type === 'email' && formData[field.name]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[field.name])) {
                    errors[field.name] = isRTL ? 'البريد الإلكتروني غير صالح' : 'Email invalide';
                }
            }
            if (field.minLength && formData[field.name]?.length < field.minLength) {
                errors[field.name] = `${field.label} ${isRTL ? 'يجب أن يحتوي على' : 'doit contenir au moins'} ${field.minLength} ${isRTL ? 'أحرف' : 'caractères'}`;
            }
            if (field.validate) {
                const error = field.validate(formData[field.name], formData);
                if (error) errors[field.name] = error;
            }
        });

        return errors;
    }, [sections, formData, isRTL]);

    const handleSubmit = useCallback(() => {
        if (onSubmit) {
            onSubmit(formData);
        }
    }, [formData, onSubmit]);

    const renderField = (field) => {
        const value = formData[field.name] ?? '';
        const commonProps = {
            id: field.name,
            name: field.name,
            value,
            onChange: (e) => handleFieldChange(field.name, e.target.value),
            placeholder: field.placeholder || field.label,
            disabled: field.disabled,
            className: `w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${field.error ? 'border-red-500' : ''}`
        };

        switch (field.type) {
            case 'textarea':
                return (
                    <textarea
                        {...commonProps}
                        rows={field.rows || 4}
                    />
                );

            case 'select':
                return (
                    <select {...commonProps}>
                        <option value="">{field.placeholder || `${isRTL ? 'اختر' : 'Sélectionner'}...`}</option>
                        {field.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {field.options?.map(opt => (
                            <label
                                key={opt.value}
                                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors"
                            >
                                <input
                                    type="radio"
                                    name={field.name}
                                    value={opt.value}
                                    checked={value === opt.value}
                                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                                    className="w-4 h-4 text-primary-600"
                                />
                                <span className="text-gray-900 dark:text-white">{opt.label}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name={field.name}
                            checked={!!value}
                            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">{field.checkboxLabel || field.label}</span>
                    </label>
                );

            case 'date':
                return (
                    <div className="relative">
                        <input
                            {...commonProps}
                            type="date"
                        />
                        <Calendar className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                );

            case 'password':
                const showPwd = showPasswords[field.name];
                return (
                    <div className="relative">
                        <input
                            {...commonProps}
                            type={showPwd ? 'text' : 'password'}
                            className={`${commonProps.className} pr-12 rtl:pr-4 rtl:pl-12`}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, [field.name]: !prev[field.name] }))}
                            className="absolute right-4 rtl:right-auto rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                );

            case 'file':
                return (
                    <div className="space-y-2">
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-primary-500 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {isRTL ? 'انقر لتحميل ملف' : 'Cliquez pour télécharger'}
                            </span>
                            <input
                                type="file"
                                name={field.name}
                                accept={field.accept}
                                onChange={(e) => handleFieldChange(field.name, e.target.files[0])}
                                className="hidden"
                            />
                        </label>
                        {value && (
                            <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {value.name || value}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleFieldChange(field.name, null)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'tel':
                return (
                    <input
                        {...commonProps}
                        type="tel"
                        dir="ltr"
                    />
                );

            case 'email':
                return (
                    <input
                        {...commonProps}
                        type="email"
                        dir="ltr"
                    />
                );

            case 'number':
                return (
                    <input
                        {...commonProps}
                        type="number"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                    />
                );

            default:
                return (
                    <input
                        {...commonProps}
                        type={field.type || 'text'}
                    />
                );
        }
    };

    const steps = sections.map(section => ({
        title: section.title,
        description: section.description,
        optional: section.optional,
        content: (
            <div className="space-y-5">
                {section.fields.map(field => (
                    <div key={field.name}>
                        {field.type !== 'checkbox' && (
                            <label
                                htmlFor={field.name}
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                            >
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        )}
                        {renderField(field)}
                        {field.hint && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {field.hint}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        )
    }));

    return (
        <MobileForm
            steps={steps}
            onSubmit={handleSubmit}
            validateStep={validateStep}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
        />
    );
};

export default FormToStepsAdapter;
