import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, File, X, Check, AlertCircle, Download } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { documentService } from '../../services/documentService'
import toast from 'react-hot-toast'

const DocumentUpload = ({ 
  documentType, 
  label, 
  description, 
  required = false, 
  onFileChange,
  value = null,
  error = null 
}) => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(value)
  const [validationErrors, setValidationErrors] = useState([])

  const handleFileSelect = (file) => {
    if (!file) return

    // Valider le fichier
    const validation = documentService.validateFile(file, documentType)
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      toast.error(validation.errors[0])
      return
    }

    setValidationErrors([])
    setUploadedFile(file)
    
    // Notifier le parent
    if (onFileChange) {
      onFileChange(file)
    }

    toast.success(isRTL ? 'تم تحميل الملف بنجاح' : 'Fichier téléchargé avec succès')
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = () => {
    setUploadedFile(null)
    setValidationErrors([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (onFileChange) {
      onFileChange(null)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getDocumentTypeLabel = () => {
    switch (documentType) {
      case documentService.documentTypes.CARNET_MEDICAL:
        return isRTL ? 'الدفتر الطبي' : 'Carnet médical'
      case documentService.documentTypes.ACTE_NAISSANCE:
        return isRTL ? 'شهادة الميلاد' : 'Acte de naissance'
      case documentService.documentTypes.CERTIFICAT_MEDICAL:
        return isRTL ? 'الشهادة الطبية' : 'Certificat médical'
      default:
        return label
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {getDocumentTypeLabel()}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
        
        {/* Bouton de téléchargement du règlement */}
        {documentType === 'reglement' && (
          <button
            type="button"
            onClick={documentService.downloadReglement}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <Download className="w-4 h-4 mr-1" />
            {isRTL ? 'تحميل النظام الداخلي' : 'Télécharger le règlement'}
          </button>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {/* Zone d'upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-3 transition-colors ${
          isDragging
            ? 'border-blue-400 bg-blue-50'
            : uploadedFile
            ? 'border-green-400 bg-green-50'
            : error || validationErrors.length > 0
            ? 'border-red-400 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {uploadedFile ? (
          /* Fichier uploadé */
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="flex-shrink-0">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="flex-shrink-0 p-1 text-red-600 hover:text-red-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Zone d'upload vide */
          <div className="text-center">
            <Upload className={`mx-auto h-8 w-8 ${
              error || validationErrors.length > 0 ? 'text-red-400' : 'text-gray-400'
            }`} />
            <div className="mt-2">
              <button
                type="button"
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                {isRTL ? 'اختر ملف' : 'Choisir un fichier'}
              </button>
              <p className="text-xs text-gray-600 mt-1">
                {isRTL ? 'أو اسحب وأفلت هنا' : 'ou glissez-déposez ici'}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG {isRTL ? 'حتى' : 'jusqu\'à'} 5MB
            </p>
          </div>
        )}
      </div>

      {/* Erreurs de validation */}
      {(validationErrors.length > 0 || error) && (
        <div className="space-y-1">
          {validationErrors.map((err, index) => (
            <div key={index} className="flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              {err}
            </div>
          ))}
          {error && (
            <div className="flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Informations sur le type de document */}
      <div className="text-xs text-gray-500">
        {documentType === documentService.documentTypes.CARNET_MEDICAL && (
          <p>{isRTL ? 'الدفتر الطبي للطفل مع التطعيمات' : 'Carnet de santé de l\'enfant avec vaccinations'}</p>
        )}
        {documentType === documentService.documentTypes.ACTE_NAISSANCE && (
          <p>{isRTL ? 'شهادة الميلاد الأصلية أو نسخة مصدقة' : 'Acte de naissance original ou copie certifiée'}</p>
        )}
        {documentType === documentService.documentTypes.CERTIFICAT_MEDICAL && (
          <p>{isRTL ? 'شهادة طبية تؤكد عدم وجود أمراض معدية' : 'Certificat médical attestant l\'absence de maladies contagieuses'}</p>
        )}
      </div>
    </div>
  )
}

export default DocumentUpload
