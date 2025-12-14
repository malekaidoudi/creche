import React, { useRef, useState } from 'react';
import { Camera, X, Check, RotateCcw, FileImage } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Composant DocumentScanner
 * Permet de scanner des documents via la caméra du smartphone
 * ou de sélectionner une image depuis la galerie
 */
const DocumentScanner = ({
    label,
    onCapture,
    onRemove,
    accept = 'image/*',
    maxSize = 10 * 1024 * 1024, // 10MB par défaut
    className = '',
    disabled = false
}) => {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [fileName, setFileName] = useState(null);

    // Détection mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        // Vérifier la taille
        if (file.size > maxSize) {
            setError(`Fichier trop volumineux (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
            return;
        }

        // Créer la prévisualisation
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setFileName(file.name);
            onCapture?.(file);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = () => {
        setPreview(null);
        setFileName(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        onRemove?.();
    };

    const triggerCamera = () => {
        cameraInputRef.current?.click();
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label}
                    <span className="text-gray-400 text-xs ml-2">(optionnel)</span>
                </label>
            )}

            {/* Zone de prévisualisation ou boutons */}
            <AnimatePresence mode="wait">
                {preview ? (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative rounded-xl overflow-hidden border-2 border-green-500 dark:border-green-400"
                    >
                        {/* Image prévisualisée */}
                        <img
                            src={preview}
                            alt="Document scanné"
                            className="w-full h-40 object-cover"
                        />

                        {/* Overlay avec actions */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                title="Supprimer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <button
                                type="button"
                                onClick={isMobile ? triggerCamera : triggerFileSelect}
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                                title="Remplacer"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Badge de succès */}
                        <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                            <Check className="w-4 h-4" />
                        </div>

                        {/* Nom du fichier */}
                        {fileName && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                                {fileName}
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="buttons"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-2"
                    >
                        {/* Bouton Scanner (mobile uniquement) */}
                        {isMobile && (
                            <button
                                type="button"
                                onClick={triggerCamera}
                                disabled={disabled}
                                className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Camera className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    Scanner
                                </span>
                            </button>
                        )}

                        {/* Bouton Galerie/Fichier */}
                        <button
                            type="button"
                            onClick={triggerFileSelect}
                            disabled={disabled}
                            className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FileImage className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isMobile ? 'Galerie' : 'Parcourir'}
                            </span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Message d'erreur */}
            {error && (
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            {/* Inputs cachés */}
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />
        </div>
    );
};

export default DocumentScanner;
