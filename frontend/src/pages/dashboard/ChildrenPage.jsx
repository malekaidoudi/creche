import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Baby, Plus, Search, Edit, Trash2, Calendar, Heart, Phone, Eye } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { childrenService } from '../../services/childrenService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'

const ChildrenPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ageFilter, setAgeFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedChild, setSelectedChild] = useState(null)

  useEffect(() => {
    loadChildren()
  }, [])

  const loadChildren = async () => {
    try {
      setLoading(true)
      const response = await childrenService.getAllChildren()
      setChildren(response.children || [])
    } catch (error) {
      console.error('Erreur lors du chargement des enfants:', error)
      toast.error('Erreur lors du chargement des enfants')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteChild = async (childId) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطفل؟' : 'Êtes-vous sûr de vouloir supprimer cet enfant ?')) {
      return
    }

    try {
      await childrenService.deleteChild(childId)
      toast.success(isRTL ? 'تم حذف الطفل بنجاح' : 'Enfant supprimé avec succès')
      loadChildren()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const calculateAge = (birthDate) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    if (age < 1) {
      const months = (today.getFullYear() - birth.getFullYear()) * 12 + monthDiff
      return `${months} ${isRTL ? 'شهر' : 'mois'}`
    }
    
    return `${age} ${isRTL ? 'سنة' : 'an(s)'}`
  }

  const filteredChildren = children.filter(child => {
    const matchesSearch = child.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         child.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (ageFilter === 'all') return matchesSearch
    
    const age = new Date().getFullYear() - new Date(child.birth_date).getFullYear()
    const matchesAge = ageFilter === '0-1' ? age < 1 : 
                      ageFilter === '1-2' ? age >= 1 && age < 2 :
                      ageFilter === '2-3' ? age >= 2 && age < 3 :
                      age >= 3
    
    return matchesSearch && matchesAge
  })

  const getGenderIcon = (gender) => {
    return gender === 'M' ? '👦' : '👧'
  }

  const getGenderColor = (gender) => {
    return gender === 'M' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.children')}
        subtitle={isRTL ? 'إدارة جميع الأطفال المسجلين' : 'Gérer tous les enfants inscrits'}
        action={
          <button 
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'إضافة طفل' : 'Ajouter un enfant'}
          </button>
        }
      />

      {/* Filtres et recherche */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={isRTL ? 'البحث عن الأطفال...' : 'Rechercher des enfants...'}
                className="form-input pl-10 rtl:pl-4 rtl:pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-input"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="all">{isRTL ? 'جميع الأعمار' : 'Tous les âges'}</option>
              <option value="0-1">{isRTL ? '0-1 سنة' : '0-1 an'}</option>
              <option value="1-2">{isRTL ? '1-2 سنة' : '1-2 ans'}</option>
              <option value="2-3">{isRTL ? '2-3 سنة' : '2-3 ans'}</option>
              <option value="3+">{isRTL ? '3+ سنوات' : '3+ ans'}</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              <Baby className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {filteredChildren.length} {isRTL ? 'طفل' : 'enfant(s)'}
            </div>
          </div>
        </div>
      </div>

      {/* Grille des enfants */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Baby className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isRTL ? 'لا يوجد أطفال' : 'Aucun enfant trouvé'}
            </h3>
            <p className="text-gray-500">
              {isRTL ? 'لم يتم العثور على أطفال مطابقين لمعايير البحث' : 'Aucun enfant ne correspond aux critères de recherche'}
            </p>
          </div>
        ) : (
          filteredChildren.map((child) => (
            <div key={child.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                {/* Header avec photo et nom */}
                <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                    {getGenderIcon(child.gender)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {child.first_name} {child.last_name}
                    </h3>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGenderColor(child.gender)}`}>
                        {child.gender === 'M' ? 
                          (isRTL ? 'ذكر' : 'Garçon') : 
                          (isRTL ? 'أنثى' : 'Fille')
                        }
                      </span>
                      <span className="text-sm text-gray-500">
                        ID: {child.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Informations */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                    <span>
                      {calculateAge(child.birth_date)} • {new Date(child.birth_date).toLocaleDateString()}
                    </span>
                  </div>

                  {child.medical_info && (
                    <div className="flex items-start text-sm text-gray-600">
                      <Heart className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-red-400 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{child.medical_info}</span>
                    </div>
                  )}

                  {child.emergency_contact_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-green-400" />
                      <span className="truncate">
                        {child.emergency_contact_name} • {child.emergency_contact_phone}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 rtl:space-x-reverse mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedChild(child)}
                    className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                    title={isRTL ? 'عرض' : 'Voir'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {/* TODO: Edit child */}}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                    title={isRTL ? 'تعديل' : 'Modifier'}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                    title={isRTL ? 'حذف' : 'Supprimer'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ChildrenPage
