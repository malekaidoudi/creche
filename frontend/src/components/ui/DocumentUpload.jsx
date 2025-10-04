import { useState } from 'react'
import { Upload, File, X, AlertCircle } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

const DocumentUpload = ({ 
  documentType, 
  label, 
  description, 
  required = false, 
  onFileChange, 
  value, 
  error 
}) => {
  const { isRTL } = useLanguage()
  const [dragOver, setDragOver] = useState(false)

  const handleFileSelect = (file) => {
    // Validation du fichier
    const maxSize = 5 * 1024 * 1024 // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

    if (file.size > maxSize) {
      alert(isRTL ? 'حجم الملف كبير جداً (الحد الأقصى 5MB)' : 'Fichier trop volumineux (max 5MB)')
      return
    }

    if (!allowedTypes.includes(file.type)) {
      alert(isRTL ? 'نوع الملف غير مدعوم (PDF, JPG, PNG فقط)' : 'Type de fichier non supporté (PDF, JPG, PNG uniquement)')
      return
    }

    onFileChange(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeFile = () => {
    onFileChange(null)
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {!value ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : error
              ? 'border-red-300 dark:border-red-600'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById(`file-${documentType}`).click()}
        >
          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {isRTL 
              ? 'انقر لاختيار ملف أو اسحب وأفلت'
              : 'Cliquez pour sélectionner ou glissez-déposez'
            }
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            PDF, JPG, PNG (max 5MB)
          </p>
          
          <input
            id={`file-${documentType}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              const file = e.target.files[0]
              if (file) {
                handleFileSelect(file)
              }
            }}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <File className="w-5 h-5 text-primary-600" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {value.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 rtl:space-x-reverse text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default DocumentUpload
