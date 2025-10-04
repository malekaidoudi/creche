import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Upload, 
  Search, 
  Filter,
  Grid3X3,
  List,
  Download,
  Trash2,
  Eye,
  Edit3,
  Image,
  FileText,
  Video,
  Music,
  Archive
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import PageHeader from '../../components/ui/PageHeader'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import Modal from '../../components/ui/Modal'
import toast from 'react-hot-toast'

const MediaPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  
  const [files, setFiles] = useState([])

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    setLoading(true)
    try {
      // Simuler des données
      setTimeout(() => {
        setFiles([
          {
            id: 1,
            name: 'photo-activite-1.jpg',
            type: 'image',
            size: 2.5,
            url: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300',
            uploadedAt: '2024-01-15',
            uploadedBy: 'Admin'
          },
          {
            id: 2,
            name: 'reglement-interieur.pdf',
            type: 'document',
            size: 1.2,
            url: '/documents/reglement.pdf',
            uploadedAt: '2024-01-10',
            uploadedBy: 'Staff'
          },
          {
            id: 3,
            name: 'video-presentation.mp4',
            type: 'video',
            size: 15.8,
            url: '/videos/presentation.mp4',
            uploadedAt: '2024-01-08',
            uploadedBy: 'Admin'
          },
          {
            id: 4,
            name: 'chanson-enfants.mp3',
            type: 'audio',
            size: 4.2,
            url: '/audio/chanson.mp3',
            uploadedAt: '2024-01-05',
            uploadedBy: 'Staff'
          }
        ])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error)
      setLoading(false)
    }
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return Image
      case 'video': return Video
      case 'audio': return Music
      case 'document': return FileText
      default: return Archive
    }
  }

  const getFileTypeColor = (type) => {
    switch (type) {
      case 'image': return 'text-green-600 bg-green-100'
      case 'video': return 'text-blue-600 bg-blue-100'
      case 'audio': return 'text-purple-600 bg-purple-100'
      case 'document': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || file.type === filterType
    return matchesSearch && matchesType
  })

  const handleFileSelect = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleDelete = async (fileId) => {
    if (window.confirm(isRTL ? 'هل أنت متأكد من حذف هذا الملف؟' : 'Êtes-vous sûr de vouloir supprimer ce fichier ?')) {
      try {
        setFiles(prev => prev.filter(file => file.id !== fileId))
        toast.success(isRTL ? 'تم حذف الملف بنجاح' : 'Fichier supprimé avec succès')
      } catch (error) {
        toast.error(isRTL ? 'خطأ في حذف الملف' : 'Erreur lors de la suppression')
      }
    }
  }

  const handlePreview = (file) => {
    setPreviewFile(file)
    setShowPreviewModal(true)
  }

  const handleUpload = async (uploadedFiles) => {
    // Logique d'upload
    console.log('Fichiers à uploader:', uploadedFiles)
    setShowUploadModal(false)
    toast.success(isRTL ? 'تم رفع الملفات بنجاح' : 'Fichiers uploadés avec succès')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRTL ? 'إدارة الوسائط' : 'Gestion des Médias'}
        subtitle={isRTL ? 'تنظيم وإدارة الملفات والصور' : 'Organiser et gérer les fichiers et images'}
      >
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isRTL ? 'رفع ملفات' : 'Uploader'}
        </button>
      </PageHeader>

      {/* Barre d'outils */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={isRTL ? 'البحث في الملفات...' : 'Rechercher des fichiers...'}
                  className="form-input pl-10 rtl:pr-10 rtl:pl-3 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filtre par type */}
              <select
                className="form-input w-auto"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">{isRTL ? 'جميع الأنواع' : 'Tous les types'}</option>
                <option value="image">{isRTL ? 'الصور' : 'Images'}</option>
                <option value="video">{isRTL ? 'الفيديوهات' : 'Vidéos'}</option>
                <option value="audio">{isRTL ? 'الصوتيات' : 'Audio'}</option>
                <option value="document">{isRTL ? 'المستندات' : 'Documents'}</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Mode d'affichage */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Actions sur la sélection */}
              {selectedFiles.length > 0 && (
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className="text-sm text-gray-600">
                    {selectedFiles.length} {isRTL ? 'محدد' : 'sélectionné(s)'}
                  </span>
                  <button
                    onClick={() => {
                      selectedFiles.forEach(handleDelete)
                      setSelectedFiles([])
                    }}
                    className="btn-error btn-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Liste/Grille des fichiers */}
      <div className="card">
        <div className="card-body">
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {isRTL ? 'لا توجد ملفات' : 'Aucun fichier trouvé'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.type)
                return (
                  <div
                    key={file.id}
                    className={`relative group border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedFiles.includes(file.id) ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleFileSelect(file.id)}
                  >
                    <div className="aspect-square flex items-center justify-center mb-3">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${getFileTypeColor(file.type)}`}>
                          <Icon className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file.size} MB
                      </p>
                    </div>

                    {/* Actions au survol */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePreview(file)
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(file.url, '_blank')
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-primary-600"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(file.id)
                        }}
                        className="p-2 bg-white rounded-full text-gray-700 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Checkbox de sélection */}
                    <div className="absolute top-2 right-2 rtl:left-2 rtl:right-auto">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => handleFileSelect(file.id)}
                        className="w-4 h-4 text-primary-600 bg-white border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell w-8">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFiles(filteredFiles.map(f => f.id))
                          } else {
                            setSelectedFiles([])
                          }
                        }}
                        checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                      />
                    </th>
                    <th className="table-header-cell">{isRTL ? 'الاسم' : 'Nom'}</th>
                    <th className="table-header-cell">{isRTL ? 'النوع' : 'Type'}</th>
                    <th className="table-header-cell">{isRTL ? 'الحجم' : 'Taille'}</th>
                    <th className="table-header-cell">{isRTL ? 'تاريخ الرفع' : 'Date d\'upload'}</th>
                    <th className="table-header-cell">{isRTL ? 'رفع بواسطة' : 'Uploadé par'}</th>
                    <th className="table-header-cell">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredFiles.map((file) => {
                    const Icon = getFileIcon(file.type)
                    return (
                      <tr key={file.id}>
                        <td className="table-cell">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => handleFileSelect(file.id)}
                          />
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-3 rtl:space-x-reverse">
                            <div className={`w-8 h-8 rounded flex items-center justify-center ${getFileTypeColor(file.type)}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className={`badge ${getFileTypeColor(file.type)}`}>
                            {file.type}
                          </span>
                        </td>
                        <td className="table-cell">{file.size} MB</td>
                        <td className="table-cell">{file.uploadedAt}</td>
                        <td className="table-cell">{file.uploadedBy}</td>
                        <td className="table-cell">
                          <div className="flex items-center space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => handlePreview(file)}
                              className="text-gray-400 hover:text-primary-600"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="text-gray-400 hover:text-primary-600"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title={isRTL ? 'رفع ملفات جديدة' : 'Uploader de nouveaux fichiers'}
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {isRTL ? 'اسحب الملفات هنا أو انقر للتحديد' : 'Glissez les fichiers ici ou cliquez pour sélectionner'}
            </p>
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              onChange={(e) => handleUpload(Array.from(e.target.files))}
            />
            <label
              htmlFor="file-upload"
              className="btn-primary cursor-pointer"
            >
              {isRTL ? 'اختيار الملفات' : 'Choisir les fichiers'}
            </label>
          </div>
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title={previewFile?.name}
        size="lg"
      >
        {previewFile && (
          <div className="space-y-4">
            {previewFile.type === 'image' ? (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="w-full h-auto rounded-lg"
              />
            ) : (
              <div className="text-center py-12">
                <div className={`w-24 h-24 rounded-lg flex items-center justify-center mx-auto mb-4 ${getFileTypeColor(previewFile.type)}`}>
                  {(() => {
                    const Icon = getFileIcon(previewFile.type)
                    return <Icon className="w-12 h-12" />
                  })()}
                </div>
                <p className="text-gray-600">
                  {isRTL ? 'معاينة غير متاحة لهذا النوع من الملفات' : 'Aperçu non disponible pour ce type de fichier'}
                </p>
              </div>
            )}
            
            <div className="border-t pt-4">
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-900">{isRTL ? 'الحجم' : 'Taille'}</dt>
                  <dd className="text-gray-600">{previewFile.size} MB</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">{isRTL ? 'النوع' : 'Type'}</dt>
                  <dd className="text-gray-600">{previewFile.type}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">{isRTL ? 'تاريخ الرفع' : 'Date d\'upload'}</dt>
                  <dd className="text-gray-600">{previewFile.uploadedAt}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-900">{isRTL ? 'رفع بواسطة' : 'Uploadé par'}</dt>
                  <dd className="text-gray-600">{previewFile.uploadedBy}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default MediaPage
