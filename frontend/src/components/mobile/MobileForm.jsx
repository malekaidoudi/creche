/**
 * MobileForm - Formulaire multi-étapes optimisé mobile
 * 
 * Formulaire avec progression visuelle, navigation entre étapes,
 * et validation par étape.
 * 
 * @usage
 * import MobileForm from '@/components/mobile/MobileForm';
 * <MobileForm 
 *   steps={[
 *     { title: 'Infos enfant', content: <ChildInfoForm /> },
 *     { title: 'Infos parent', content: <ParentInfoForm /> },
 *     { title: 'Confirmation', content: <ConfirmationStep /> }
 *   ]}
 *   onSubmit={handleSubmit}
 *   onStepChange={(step) => console.log('Step:', step)}
 * />
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const MobileForm = ({
    steps = [],
    onSubmit,
    onStepChange,
    initialStep = 0,
    submitLabel,
    isSubmitting = false,
    validateStep,
    showStepIndicator = true,
    allowSkip = false
}) => {
    const { isRTL } = useLanguage();
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [direction, setDirection] = useState(1);
    const [errors, setErrors] = useState({});

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === steps.length - 1;

    const goToStep = async (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= steps.length) return;

        // Validation si on avance
        if (stepIndex > currentStep && validateStep) {
            const stepErrors = await validateStep(currentStep);
            if (stepErrors && Object.keys(stepErrors).length > 0) {
                setErrors(stepErrors);
                return;
            }
        }

        setErrors({});
        setDirection(stepIndex > currentStep ? 1 : -1);
        setCurrentStep(stepIndex);

        if (onStepChange) {
            onStepChange(stepIndex);
        }

        // Scroll vers le haut
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        if (isLastStep) {
            onSubmit?.();
        } else {
            goToStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        goToStep(currentStep - 1);
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? (isRTL ? -300 : 300) : (isRTL ? 300 : -300),
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            x: direction > 0 ? (isRTL ? 300 : -300) : (isRTL ? -300 : 300),
            opacity: 0
        })
    };

    const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
    const NextIcon = isRTL ? ChevronLeft : ChevronRight;

    return (
        <div className="flex flex-col min-h-full">
            {/* Step Indicator */}
            {showStepIndicator && steps.length > 1 && (
                <div className="px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-14 z-30">
                    {/* Progress bar */}
                    <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-primary-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Step dots with labels */}
                    <div className="flex justify-between items-center">
                        {steps.map((step, index) => (
                            <button
                                key={index}
                                onClick={() => index < currentStep && goToStep(index)}
                                disabled={index > currentStep}
                                className="flex flex-col items-center"
                            >
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${index < currentStep
                                            ? 'bg-primary-600 text-white'
                                            : index === currentStep
                                                ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}
                                >
                                    {index < currentStep ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                <span className={`text-xs mt-1 ${index <= currentStep
                                        ? 'text-gray-900 dark:text-white font-medium'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                    {step.title}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="p-4"
                    >
                        {/* Step Title (if not in indicator) */}
                        {!showStepIndicator && steps[currentStep]?.title && (
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {steps[currentStep].title}
                            </h2>
                        )}

                        {/* Step Description */}
                        {steps[currentStep]?.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {steps[currentStep].description}
                            </p>
                        )}

                        {/* Errors */}
                        {Object.keys(errors).length > 0 && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                                    {Object.values(errors).map((error, i) => (
                                        <li key={i}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Step Content */}
                        {steps[currentStep]?.content}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="sticky bottom-16 lg:bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 safe-area-inset-bottom">
                <div className="flex gap-3">
                    {/* Previous Button */}
                    {!isFirstStep && (
                        <button
                            type="button"
                            onClick={handlePrev}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <PrevIcon className="w-5 h-5" />
                            {isRTL ? 'التالي' : 'Précédent'}
                        </button>
                    )}

                    {/* Skip Button (optional) */}
                    {allowSkip && !isLastStep && steps[currentStep]?.optional && (
                        <button
                            type="button"
                            onClick={() => goToStep(currentStep + 1)}
                            className="px-4 py-3 text-gray-500 dark:text-gray-400 font-medium"
                        >
                            {isRTL ? 'تخطي' : 'Passer'}
                        </button>
                    )}

                    {/* Next/Submit Button */}
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${isLastStep
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-primary-600 hover:bg-primary-700 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isRTL ? 'جاري...' : 'Chargement...'}
                            </>
                        ) : isLastStep ? (
                            <>
                                <Check className="w-5 h-5" />
                                {submitLabel || (isRTL ? 'تأكيد' : 'Confirmer')}
                            </>
                        ) : (
                            <>
                                {isRTL ? 'السابق' : 'Suivant'}
                                <NextIcon className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileForm;
