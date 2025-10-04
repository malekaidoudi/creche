import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, Search, Filter, Edit, Trash2, Mail, Phone, Shield, Eye } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import { userService } from '../../services/userService'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import PageHeader from '../../components/ui/PageHeader'
import toast from 'react-hot-toast'

const UsersPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await userService.getAllUsers()
      setUsers(response.users || [])
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error)
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    try {
      await userService.deleteUser(userId)
      toast.success(isRTL ? 'تم حذف المستخدم بنجاح' : 'Utilisateur supprimé avec succès')
      loadUsers()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      staff: 'bg-blue-100 text-blue-800',
      parent: 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return Shield
      case 'staff': return Users
      case 'parent': return Users
      default: return Users
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.users')}
        subtitle={isRTL ? 'إدارة جميع المستخدمين في النظام' : 'Gérer tous les utilisateurs du système'}
        action={
          <button 
            className="btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'إضافة مستخدم' : 'Ajouter un utilisateur'}
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
                placeholder={isRTL ? 'البحث عن المستخدمين...' : 'Rechercher des utilisateurs...'}
                className="form-input pl-10 rtl:pl-4 rtl:pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-input"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">{isRTL ? 'جميع الأدوار' : 'Tous les rôles'}</option>
              <option value="admin">{isRTL ? 'مدير' : 'Administrateur'}</option>
              <option value="staff">{isRTL ? 'موظف' : 'Personnel'}</option>
              <option value="parent">{isRTL ? 'والد' : 'Parent'}</option>
            </select>

            <div className="text-sm text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {filteredUsers.length} {isRTL ? 'مستخدم' : 'utilisateur(s)'}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isRTL ? 'لا يوجد مستخدمون' : 'Aucun utilisateur trouvé'}
              </h3>
              <p className="text-gray-500">
                {isRTL ? 'لم يتم العثور على مستخدمين مطابقين لمعايير البحث' : 'Aucun utilisateur ne correspond aux critères de recherche'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'المستخدم' : 'Utilisateur'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الاتصال' : 'Contact'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الدور' : 'Rôle'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الحالة' : 'Statut'}
                    </th>
                    <th className="px-6 py-3 text-left rtl:text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {isRTL ? 'الإجراءات' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => {
                    const RoleIcon = getRoleIcon(user.role)
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.profile_picture ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={user.profile_picture}
                                  alt=""
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 rtl:ml-0 rtl:mr-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center text-sm text-gray-900">
                              <Mail className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Phone className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 text-gray-400" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <RoleIcon className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                              {isRTL ? 
                                (user.role === 'admin' ? 'مدير' : user.role === 'staff' ? 'موظف' : 'والد') :
                                (user.role === 'admin' ? 'Admin' : user.role === 'staff' ? 'Staff' : 'Parent')
                              }
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 
                              (isRTL ? 'نشط' : 'Actif') : 
                              (isRTL ? 'غير نشط' : 'Inactif')
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2 rtl:space-x-reverse">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title={isRTL ? 'عرض' : 'Voir'}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {/* TODO: Edit user */}}
                              className="text-blue-600 hover:text-blue-900"
                              title={isRTL ? 'تعديل' : 'Modifier'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                              title={isRTL ? 'حذف' : 'Supprimer'}
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
    </div>
  )
}

export default UsersPage
