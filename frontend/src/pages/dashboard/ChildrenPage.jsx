import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Baby,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  FileText,
  Download,
  Trash,
  Stethoscope,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Pill,
  HeartPulse,
  PauseCircle,
  Play,
  Users,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import useIsMobile from '../../hooks/useIsMobile';
import { useAccess, FEATURES } from '../../access';
import { Button } from '../../components/ui/Button';
import MobileChildrenList from '../../components/mobile/MobileChildrenList';
import MobileNavigation from '../../components/mobile/MobileNavigation';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CompactImageUpload from '../../components/ui/CompactImageUpload';
import { useDialogContext } from '../../contexts/DialogContext';
import childrenService from '../../services/childrenService';
import api from '../../services/api';
import userService from '../../services/userService';
import { documentService } from '../../services/documentService';
import approvalService from '../../services/approvalService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import API_CONFIG from '../../config/api';

// Construit l'URL complète d'une photo enfant (le backend ne renvoie qu'un chemin relatif)
const getChildPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http') || photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) return photoUrl;
  return `${API_CONFIG.BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`;
};

const parseAllergies = (allergies) => {
  if (!allergies) return [];
  if (Array.isArray(allergies)) return allergies.filter(Boolean);
  if (typeof allergies === 'string') {
    try {
      const parsed = JSON.parse(allergies);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
      return [allergies].filter(Boolean);
    } catch {
      return allergies.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

const isNoEmail = (email) => Boolean(!email || email.includes('@creche.local') || email.includes('noemail'));

const ChildrenPage = () => {
  const { user, isAdmin, isStaff } = useAuth();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const dialog = useDialogContext();
  const { can } = useAccess();
  const userIsAdmin = (typeof isAdmin === 'function' ? isAdmin() : !!isAdmin) || user?.role === 'developer';
  const canViewMedical = userIsAdmin || can(FEATURES.MEDICAL_VIEW);
  const canManagePhotos = userIsAdmin || can(FEATURES.CHILDREN_PHOTOS_MANAGE);
  const canManageMedical = canViewMedical;
  const canManageEmergencyPhone = userIsAdmin || can(FEATURES.PARENTS_PHONE_VIEW);
  const canEditOnlyPhoto = canManagePhotos && !canManageMedical && !canManageEmergencyPhone;
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [parents, setParents] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [children, setChildren] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const searchDebounceTimer = useRef(null);
  const [filterStatus, setFilterStatus] = useState('all_enrolled');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendingChild, setSuspendingChild] = useState(null);
  const [suspendReasonCategory, setSuspendReasonCategory] = useState('Retard de paiement');
  const [suspendReasonDetails, setSuspendReasonDetails] = useState('');
  const [suspendExpectedReturnDate, setSuspendExpectedReturnDate] = useState('');
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [filterAge, setFilterAge] = useState('all');
  const [editFormData, setEditFormData] = useState({});
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null);
  const [photoActionLoading, setPhotoActionLoading] = useState(false);
  const [photoImageKey, setPhotoImageKey] = useState(Date.now());
  const [childDocuments, setChildDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [missingInfoOpenId, setMissingInfoOpenId] = useState(null);
  const missingInfoPopoverRef = useRef(null);
  const [directorPhone, setDirectorPhone] = useState('+216 25 95 35 32');

  // Récupérer le numéro de téléphone de contact de la direction / admin pour les urgences
  useEffect(() => {
    api.get('/contact/info')
      .then((res) => {
        if (res.data?.contact?.phone) {
          setDirectorPhone(res.data.contact.phone);
        }
      })
      .catch(() => {});
  }, []);

  // Fermer la bulle d'info "dossier incomplet" en cliquant à l'extérieur
  useEffect(() => {
    if (missingInfoOpenId === null) return;
    const handleClickOutside = (e) => {
      if (missingInfoPopoverRef.current && !missingInfoPopoverRef.current.contains(e.target)) {
        setMissingInfoOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [missingInfoOpenId]);

  // Fonction pour charger les enfants depuis l'API
  const loadChildren = async (isSearching = false, customSearchTerm = null) => {
    try {
      const actualSearchTerm = customSearchTerm !== null ? customSearchTerm : searchTerm;
      console.log('🚀 loadChildren appelé - isSearching:', isSearching, 'searchTerm:', actualSearchTerm);

      // Utiliser searchLoading pour la recherche, loading pour le chargement initial
      if (isSearching) {
        setSearchLoading(true);
      } else {
        setLoading(true);
      }

      const params = {
        page: currentPage,
        limit: pageLimit,
        search: actualSearchTerm,
        status: filterStatus,
        age: filterAge
      };

      console.log('📤 Paramètres envoyés:', params);
      const response = await childrenService.getAllChildren(params);
      console.log('📋 ChildrenPage - Réponse API complète:', response);

      if (response.success) {
        const childrenData = response.data.children || [];
        console.log('✅ ChildrenPage - Enfants chargés:', childrenData.length, 'enfants (déjà filtrés par le backend)');
        // Le backend filtre déjà par enrollment_status = 'approved'
        setChildren(childrenData);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.pages || 0);
      } else {
        console.error('❌ ChildrenPage - Erreur API:', response);
        dialog.error(isRTL ? 'خطأ في تحميل الأطفال' : 'Erreur lors du chargement des enfants');
        setChildren([]); // Vider la liste en cas d'erreur
      }
    } catch (error) {
      console.error('❌ Erreur CATCH lors du chargement:', error);
      dialog.error(isRTL ? 'خطأ في الاتصال، تحقق من اتصالك بالإنترنت' : 'Erreur de connexion, vérifiez votre connexion internet');
      setChildren([]); // Vider la liste en cas d'erreur
    } finally {
      console.log('✅ loadChildren terminé - setLoading(false)');
      if (isSearching) {
        setSearchLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // Chargement initial
  useEffect(() => {
    console.log('🎬 Chargement initial de la page');
    loadChildren(false); // false = utilise loading au lieu de searchLoading

    // Nettoyage du timer lors du démontage
    return () => {
      if (searchDebounceTimer.current) {
        clearTimeout(searchDebounceTimer.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Changements de filtre/page (après le chargement initial)
  useEffect(() => {
    console.log('🔄 useEffect déclenché - filterStatus:', filterStatus, 'filterAge:', filterAge, 'page:', currentPage);
    // Ne rien faire au premier render (déjà géré par le useEffect ci-dessus)
    if (children.length > 0 || !loading) {
      loadChildren(true);
    }
  }, [filterStatus, filterAge, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Gestion du debounce de recherche
  const handleSearchChange = (e) => {
    const value = e.target.value;
    console.log('⌨️ Saisie recherche:', value);
    setSearchTerm(value);

    // Annuler le timer précédent
    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    // Créer un nouveau timer
    searchDebounceTimer.current = setTimeout(() => {
      console.log('🔍 Recherche déclenchée après debounce:', value);
      // Passer directement le terme de recherche pour éviter le problème de state
      loadChildren(true, value);
    }, 300);
  };

  // Fonction pour rafraîchir les données
  const handleRefresh = () => {
    loadChildren();
  };

  // Fonction pour voir un enfant
  const handleViewChild = async (child) => {
    setSelectedChild(child);
    setShowAssociateModal(false);
    setShowEditModal(false);

    // Charger les détails complets (traitements récents, données médicales à jour)
    try {
      const response = await childrenService.getChildById(child.id);
      if (response?.success && response.child) {
        setSelectedChild(prev => (prev && prev.id === child.id ? { ...prev, ...response.child } : response.child));
      }
    } catch (err) {
      console.warn('Erreur chargement détails complets enfant:', err);
    }

    // Charger les documents de l'enfant
    try {
      setDocumentsLoading(true);
      const response = await documentService.getChildDocuments(child.id);
      if (response.success) {
        setChildDocuments(response.documents);
      }
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      setChildDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Fonction pour modifier un enfant
  const handleEditChild = (child) => {
    setSelectedChild(child);
    setEditFormData({
      first_name: child.first_name || '',
      last_name: child.last_name || '',
      birth_date: child.birth_date ? child.birth_date.split('T')[0] : '',
      gender: child.gender || 'male',
      parent_email: isNoEmail(child.parent_email) ? '' : (child.parent_email || ''),
      parent_phone: child.parent_phone || '',
      second_parent_name: child.second_parent_name || '',
      second_parent_phone: child.second_parent_phone || '',
      emergency_contact_name: child.emergency_contact_name || '',
      emergency_contact_phone: child.emergency_contact_phone || '',
      status: child.status || 'pending'
    });
    setSelectedPhotoFile(null);
    setShowEditModal(true);
  };

  // Fonction pour uploader la photo de l'enfant sélectionné
  const handleUploadPhoto = async (file) => {
    if (!file || !selectedChild) return;
    if (!isAdmin() && !can(FEATURES.CHILDREN_PHOTOS_MANAGE)) {
      dialog.error(isRTL ? 'ليس لديك صلاحية تعديل صورة الطفل' : 'Permission requise pour modifier la photo de l\'enfant');
      return;
    }

    try {
      setPhotoActionLoading(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post(`/api/children/${selectedChild.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        dialog.success(isRTL ? 'تم تحديث الصورة بنجاح' : 'Photo mise à jour avec succès');
        setSelectedChild(prev => ({ ...prev, photo_url: response.data.photo_url }));
        setSelectedPhotoFile(null);
        setPhotoImageKey(Date.now());
        loadChildren();
      } else {
        throw new Error(response.data?.error || 'Erreur lors de l\'upload');
      }
    } catch (error) {
      console.error('Erreur upload photo:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في رفع الصورة' : 'Erreur lors de l\'upload de la photo'));
    } finally {
      setPhotoActionLoading(false);
    }
  };

  // Fonction pour supprimer la photo de l'enfant sélectionné
  const handleDeletePhoto = async () => {
    if (!selectedChild) return;
    if (!isAdmin() && !can(FEATURES.CHILDREN_PHOTOS_MANAGE)) {
      dialog.error(isRTL ? 'ليس لديك صلاحية حذف صورة الطفل' : 'Permission requise pour modifier la photo de l\'enfant');
      return;
    }

    const confirmed = await dialog.confirm(
      isRTL ? 'هل تريد حذف صورة الطفل؟' : 'Voulez-vous supprimer la photo de l\'enfant ?',
      isRTL ? 'تأكيد الحذف' : 'Confirmer la suppression',
      { type: 'danger', confirmText: isRTL ? 'حذف' : 'Supprimer', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );
    if (!confirmed) return;

    try {
      setPhotoActionLoading(true);
      const response = await api.delete(`/api/children/${selectedChild.id}/photo`);

      if (response.data?.success) {
        dialog.success(isRTL ? 'تم حذف الصورة بنجاح' : 'Photo supprimée avec succès');
        setSelectedChild(prev => ({ ...prev, photo_url: null }));
        loadChildren();
      } else {
        throw new Error(response.data?.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression photo:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في حذف الصورة' : 'Erreur lors de la suppression de la photo'));
    } finally {
      setPhotoActionLoading(false);
    }
  };

  // Fonction pour désactiver le compte parent (remplace la suppression)
  const handleDeactivateParent = async (child) => {
    const confirmed = await dialog.confirm(
      isRTL ? 'هل أنت متأكد من إلغاء تفعيل حساب الوالد؟' : 'Êtes-vous sûr de vouloir désactiver le compte parent ?',
      isRTL ? 'تأكيد الإلغاء' : 'Confirmer la désactivation',
      { type: 'danger', confirmText: isRTL ? 'إلغاء التفعيل' : 'Désactiver', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );

    if (!confirmed) return;

    try {
      setActionLoading(child.id);

      // Appel API pour désactiver le parent
      const response = await api.put(`/api/children/${child.id}/deactivate-parent`);

      if (response.data?.success) {
        dialog.success(isRTL ? 'تم إلغاء تفعيل حساب الوالد بنجاح' : 'Compte parent désactivé avec succès');
        loadChildren(); // Recharger la liste
      } else {
        throw new Error(response.data?.error || (isRTL ? 'خطأ في إلغاء التفعيل' : 'Erreur lors de la désactivation'));
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
      dialog.error(isRTL ? 'خطأ في إلغاء تفعيل الحساب' : 'Erreur lors de la désactivation du compte');
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour supprimer (archiver) un enfant
  const handleDelete = async (childId) => {
    const child = children.find(c => c.id === childId);
    if (!child) return;

    // Première confirmation : archiver l'enfant
    const confirmed = await dialog.confirm(
      isRTL
        ? `هل أنت متأكد من حذف ${child.first_name} ${child.last_name || ''}؟ سيتم أرشفة الطفل.`
        : `Êtes-vous sûr de vouloir archiver ${child.first_name} ${child.last_name || ''} ? L'enfant sera désactivé mais ses données seront conservées.`,
      isRTL ? 'تأكيد الحذف' : 'Confirmer l\'archivage',
      { type: 'danger', confirmText: isRTL ? 'حذف' : 'Archiver', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );

    if (!confirmed) return;

    try {
      setActionLoading(childId);

      // Archiver l'enfant avec option de désactiver le parent si c'est le dernier enfant
      // Note: Axios DELETE avec body nécessite la clé 'data'
      const requestData = {
        reason: 'Archivé via dashboard',
        checkParentDeactivation: true
      };
      console.log('📤 Envoi DELETE avec body:', requestData);
      const response = await api.delete(`/api/children/${childId}`, {
        data: requestData
      });
      console.log('📥 Réponse DELETE:', response.data);

      if (response.data?.success) {
        // Si le parent n'a plus d'enfants actifs, proposer de le désactiver
        if (response.data?.parentHasNoOtherChildren && response.data?.parentId) {
          const parentName = response.data.parentName || 'le parent';
          const deactivateParent = await dialog.confirm(
            isRTL
              ? `${parentName} ليس لديه أطفال آخرين. هل تريد إلغاء تفعيل حسابه؟`
              : `${parentName} n'a plus d'autres enfants actifs. Voulez-vous désactiver son compte ?`,
            isRTL ? 'إلغاء تفعيل الحساب' : 'Désactiver le compte parent',
            { type: 'warning', confirmText: isRTL ? 'إلغاء التفعيل' : 'Désactiver', cancelText: isRTL ? 'لا' : 'Non' }
          );

          if (deactivateParent) {
            try {
              console.log(`📤 Envoi PUT deactivate-parent pour enfant ${childId}`);
              const deactivateResponse = await api.put(`/api/children/${childId}/deactivate-parent`);
              console.log(`📥 Réponse deactivate-parent:`, deactivateResponse.data);
              dialog.success(isRTL ? 'تم أرشفة الطفل وإلغاء تفعيل حساب الوالد' : 'Enfant archivé et compte parent désactivé');
            } catch (parentError) {
              console.error('❌ Erreur désactivation parent:', parentError);
              console.error('❌ Détails:', parentError.response?.data);
              dialog.error(isRTL ? 'خطأ في إلغاء تفعيل حساب الوالد' : 'Erreur lors de la désactivation du compte parent');
            }
          } else {
            console.log('ℹ️ Utilisateur a choisi de ne pas désactiver le parent');
            dialog.success(isRTL ? 'تم أرشفة الطفل بنجاح' : 'Enfant archivé avec succès');
          }
        } else {
          dialog.success(isRTL ? 'تم أرشفة الطفل بنجاح' : 'Enfant archivé avec succès');
        }
        loadChildren();
      } else {
        throw new Error(response.data?.error || (isRTL ? 'خطأ في الأرشفة' : 'Erreur lors de l\'archivage'));
      }
    } catch (error) {
      console.error('Erreur lors de l\'archivage:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في أرشفة الطفل' : 'Erreur lors de l\'archivage de l\'enfant'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonctions de gestion de la suspension (mise en pause)
  const handleOpenSuspend = (child) => {
    setSuspendingChild(child);
    setSuspendReasonCategory('Retard de paiement');
    setSuspendReasonDetails('');
    setSuspendExpectedReturnDate('');
    setShowSuspendModal(true);
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingChild) return;
    try {
      setSuspendLoading(true);
      const fullReason = suspendReasonDetails.trim()
        ? `${suspendReasonCategory} - ${suspendReasonDetails.trim()}`
        : suspendReasonCategory;

      const res = await childrenService.suspendChild(suspendingChild.id, {
        reason: fullReason,
        expected_return_date: suspendExpectedReturnDate || null
      });

      if (res?.success) {
        dialog.success(
          isRTL
            ? `تم تعليق حضور ${suspendingChild.first_name} مؤقتاً`
            : `${suspendingChild.first_name} mis en pause temporaire avec succès`
        );
        setShowSuspendModal(false);
        setSuspendingChild(null);
        if (selectedChild?.id === suspendingChild.id) {
          setSelectedChild(prev => ({
            ...prev,
            status: 'suspended',
            suspension_reason: fullReason,
            expected_return_date: suspendExpectedReturnDate || null,
            suspended_at: new Date().toISOString()
          }));
        }
        loadChildren();
      } else {
        throw new Error(res?.error || 'Erreur lors de la suspension');
      }
    } catch (err) {
      console.error('Erreur suspension:', err);
      dialog.error(err.response?.data?.error || err.message || (isRTL ? 'خطأ أثناء التعليق' : 'Erreur lors de la mise en pause'));
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleReactivateChild = async (child) => {
    const confirmed = await dialog.confirm(
      isRTL
        ? `هل تريد استئناف حضور ${child.first_name} ${child.last_name || ''} وإعادته إلى قائمة الحضور اليومي؟`
        : `Voulez-vous réactiver ${child.first_name} ${child.last_name || ''} et le réintégrer dans la liste de présence quotidienne ?`,
      isRTL ? 'تأكيد استئناف الحضور' : 'Confirmer la réactivation',
      { type: 'info', confirmText: isRTL ? 'استئناف' : 'Réactiver', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );
    if (!confirmed) return;

    try {
      setActionLoading(child.id);
      const res = await childrenService.reactivateChild(child.id);
      if (res?.success) {
        dialog.success(
          isRTL
            ? `تم استئناف حضور ${child.first_name} بنجاح`
            : `${child.first_name} a été réactivé avec succès`
        );
        if (selectedChild?.id === child.id) {
          setSelectedChild(prev => ({
            ...prev,
            status: 'active',
            is_active: true,
            suspension_reason: null,
            expected_return_date: null,
            suspended_at: null
          }));
        }
        loadChildren();
      } else {
        throw new Error(res?.error || 'Erreur lors de la réactivation');
      }
    } catch (err) {
      console.error('Erreur réactivation:', err);
      dialog.error(err.response?.data?.error || err.message || (isRTL ? 'خطأ أثناء التفعيل' : 'Erreur lors de la réactivation'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour sauvegarder les modifications d'un enfant
  const handleSaveChild = async (e) => {
    e.preventDefault();

    if (!selectedChild) return;

    // Si l'utilisateur n'a le droit de modifier que la photo (pas de droits contacts)
    if (canEditOnlyPhoto || (!canManageEmergencyPhone && !userIsAdmin)) {
      dialog.success(isRTL ? 'تم حفظ التعديلات بنجاح' : 'Modifications enregistrées avec succès');
      setShowEditModal(false);
      setSelectedChild(null);
      setEditFormData({});
      setSelectedPhotoFile(null);
      loadChildren();
      return;
    }

    try {
      setActionLoading('save');

      // Préparer le payload en incluant les champs de contact autorisés
      const payload = {};
      if (canManageEmergencyPhone || userIsAdmin) {
        if (editFormData.parent_email !== undefined) {
          payload.parent_email = editFormData.parent_email.trim();
        }
        if (editFormData.parent_phone !== undefined) {
          payload.parent_phone = editFormData.parent_phone.trim();
        }
        if (editFormData.second_parent_phone !== undefined) {
          payload.second_parent_phone = editFormData.second_parent_phone.trim();
        }
        if (editFormData.second_parent_name !== undefined) {
          payload.second_parent_name = editFormData.second_parent_name.trim();
        }
        if (editFormData.emergency_contact_name !== undefined) {
          payload.emergency_contact_name = editFormData.emergency_contact_name.trim();
        }
        if (editFormData.emergency_contact_phone !== undefined) {
          payload.emergency_contact_phone = editFormData.emergency_contact_phone.trim();
        }
      }

      if (Object.keys(payload).length > 0) {
        const response = await childrenService.updateChild(selectedChild.id, payload);

        if (!response.success) {
          dialog.error(response.error || (isRTL ? 'خطأ في التحديث' : 'Erreur lors de la mise à jour'));
          return;
        }
      }

      dialog.success(isRTL ? 'تم تحديث بيانات الطفل بنجاح' : 'Informations de l\'enfant mises à jour avec succès');

      // Fermer le modal
      setShowEditModal(false);
      setSelectedChild(null);
      setEditFormData({});
      setSelectedPhotoFile(null);

      // Recharger la liste des enfants
      loadChildren();
    } catch (error) {
      console.error('Erreur sauvegarde enfant:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour mettre à jour les données du formulaire
  const handleFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour voir un document
  const handleViewDocument = async (document) => {
    try {
      await documentService.viewDocument(document);
      // Pas de notification pour l'ouverture (action silencieuse)
    } catch (error) {
      dialog.error(isRTL ? 'خطأ في فتح الوثيقة' : 'Erreur lors de l\'ouverture');
    }
  };

  // Fonction pour télécharger un document
  const handleDownloadDocument = async (document) => {
    try {
      await documentService.downloadDocument(document);
      // Pas de notification pour le téléchargement (action silencieuse)
    } catch (error) {
      dialog.error(isRTL ? 'خطأ في تحميل الوثيقة' : 'Erreur lors du téléchargement');
    }
  };

  // Fonction pour approuver un enfant
  const handleApproveChild = async (child) => {
    const confirmed = await dialog.confirm(
      isRTL ? 'هل أنت متأكد من قبول هذا الطلب؟' : 'Êtes-vous sûr d\'approuver cette demande ?',
      isRTL ? 'تأكيد القبول' : 'Confirmer l\'approbation',
      { type: 'info', confirmText: isRTL ? 'قبول' : 'Approuver', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );

    if (!confirmed) return;

    try {
      setActionLoading('approve');
      const response = await approvalService.approveChild(child.id);

      if (response.success) {
        dialog.success(isRTL ? 'تم قبول الطلب بنجاح' : 'Demande approuvée avec succès');

        // Mettre à jour l'enfant sélectionné
        setSelectedChild(prev => ({ ...prev, status: 'approved' }));

        // Recharger la liste
        loadChildren();
      } else {
        dialog.error(response.error || (isRTL ? 'خطأ في القبول' : 'Erreur lors de l\'approbation'));
      }
    } catch (error) {
      console.error('Erreur approbation:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion'));
    } finally {
      setActionLoading(null);
    }
  };

  // Fonction pour rejeter un enfant
  const handleRejectChild = async (child) => {
    const confirmed = await dialog.confirm(
      isRTL ? 'هل تريد رفض طلب هذا الطفل؟' : 'Voulez-vous rejeter la demande de cet enfant ?',
      isRTL ? 'تأكيد الرفض' : 'Confirmer le rejet',
      { type: 'danger', confirmText: isRTL ? 'رفض' : 'Rejeter', cancelText: isRTL ? 'إلغاء' : 'Annuler' }
    );

    if (!confirmed) return; // Utilisateur a annulé
    const reason = '';

    try {
      setActionLoading('reject');
      const response = await approvalService.rejectChild(child.id, reason);

      if (response.success) {
        dialog.success(isRTL ? 'تم رفض الطلب' : 'Demande rejetée');

        // Mettre à jour l'enfant sélectionné
        setSelectedChild(prev => ({ ...prev, status: 'rejected' }));

        // Recharger la liste
        loadChildren();
      } else {
        dialog.error(response.error || (isRTL ? 'خطأ في الرفض' : 'Erreur lors du rejet'));
      }
    } catch (error) {
      console.error('Erreur rejet:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في الاتصال' : 'Erreur de connexion'));
    } finally {
      setActionLoading(null);
    }
  };


  // Fonction pour ouvrir le modal d'association parent
  const handleAssociateParent = async (child) => {
    try {
      setSelectedChild(child);
      setShowAssociateModal(true);

      // Charger la liste des parents
      const response = await userService.getAllUsers({ role: 'parent' });
      console.log('Parents response:', response);
      if (response.users) {
        setParents(response.users);
      } else if (response.data?.users) {
        setParents(response.data.users);
      }
    } catch (error) {
      console.error('Erreur chargement parents:', error);
      dialog.error(isRTL ? 'خطأ في تحميل قائمة الأولياء' : 'Erreur lors du chargement des parents');
    }
  };

  // Fonction pour associer un enfant à un parent
  const handleConfirmAssociation = async () => {
    if (!selectedParentId || !selectedChild) {
      dialog.error(isRTL ? 'يرجى اختيار ولي أمر' : 'Veuillez sélectionner un parent');
      return;
    }

    try {
      setActionLoading('associate');
      const response = await childrenService.associateChildToParent(selectedChild.id, selectedParentId);

      if (response.success) {
        dialog.success(isRTL ? 'تم ربط الطفل بولي الأمر بنجاح' : 'Enfant associé au parent avec succès');
        setShowAssociateModal(false);
        setSelectedChild(null);
        setSelectedParentId('');
        loadChildren(); // Recharger la liste
      }
    } catch (error) {
      console.error('Erreur association:', error);
      dialog.error(error.response?.data?.error || (isRTL ? 'خطأ في الربط' : 'Erreur lors de l\'association'));
    } finally {
      setActionLoading(null);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);

    // Calcul précis mois par mois
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    // Ajustement si les jours sont négatifs
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }

    // Ajustement si les mois sont négatifs
    if (months < 0) {
      years--;
      months += 12;
    }

    // Pour les très jeunes enfants (moins de 1 mois)
    if (years === 0 && months === 0) {
      return isRTL ? `${days} يوم` : `${days} jour${days > 1 ? 's' : ''}`;
    }

    // Pour les enfants de moins d'un an
    if (years === 0) {
      if (days === 0) {
        return isRTL ? `${months} شهر` : `${months} mois`;
      }
      return isRTL ? `${months} شهر و ${days} يوم` : `${months} mois et ${days} jour${days > 1 ? 's' : ''}`;
    }

    // Pour les enfants de plus d'un an
    if (months === 0) {
      return isRTL ? `${years} سنة` : `${years} an${years > 1 ? 's' : ''}`;
    }

    return isRTL ? `${years} سنة و ${months} شهر` : `${years} an${years > 1 ? 's' : ''} et ${months} mois`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 flex-shrink-0 block text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 flex-shrink-0 block text-red-600" />;
      case 'pending':
      default:
        return <AlertCircle className="w-4 h-4 flex-shrink-0 block text-yellow-600" />;
    }
  };

  const getEnrollmentStatus = (status) => {
    switch (status) {
      case 'approved':
        return {
          text: isRTL ? 'مقبول' : 'Inscrit',
          color: 'text-green-800 dark:text-green-200',
          bgColor: 'bg-green-100 dark:bg-green-900'
        };
      case 'pending':
        return {
          text: isRTL ? 'في الانتظار' : 'En attente',
          color: 'text-yellow-800 dark:text-yellow-200',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900'
        };
      case 'rejected':
        return {
          text: isRTL ? 'مرفوض' : 'Rejeté',
          color: 'text-red-800 dark:text-red-200',
          bgColor: 'bg-red-100 dark:bg-red-900'
        };
      default:
        return {
          text: isRTL ? 'غير محدد' : 'Non défini',
          color: 'text-gray-800 dark:text-gray-200',
          bgColor: 'bg-gray-100 dark:bg-gray-900'
        };
    }
  };

  // Liste des éléments manquants dans le dossier de l'enfant
  // (ex: aucun parent associé, carnet de santé / infos médicales absentes, contact d'urgence manquant)
  const getMissingDossierItems = (child) => {
    const items = [];

    if (!child.parent_first_name) {
      items.push(isRTL ? 'لم يتم ربط ولي أمر بعد' : 'Aucun parent associé');
    }

    if (!child.medical_info) {
      items.push(isRTL ? 'الكرنيه الصحي / المعلومات الطبية غير مكتملة' : 'Carnet de santé / infos médicales manquantes');
    }

    if (!child.emergency_contact_name || !child.emergency_contact_phone) {
      items.push(isRTL ? 'جهة اتصال في حالات الطوارئ غير مكتملة' : 'Contact d\'urgence manquant');
    }

    return items;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved':
        return isRTL ? 'مقبول' : 'Inscrit';
      case 'rejected':
        return isRTL ? 'مرفوض' : 'Rejeté';
      case 'pending':
      default:
        return isRTL ? 'في الانتظار' : 'En attente';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
      default:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    }
  };

  const getAttendanceStatus = (attendance) => {
    if (attendance.status === 'present') {
      return {
        text: isRTL ? 'حاضر' : 'Présent',
        color: 'text-green-600',
        bgColor: 'bg-green-100 dark:bg-green-900'
      };
    } else if (attendance.status === 'absent') {
      return {
        text: isRTL ? 'غائب' : 'Absent',
        color: 'text-red-600',
        bgColor: 'bg-red-100 dark:bg-red-900'
      };
    } else {
      return {
        text: isRTL ? 'غير مسجل' : 'Non inscrit',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100 dark:bg-gray-900'
      };
    }
  };

  // Les données sont déjà filtrées côté serveur via l'API

  // Version Desktop loading
  if (!isMobile && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <>
          <MobileChildrenList
            children={children}
            groups={[]} // À connecter avec l'API des groupes si disponible
            loading={loading}
            onViewChild={(child) => handleViewChild(child)}
            onEditChild={(child) => handleEditChild(child)}
            onDeleteChild={(child) => handleDelete(child.id)}
            onAddChild={() => navigate('/dashboard/add-child')}
            onRefresh={() => loadChildren()}
          />
          <MobileNavigation />
        </>
      ) : (
        <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRTL ? 'إدارة الأطفال' : 'Gestion des enfants'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {isRTL
                ? `${children.length} طفل`
                : `${children.length} enfants`
              }
            </p>
          </div>

          <div className="flex gap-2 mt-4 sm:mt-0">
            {(isAdmin() || isStaff()) && (
              <div className="flex gap-2">
                <Button asChild>
                  <Link to="/dashboard/add-child">
                    <Plus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                    {isRTL ? 'إضافة طفل' : 'Ajouter enfant'}
                  </Link>
                </Button>
                {isStaff() && (
                  <Button asChild variant="outline">
                    <Link to="/dashboard/add-child?personal=true">
                      <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                      {isRTL ? 'إضافة طفلي' : 'Mon enfant'}
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={isRTL ? 'البحث في الأطفال...' : 'Rechercher des enfants...'}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchLoading && (
                <div className="absolute right-3 rtl:right-auto rtl:left-3 top-1/2 transform -translate-y-1/2">
                  <RefreshCw className="w-4 h-4 text-primary-500 animate-spin" />
                </div>
              )}
            </div>


            {/* Filtre par statut */}
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium"
            >
              <option value="all_enrolled">{isRTL ? 'جميع المسجلين (نشطين ومعلقين)' : 'Tous les inscrits (actifs & suspendus)'}</option>
              <option value="active">{isRTL ? 'نشطين فقط' : 'Actifs uniquement'}</option>
              <option value="suspended">{isRTL ? 'معلقين (في استراحة)' : 'Suspendus (en pause)'}</option>
              <option value="archived">{isRTL ? 'مؤرشفين' : 'Archivés'}</option>
            </select>

            {/* Filtre par âge */}
            <select
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">{isRTL ? 'جميع الأعمار' : 'Tous les âges'}</option>
              <option value="infant">{isRTL ? 'رضع (2-11 شهر)' : 'Nourrissons (2-11 mois)'}</option>
              <option value="toddler">{isRTL ? 'أطفال صغار (1-2 سنة)' : 'Tout-petits (1-2 ans)'}</option>
              <option value="young">{isRTL ? 'أطفال (2-3 سنوات)' : 'Jeunes enfants (2-3 ans)'}</option>
            </select>

            {/* Bouton de réinitialisation */}
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all_enrolled');
                setFilterAge('all');
                setCurrentPage(1);
              }}
            >
              <Filter className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'إعادة تعيين' : 'Réinitialiser'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des enfants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 gap-6">
        {children.map((child) => {
          // Valeur par défaut pour attendance_today si pas présente
          const attendanceToday = child.attendance_today || { status: 'absent', check_in: null, check_out: null };
          const attendanceStatus = getAttendanceStatus(attendanceToday);
          // Utiliser 'approved' par défaut car on filtre déjà les enfants approuvés
          const enrollmentStatus = getEnrollmentStatus('approved');
          const missingDossierItems = getMissingDossierItems(child);
          const isDossierComplete = missingDossierItems.length === 0;

          return (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0 flex-1">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {getChildPhotoUrl(child.photo_url) ? (
                          <img
                            src={getChildPhotoUrl(child.photo_url)}
                            alt={`${child.first_name} ${child.last_name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Baby className="w-5 h-5 xs:w-6 xs:h-6 text-primary-600 dark:text-primary-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base xs:text-lg truncate">
                          {child.first_name} {child.last_name}
                        </CardTitle>
                        <CardDescription className="text-xs xs:text-sm">
                          {calculateAge(child.birth_date)} • {child.gender === 'male' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 rtl:space-x-reverse flex-shrink-0 relative">
                      {child.status === 'suspended' ? (
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm"
                          title={child.suspension_reason ? `${isRTL ? 'السبب:' : 'Motif :'} ${child.suspension_reason}` : undefined}
                        >
                          <PauseCircle className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-amber-600 dark:text-amber-400" />
                          <span>{isRTL ? 'معلق (استراحة)' : 'Suspendu (en pause)'}</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${enrollmentStatus.color} ${enrollmentStatus.bgColor} ${!isDossierComplete ? 'cursor-pointer' : ''}`}
                          title={!isDossierComplete ? (isRTL ? 'دوسيه غير مكتمل - انقر للتفاصيل' : 'Dossier incomplet - cliquez pour voir le détail') : undefined}
                          onClick={!isDossierComplete ? (e) => {
                            e.stopPropagation();
                            setMissingInfoOpenId(prev => prev === child.id ? null : child.id);
                          } : undefined}
                        >
                          {isDossierComplete ? getStatusIcon('approved') : getStatusIcon('pending')}
                          <span className="ml-1 rtl:ml-0 rtl:mr-1">{enrollmentStatus.text}</span>
                        </span>
                      )}

                      {!isDossierComplete && missingInfoOpenId === child.id && (
                        <div
                          ref={missingInfoPopoverRef}
                          className="absolute top-full right-0 rtl:right-auto rtl:left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-[60]"
                        >
                          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-yellow-600" />
                            {isRTL ? 'الدوسيه غير مكتمل' : 'Dossier incomplet'}
                          </p>
                          <ul className="space-y-1">
                            {missingDossierItems.map((item, idx) => (
                              <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                                <span className="w-1 h-1 mt-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Présence aujourd'hui ou statut suspendu */}
                    {child.status === 'suspended' ? (
                      <div className="p-2.5 xs:p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0">
                          <span className="text-xs xs:text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            {isRTL ? 'حضور معلق مؤقتاً' : 'Présence suspendue temporairement'}
                          </span>
                          <span className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-full self-start xs:self-auto">
                            {isRTL ? 'خارج قائمة النداء' : 'Exclu de l\'appel'}
                          </span>
                        </div>
                        {child.suspension_reason && (
                          <div className="mt-1.5 text-xs text-amber-800 dark:text-amber-300">
                            <span className="font-medium">{isRTL ? 'السبب:' : 'Motif :'}</span> {child.suspension_reason}
                          </div>
                        )}
                        {child.expected_return_date && (
                          <div className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                            <span className="font-medium">{isRTL ? 'العودة المتوقعة:' : 'Retour prévu :'}</span> {new Date(child.expected_return_date).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`p-2 xs:p-3 rounded-lg ${attendanceStatus.bgColor}`}>
                        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-0">
                          <span className="text-xs xs:text-sm font-medium text-gray-900 dark:text-white">
                            {isRTL ? 'الحضور اليوم:' : 'Présence aujourd\'hui:'}
                          </span>
                          <span className={`text-xs xs:text-sm font-medium ${attendanceStatus.color}`}>
                            {attendanceStatus.text}
                          </span>
                        </div>
                        {attendanceToday.check_in && (
                          <div className="flex flex-col xs:flex-row xs:items-center xs:space-x-4 rtl:xs:space-x-reverse gap-1 xs:gap-0 mt-2 text-xs xs:text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <Clock className="w-3 h-3" />
                              <span>{isRTL ? 'الوصول:' : 'Arrivée:'} {attendanceToday.check_in}</span>
                            </div>
                            {attendanceToday.check_out && (
                              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                                <Clock className="w-3 h-3" />
                                <span>{isRTL ? 'المغادرة:' : 'Départ:'} {attendanceToday.check_out}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informations parent */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 xs:p-3">
                      <h4 className="text-sm xs:text-base font-medium text-gray-900 dark:text-white mb-2">
                        {isRTL ? 'معلومات الولي' : 'Informations parent'}
                      </h4>
                      <div className="space-y-1 text-xs xs:text-sm text-gray-600 dark:text-gray-400">
                        {child.parent_first_name ? (
                          <>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <User className="w-3 h-3" />
                              <span>{child.parent_first_name} {child.parent_last_name}</span>
                            </div>
                            <div className="flex items-center space-x-2 rtl:space-x-reverse">
                              <Phone className="w-3 h-3 text-gray-400" />
                              {(!isAdmin() && (child.parent_phone_restricted || !can(FEATURES.PARENTS_PHONE_VIEW))) ? (
                                <span className="text-gray-400 dark:text-gray-500 italic flex items-center gap-1 text-xs" dir="ltr">
                                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                                  <span>••••••••</span>
                                </span>
                              ) : child.parent_phone ? (
                                <a
                                  href={`tel:${child.parent_phone}`}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                  dir="ltr"
                                >
                                  {child.parent_phone}
                                </a>
                              ) : (
                                <span dir="ltr" className={isRTL ? 'text-right' : 'text-left'}>
                                  {isRTL ? 'غير محدد' : 'Non spécifié'}
                                </span>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-gray-500">
                              {isRTL ? 'لا يوجد ولي أمر مسجل' : 'Aucun parent enregistré'}
                            </div>
                            {isAdmin() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAssociateParent(child)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <UserPlus className="w-3 h-3 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'ربط ولي أمر' : 'Associer parent'}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informations médicales */}
                    <div className="text-xs xs:text-sm">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {isRTL ? 'معلومات طبية:' : 'Infos médicales:'}
                      </span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {child.medical_info || (isRTL ? 'لا توجد معلومات طبية' : 'Aucune information médicale')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Button size="sm" variant="outline" onClick={() => handleViewChild(child)} className="flex-shrink-0">
                        <Eye className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                        <span className="hidden xs:inline">{isRTL ? 'عرض' : 'Voir'}</span>
                        <span className="xs:hidden">{isRTL ? 'عرض' : 'Voir'}</span>
                      </Button>

                      {(isAdmin() || isStaff()) && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEditChild(child)} className="flex-shrink-0">
                            <Edit className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                            <span className="hidden xs:inline">{isRTL ? 'تعديل' : 'Modifier'}</span>
                            <span className="xs:hidden">{isRTL ? 'تعديل' : 'Mod.'}</span>
                          </Button>

                          {isAdmin() && child.status === 'suspended' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivateChild(child)}
                              disabled={actionLoading === child.id}
                              className="text-emerald-700 border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 flex-shrink-0"
                              title={isRTL ? 'استئناف الحضور' : 'Réactiver l\'enfant'}
                            >
                              <Play className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 fill-emerald-600 text-emerald-600" />
                              <span className="hidden xs:inline">{isRTL ? 'استئناف' : 'Réactiver'}</span>
                              <span className="xs:hidden">{isRTL ? 'استئناف' : 'Réact.'}</span>
                            </Button>
                          )}


                          {isAdmin() && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(child.id)}
                              disabled={actionLoading === child.id}
                              className="flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1" />
                              <span className="hidden xs:inline">{isRTL ? 'حذف' : 'Supprimer'}</span>
                              <span className="xs:hidden">{isRTL ? 'حذف' : 'Supp.'}</span>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Message si aucun résultat */}
      {children.length === 0 && (
        <div className="text-center py-12">
          <Baby className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isRTL ? 'لا توجد أطفال' : 'Aucun enfant trouvé'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL
              ? 'لا توجد أطفال مطابقة لمعايير البحث'
              : 'Aucun enfant ne correspond aux critères de recherche'
            }
          </p>
        </div>
      )}
        </div>
      )}

      {/* Modal d'association parent */}
      {showAssociateModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {isRTL ? 'ربط ولي أمر' : 'Associer un parent'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'الطفل' : 'Enfant'}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {selectedChild.first_name} {selectedChild.last_name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {calculateAge(selectedChild.birth_date)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRTL ? 'اختر ولي الأمر' : 'Sélectionner un parent'}
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">
                    {isRTL ? 'اختر ولي أمر...' : 'Sélectionner un parent...'}
                  </option>
                  {parents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.first_name} {parent.last_name} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedParentId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {isRTL
                      ? 'سيتم ربط هذا الطفل بولي الأمر المحدد. يمكن لولي الأمر بعد ذلك رؤية معلومات الطفل في حسابه.'
                      : 'Cet enfant sera associé au parent sélectionné. Le parent pourra alors voir les informations de l\'enfant dans son compte.'
                    }
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowAssociateModal(false);
                  setSelectedChild(null);
                  setSelectedParentId('');
                }}
                variant="outline"
                className="flex-1"
                disabled={actionLoading === 'associate'}
              >
                {isRTL ? 'إلغاء' : 'Annuler'}
              </Button>
              <Button
                onClick={handleConfirmAssociation}
                disabled={!selectedParentId || actionLoading === 'associate'}
                className="flex-1"
              >
                {actionLoading === 'associate' ? (
                  <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                )}
                {actionLoading === 'associate' ?
                  (isRTL ? 'جاري الربط...' : 'Association...') :
                  (isRTL ? 'ربط' : 'Associer')
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualisation d'enfant */}
      {selectedChild && !showAssociateModal && !showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="p-6">
              {/* En-tête du modal */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? 'تفاصيل الطفل' : "Détails de l'enfant"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedChild.first_name} {selectedChild.last_name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin() && selectedChild.status !== 'suspended' && selectedChild.is_active !== false && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const childToSuspend = selectedChild;
                        setSelectedChild(null);
                        handleOpenSuspend(childToSuspend);
                      }}
                      className="text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700 text-xs shadow-sm"
                    >
                      <PauseCircle className="w-3.5 h-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-amber-600" />
                      {isRTL ? 'تعليق الحضور' : 'Suspendre'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full w-8 h-8 p-0 border-gray-200 dark:border-gray-700"
                    onClick={() => {
                      setSelectedChild(null);
                      setChildDocuments([]);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Bannière de suspension */}
              {selectedChild.status === 'suspended' && (
                <div className="mb-5 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <PauseCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-sm">
                          {isRTL ? 'هذا الطفل معلق حالياً (في استراحة)' : 'Cet enfant est actuellement suspendu (en pause)'}
                        </span>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                          {isRTL ? 'مستبعد تلقائياً من قائمة الحضور اليومي.' : 'Il est exclu automatiquement de la liste d\'appel des présences.'}
                        </p>
                      </div>
                    </div>
                    {isAdmin() && (
                      <Button
                        size="sm"
                        onClick={() => handleReactivateChild(selectedChild)}
                        disabled={actionLoading === selectedChild.id}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5 rtl:mr-0 rtl:ml-1.5 fill-white" />
                        {isRTL ? 'استئناف الحضور' : 'Réactiver l\'enfant'}
                      </Button>
                    )}
                  </div>
                  {(selectedChild.suspension_reason || selectedChild.expected_return_date) && (
                    <div className="mt-3 pt-2.5 border-t border-amber-200/80 dark:border-amber-800 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedChild.suspension_reason && (
                        <div>
                          <span className="font-semibold">{isRTL ? 'السبب:' : 'Motif :'}</span> {selectedChild.suspension_reason}
                        </div>
                      )}
                      {selectedChild.expected_return_date && (
                        <div>
                          <span className="font-semibold">{isRTL ? 'العودة المتوقعة:' : 'Date de retour prévue :'}</span> {new Date(selectedChild.expected_return_date).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-5">
                {/* 1. IDENTITÉ DE L'ENFANT */}
                <div className="bg-slate-50 dark:bg-gray-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-lg">
                        <Baby className="w-5 h-5" />
                      </span>
                      <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                        {isRTL ? 'هوية الطفل' : "Identité de l'enfant"}
                      </h4>
                    </div>
                    {selectedChild.status === 'suspended' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                        {isRTL ? 'معلق (استراحة)' : 'Suspendu (en pause)'}
                      </span>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedChild.is_active !== false 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {selectedChild.is_active !== false ? (isRTL ? 'نشط' : 'Actif') : (isRTL ? 'غير نشط' : 'Inactif')}
                      </span>
                    )}
                  </div>

                  {/* Photo & Grille identité */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-24 h-24 rounded-full flex-shrink-0 bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center overflow-hidden border-2 border-primary-200 dark:border-primary-700 shadow-sm">
                      {getChildPhotoUrl(selectedChild.photo_url) ? (
                        <img
                          src={getChildPhotoUrl(selectedChild.photo_url)}
                          alt={`${selectedChild.first_name} ${selectedChild.last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Baby className="w-12 h-12 text-primary-500 dark:text-primary-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'الاسم الأول' : 'Prénom'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">{selectedChild.first_name || '-'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'اسم العائلة' : 'Nom de famille'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">{selectedChild.last_name || '-'}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'الجنس' : 'Genre'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                          {selectedChild.gender === 'male' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                          {selectedChild.birth_date ? new Date(selectedChild.birth_date).toLocaleDateString() : (isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)')}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'العمر' : 'Âge'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                          {selectedChild.birth_date ? calculateAge(selectedChild.birth_date) : (isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)')}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'فصيلة الدم' : 'Groupe sanguin'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                          {selectedChild.blood_type ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              {selectedChild.blood_type}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'الاسم الكامل للأب' : 'Nom complet père'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                          {selectedChild.father_name || (
                            <span className="text-gray-400 italic text-xs">{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                          )}
                        </p>
                      </div>
                      <div className="bg-white dark:bg-gray-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-gray-700/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{isRTL ? 'الاسم الكامل للأم' : 'Nom complet mère'}</p>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">
                          {selectedChild.mother_name || (
                            <span className="text-gray-400 italic text-xs">{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. DÉTAILS DES PARENTS ET CONTACTS */}
                {(() => {
                  const parentIsFather = selectedChild.parent_gender === 'male';
                  const firstParentRole = parentIsFather ? (isRTL ? 'الأب' : 'Père') : (isRTL ? 'الأم' : 'Mère');
                  const secondParentRole = parentIsFather ? (isRTL ? 'الأم' : 'Mère') : (isRTL ? 'الأب' : 'Père');

                  // Contacts de confiance (max 2)
                  const trustedList = Array.isArray(selectedChild.trusted_contacts)
                    ? selectedChild.trusted_contacts
                    : (typeof selectedChild.trusted_contacts === 'string'
                        ? (() => { try { return JSON.parse(selectedChild.trusted_contacts); } catch { return []; } })()
                        : []);

                  // Détection d'un contact d'urgence personnalisé ou désigné
                  const isEmergencyFather = selectedChild.emergency_contact_choice === 'father';
                  const isEmergencyMother = selectedChild.emergency_contact_choice === 'mother';

                  let emergencyDisplayName = selectedChild.emergency_contact_name;
                  let emergencyDisplayPhone = selectedChild.emergency_contact_phone;

                  if (isEmergencyFather) {
                    emergencyDisplayName = isRTL ? 'الأب (أولوية الطوارئ)' : 'Père (Priorité d\'urgence)';
                    emergencyDisplayPhone = parentIsFather ? selectedChild.parent_phone : selectedChild.second_parent_phone;
                  } else if (isEmergencyMother) {
                    emergencyDisplayName = isRTL ? 'الأم (أولوية الطوارئ)' : 'Mère (Priorité d\'urgence)';
                    emergencyDisplayPhone = !parentIsFather ? selectedChild.parent_phone : selectedChild.second_parent_phone;
                  }

                  return (
                    <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-5 border border-blue-200/70 dark:border-blue-900/40 shadow-sm">
                      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-blue-200/60 dark:border-blue-900/40">
                        <span className="p-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Users className="w-5 h-5" />
                        </span>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                          {isRTL ? 'الأولياء ووسائل الاتصال' : 'Parents & Moyens de contact'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1er parent (titulaire du compte) */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                {firstParentRole} : {isRTL ? '(صاحب الحساب)' : '(Titulaire)'}
                              </span>
                            </div>
                            {selectedChild.parent_first_name ? (
                              <div className="space-y-2 text-sm">
                                <p className="font-semibold text-gray-900 dark:text-white text-base my-1">
                                  {selectedChild.parent_first_name} {selectedChild.parent_last_name}
                                </p>
                                <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                                  {/* Email parent */}
                                  {(!isAdmin() && (selectedChild.parent_email_restricted || !can(FEATURES.PARENTS_EMAIL_VIEW))) ? (
                                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                      <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                      <span>{isRTL ? 'محمي (خاص بالإدارة)' : '•••••••• (Confidentiel)'}</span>
                                    </p>
                                  ) : (selectedChild.parent_email && !isNoEmail(selectedChild.parent_email)) ? (
                                    <a
                                      href={`mailto:${selectedChild.parent_email}`}
                                      className="text-primary-600 dark:text-primary-400 hover:underline text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                                      dir="ltr"
                                      title={isRTL ? 'إرسال بريد إلكتروني' : 'Envoyer un email'}
                                    >
                                      <Mail className="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />
                                      <span className="truncate">{selectedChild.parent_email}</span>
                                    </a>
                                  ) : (
                                    <p className="text-amber-600 dark:text-amber-400 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                      <Mail className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                      <span>{isRTL ? 'بدون بريد إلكتروني' : 'Sans adresse email'}</span>
                                    </p>
                                  )}

                                  {/* Téléphone parent */}
                                  {(!isAdmin() && (selectedChild.parent_phone_restricted || !can(FEATURES.PARENTS_PHONE_VIEW))) ? (
                                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                      <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                      <span>{isRTL ? 'محمي (خاص بالإدارة)' : '•••••••• (Confidentiel)'}</span>
                                    </p>
                                  ) : selectedChild.parent_phone ? (
                                    <a
                                      href={`tel:${selectedChild.parent_phone}`}
                                      className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:underline text-xs flex items-center gap-1.5 transition-colors font-medium"
                                      dir="ltr"
                                    >
                                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
                                      <span>{selectedChild.parent_phone}</span>
                                    </a>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                      <span>{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic py-2 text-center">
                                {isRTL ? 'لا يوجد ولي مسجل (RS)' : 'Aucun parent associé (R.S)'}
                              </p>
                            )}
                          </div>

                          {/* Actions rapides appel / SMS 1er parent */}
                          {(isAdmin() || can(FEATURES.PARENTS_PHONE_VIEW)) && selectedChild.parent_phone && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-300 text-green-700 dark:text-green-300 hover:bg-green-50 text-xs flex-1"
                                onClick={() => window.location.href = `tel:${selectedChild.parent_phone}`}
                              >
                                <Phone className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'اتصال' : 'Appeler'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-xs flex-1"
                                onClick={() => window.location.href = `sms:${selectedChild.parent_phone}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                                SMS
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* 2ème parent */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                {secondParentRole} : {isRTL ? '(الطرف الثاني)' : '(2ème parent)'}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              {selectedChild.second_parent_name && (
                                <p className="font-semibold text-gray-900 dark:text-white text-base my-1">
                                  {selectedChild.second_parent_name}
                                </p>
                              )}
                              <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                                {(!isAdmin() && !can(FEATURES.PARENTS_PHONE_VIEW)) ? (
                                  <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                    <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                    <span>{isRTL ? 'محمي (خاص بالإدارة)' : '•••••••• (Confidentiel)'}</span>
                                  </p>
                                ) : selectedChild.second_parent_phone ? (
                                  <a
                                    href={`tel:${selectedChild.second_parent_phone}`}
                                    className="text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:underline text-xs flex items-center gap-1.5 transition-colors font-medium"
                                    dir="ltr"
                                  >
                                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
                                    <span>{selectedChild.second_parent_phone}</span>
                                  </a>
                                ) : (
                                  <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                    <span>{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action appel 2ème parent */}
                          {(isAdmin() || can(FEATURES.PARENTS_PHONE_VIEW)) && selectedChild.second_parent_phone && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-blue-300 text-blue-700 dark:text-blue-300 hover:bg-blue-50 text-xs"
                                onClick={() => window.location.href = `tel:${selectedChild.second_parent_phone}`}
                              >
                                <Phone className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'اتصال' : 'Appeler'}
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Contact d'urgence */}
                        <div className="bg-white dark:bg-gray-800/90 rounded-xl p-4 border border-orange-100 dark:border-orange-900/30 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wider">
                                {isRTL ? 'جهة اتصال الطوارئ' : "Contact d'urgence"}
                              </span>
                            </div>
                            <div className="space-y-2 text-sm">
                              <p className="font-semibold text-gray-900 dark:text-white text-base my-1">
                                {emergencyDisplayName || (
                                  <span className="text-gray-400 italic text-xs">{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                                )}
                              </p>
                              <div className="space-y-1.5 pt-1 border-t border-gray-100 dark:border-gray-700/60">
                                {emergencyDisplayName ? (
                                  (!isAdmin() && (selectedChild.emergency_contact_restricted || !can(FEATURES.PARENTS_PHONE_VIEW))) ? (
                                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                      <Lock className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                      <span>{isRTL ? 'محمي (خاص بالإدارة)' : '•••••••• (Confidentiel)'}</span>
                                    </p>
                                  ) : emergencyDisplayPhone ? (
                                    <a
                                      href={`tel:${emergencyDisplayPhone}`}
                                      className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:underline text-xs flex items-center gap-1.5 transition-colors font-medium"
                                      dir="ltr"
                                    >
                                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                                      <span>{emergencyDisplayPhone}</span>
                                    </a>
                                  ) : (
                                    <p className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5 italic" dir="ltr">
                                      <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                      <span>{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                                    </p>
                                  )
                                ) : (
                                  <p className="text-gray-400 dark:text-gray-500 text-xs italic py-1">
                                    {isRTL
                                      ? 'في حالات الطوارئ، يرجى الاتصال بالأولياء'
                                      : 'En cas d\'urgence, contacter les parents ci-contre.'}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {(isAdmin() || can(FEATURES.PARENTS_PHONE_VIEW)) && emergencyDisplayPhone && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-700 dark:text-red-300 hover:bg-red-50 text-xs flex-1"
                                onClick={() => window.location.href = `tel:${emergencyDisplayPhone}`}
                              >
                                <Phone className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                                {isRTL ? 'اتصال' : 'Appeler'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-xs flex-1"
                                onClick={() => window.location.href = `sms:${emergencyDisplayPhone}`}
                              >
                                <MessageSquare className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                                SMS
                              </Button>
                            </div>
                          )}

                          {(!isAdmin() && (selectedChild.emergency_contact_restricted || !can(FEATURES.PARENTS_PHONE_VIEW))) && (
                            <div className="mt-3 pt-3 border-t border-orange-100 dark:border-orange-900/30">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full border-blue-400 dark:border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs flex items-center justify-center gap-1.5 font-medium transition-colors"
                                onClick={() => {
                                  const targetPhone = selectedChild.director_phone || selectedChild.admin_phone || directorPhone || '+216 25 95 35 32';
                                  window.location.href = `tel:${targetPhone}`;
                                }}
                              >
                                <Phone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>{isRTL ? 'الاتصال بالإدارة (المدير)' : "Appeler directeur"}</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Personnes de confiance (max 2) - Visible pour toute l'équipe */}
                      <div className="mt-4 pt-4 border-t border-blue-200/60 dark:border-blue-900/40">
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 uppercase tracking-wider">
                            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            {isRTL ? 'أشخاص ثقة مصرح لهم باستلام الطفل (2 كحد أقصى)' : 'Personnes de confiance autorisées à récupérer l\'enfant (max 2)'}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium">
                            {trustedList.length} / 2
                          </span>
                        </div>
                        {trustedList.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {trustedList.slice(0, 2).map((tc, idx) => {
                              const tcName = typeof tc === 'string' ? tc : (tc.name || '');
                              const tcPhone = typeof tc === 'object' ? tc.phone : null;
                              return (
                                <div key={idx} className="bg-white dark:bg-gray-800/90 rounded-xl p-3 border border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                      {tcName}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                      {isRTL ? 'مصرح له بالاستلام' : 'Autorisé(e) à récupérer l\'enfant'}
                                    </span>
                                    {tcPhone && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" dir="ltr">
                                        {tcPhone}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic text-center py-2 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            {isRTL ? 'لا توجد أشخاص ثقة مسجلة (الاستلام مقتصر على الأولياء فقط)' : 'Aucune personne de confiance enregistrée (seuls les parents sont habilités)'}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. SANTÉ ET SUIVI MÉDICAL (AVEC CONTRÔLE D'ACCÈS) */}
                {(() => {
                  const isRestricted = !canViewMedical || selectedChild.medical_restricted || selectedChild.can_view_medical === false;
                  const allergiesList = parseAllergies(selectedChild.allergies);
                  const treatmentsList = Array.isArray(selectedChild.treatments) ? selectedChild.treatments : [];

                  return (
                    <div className="bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl p-5 border border-emerald-200/70 dark:border-emerald-900/40 shadow-sm">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-emerald-200/60 dark:border-emerald-900/40">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
                            <Stethoscope className="w-5 h-5" />
                          </span>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                            {isRTL ? 'الصحة والمتابعة الطبية' : 'Santé & Suivi Médical'}
                          </h4>
                        </div>
                        {isRestricted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <Lock className="w-3 h-3" />
                            {isRTL ? 'محمي ومحجوب' : 'Accès Restreint'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <ShieldCheck className="w-3 h-3" />
                            {isRTL ? 'مصرح به' : 'Accès Autorisé'}
                          </span>
                        )}
                      </div>

                      {isRestricted ? (
                        /* Vue Masquée pour utilisateurs non autorisés */
                        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-5 border border-amber-200/80 dark:border-amber-900/40 text-center">
                          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Lock className="w-6 h-6" />
                          </div>
                          <h5 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                            {isRTL ? 'المعلومات الطبية محجوبة' : 'Données médicales protégées'}
                          </h5>
                          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                            {isRTL 
                              ? 'لا تملك الصلاحية الكافية للاطلاع على الملف الصحي، الحساسية والعلاجات لهذا الطفل (الصلاحية المطلوبة: medical.view).'
                              : "Vous ne disposez pas des autorisations requises pour consulter le dossier de santé, les allergies et les traitements de cet enfant (permission requise : Consultation médicale)."
                            }
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                              <p className="font-semibold">{isRTL ? 'الطبيب' : 'Médecin'}</p>
                              <p className="tracking-widest">••••••••</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                              <p className="font-semibold">{isRTL ? 'الحساسية' : 'Allergies'}</p>
                              <p className="tracking-widest">••••••••</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                              <p className="font-semibold">{isRTL ? 'العلاجات' : 'Traitements'}</p>
                              <p className="tracking-widest">••••••••</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                              <p className="font-semibold">{isRTL ? 'ملاحظات' : 'Notes'}</p>
                              <p className="tracking-widest">••••••••</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Vue Détaillée Claire pour utilisateurs autorisés */
                        <div className="space-y-3.5">
                          {/* Médecin traitant & Téléphone */}
                          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
                                  {isRTL ? 'الطبيب المتابع' : 'Médecin traitant'}
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {selectedChild.doctor_name || (
                                    <span className="text-gray-400 italic text-xs">{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
                                  {isRTL ? 'هاتف الطبيب' : 'Téléphone du médecin'}
                                </p>
                                {selectedChild.doctor_phone ? (
                                  <a 
                                    href={`tel:${selectedChild.doctor_phone}`}
                                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5"
                                    dir="ltr"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    {selectedChild.doctor_phone}
                                  </a>
                                ) : (
                                  <span className="text-gray-400 italic text-xs">{isRTL ? 'غير محدد (RS)' : 'Non renseigné (R.S)'}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Allergies & Régimes */}
                          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                              {isRTL ? 'الحساسية والمحاذير الغذائية' : 'Allergies & Régimes alimentaires'}
                            </p>
                            {allergiesList.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {allergiesList.map((allergy, idx) => (
                                  <span 
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  >
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {isRTL ? 'لا توجد حساسية مسجلة (RS)' : 'R.S (Aucune allergie renseignée)'}
                              </p>
                            )}
                          </div>

                          {/* Notes médicales */}
                          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                {isRTL ? 'ملاحظات وتوجيهات طبية' : 'Notes & Informations médicales'}
                              </p>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/30">
                                {isRTL ? 'قريباً (طبيب معتمد)' : 'Prochainement (Rôle Doctor)'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                              {isRTL
                                ? 'غير محدد (RS) — خاص بالطبيب المعتمد عند تفعيل حساب Doctor.'
                                : 'Non renseigné (R.S) — Espace réservé aux avis et suivis du médecin conventionné (prochainement avec le rôle Doctor).'
                              }
                            </p>
                          </div>

                          {/* Traitements en cours */}
                          <div className="bg-white dark:bg-gray-800/90 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-emerald-600" />
                              {isRTL ? 'العلاجات الطبية' : 'Traitements médicaux'}
                            </p>
                            {treatmentsList.length > 0 ? (
                              <div className="space-y-2">
                                {treatmentsList.map((t, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 text-xs">
                                    <div>
                                      <span className="font-semibold text-gray-900 dark:text-white">{t.medication_name}</span>
                                      <span className="text-gray-500 dark:text-gray-400 ml-2">({t.dosage})</span>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                      t.status === 'active' 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                      {t.status === 'active' ? (isRTL ? 'ساري' : 'En cours') : t.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                {isRTL ? 'لا توجد علاجات حالية (RS)' : 'R.S (Aucun traitement en cours)'}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Pied du modal */}
              <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button onClick={() => {
                  setSelectedChild(null);
                  setChildDocuments([]);
                }}>
                  {isRTL ? 'إغلاق' : 'Fermer'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition d'enfant */}
      {showEditModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {canEditOnlyPhoto
                    ? (isRTL ? 'تعديل صورة الملف الشخصي للطفل' : 'Modifier la photo de profil de l\'enfant')
                    : (isRTL ? 'تعديل وسائل الاتصال والأولياء' : 'Modifier les moyens de contact')}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedChild(null);
                    setSelectedPhotoFile(null);
                  }}
                >
                  ✕
                </Button>
              </div>

              <form className="space-y-6" onSubmit={handleSaveChild}>
                {/* 1. Photo de profil */}
                <div className="bg-gray-50 dark:bg-gray-700/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  {(isAdmin() || can(FEATURES.CHILDREN_PHOTOS_MANAGE)) ? (
                    <>
                      <CompactImageUpload
                        currentImage={selectedChild.photo_url}
                        selectedFile={selectedPhotoFile}
                        imageKey={photoImageKey}
                        onImageSelect={(file) => {
                          setSelectedPhotoFile(file);
                          if (file) handleUploadPhoto(file);
                        }}
                      />
                      {selectedChild.photo_url && (
                        <div className="flex justify-center mt-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={handleDeletePhoto}
                            disabled={photoActionLoading}
                          >
                            <Trash className="w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1" />
                            {isRTL ? 'حذف الصورة' : 'Supprimer la photo'}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        {getChildPhotoUrl(selectedChild.photo_url) ? (
                          <img
                            src={getChildPhotoUrl(selectedChild.photo_url)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Baby className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{isRTL ? 'تعديل الصورة مخصص للمخولين فقط' : 'Modification de photo réservée'}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {isRTL
                            ? 'تتطلب هذه العملية صلاحية إدارة صور الأطفال (children.photos.manage)'
                            : 'Requiert la permission d\'administration des photos d\'enfants'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Identité de l'enfant (LECTURE SEULE) */}
                <div className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                      <Baby className="w-4 h-4 text-primary-500" />
                      {isRTL ? 'هوية الطفل (قراءة فقط)' : 'Identité de l\'enfant (lecture seule)'}
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                      {isRTL ? 'غير قابلة للتعديل' : 'Dossier civil fixe'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/60">
                      <span className="text-gray-500 dark:text-gray-400 block">{isRTL ? 'الاسم واللقب' : 'Nom complet'}</span>
                      <span className="font-medium text-gray-900 dark:text-white mt-0.5 block truncate">
                        {selectedChild.first_name} {selectedChild.last_name}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/60">
                      <span className="text-gray-500 dark:text-gray-400 block">{isRTL ? 'الجنس' : 'Genre'}</span>
                      <span className="font-medium text-gray-900 dark:text-white mt-0.5 block">
                        {selectedChild.gender === 'male' ? (isRTL ? 'ذكر' : 'Garçon') : (isRTL ? 'أنثى' : 'Fille')}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/60">
                      <span className="text-gray-500 dark:text-gray-400 block">{isRTL ? 'تاريخ الميلاد' : 'Date de naissance'}</span>
                      <span className="font-medium text-gray-900 dark:text-white mt-0.5 block">
                        {selectedChild.birth_date ? new Date(selectedChild.birth_date).toLocaleDateString() : '-'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700/60">
                      <span className="text-gray-500 dark:text-gray-400 block">{isRTL ? 'العمر' : 'Âge'}</span>
                      <span className="font-medium text-gray-900 dark:text-white mt-0.5 block">
                        {selectedChild.birth_date ? calculateAge(selectedChild.birth_date) : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Section Parents & Moyens de contact (MODIFIABLE PAR LA DIRECTION) */}
                {(canManageEmergencyPhone || isAdmin()) ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700 pb-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      {isRTL ? 'الأولياء ووسائل الاتصال' : 'Parents & Moyens de contact'}
                    </h4>

                    {/* Email du parent titulaire */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        <Mail className="inline w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-primary-500" />
                        {isRTL ? 'البريد الإلكتروني للولي صاحب الحساب' : 'Email du parent titulaire du compte'}
                      </label>
                      <input
                        type="email"
                        value={editFormData.parent_email || ''}
                        onChange={(e) => handleFormChange('parent_email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="parent@exemple.com"
                        dir="ltr"
                      />
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                        {isRTL ? 'يتيح استبدال البريد المؤقت أو تحديث بريد تسجيل الدخول للولي' : 'Permet de remplacer l\'email provisoire ou de corriger l\'adresse de connexion du parent.'}
                      </p>
                    </div>

                    {/* Téléphone 1er parent & 2ème parent */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Phone className="inline w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-green-500" />
                          {selectedChild.parent_gender === 'male' 
                            ? (isRTL ? 'هاتف الأب (الولي الأول)' : 'Téléphone 1er parent (Père)') 
                            : (isRTL ? 'هاتف الأم (الولي الأول)' : 'Téléphone 1er parent (Mère)')
                          }
                        </label>
                        <input
                          type="tel"
                          value={editFormData.parent_phone || ''}
                          onChange={(e) => handleFormChange('parent_phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          placeholder="+216 00 000 000"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Phone className="inline w-3.5 h-3.5 mr-1 rtl:mr-0 rtl:ml-1 text-blue-500" />
                          {selectedChild.parent_gender === 'male' 
                            ? (isRTL ? 'هاتف الأم (الولي الثاني)' : 'Téléphone 2ème parent (Mère)') 
                            : (isRTL ? 'هاتف الأب (الولي الثاني)' : 'Téléphone 2ème parent (Père)')
                          }
                        </label>
                        <input
                          type="tel"
                          value={editFormData.second_parent_phone || ''}
                          onChange={(e) => handleFormChange('second_parent_phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                          placeholder="+216 00 000 000"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Contact d'urgence (Nom complet + Téléphone) */}
                    <div className="bg-orange-50/50 dark:bg-orange-950/20 p-3.5 rounded-xl border border-orange-200/60 dark:border-orange-900/40">
                      <h5 className="font-semibold text-gray-900 dark:text-white text-xs mb-2.5 flex items-center gap-1.5 uppercase tracking-wider text-orange-800 dark:text-orange-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                        {isRTL ? 'جهة اتصال الطوارئ (شخص بديل)' : 'Contact d\'urgence (personne de recours)'}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isRTL ? 'الاسم الكامل لجهة الاتصال' : 'Nom complet du contact'}
                          </label>
                          <input
                            type="text"
                            value={editFormData.emergency_contact_name || ''}
                            onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            placeholder={isRTL ? 'الاسم واللقب' : 'Ex: Grand-mère, Oncle...'}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {isRTL ? 'رقم الهاتف' : 'Numéro de téléphone'}
                          </label>
                          <input
                            type="tel"
                            value={editFormData.emergency_contact_phone || ''}
                            onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                            placeholder="+216 00 000 000"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3.5 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        {isRTL ? 'بيانات الاتصال محمية' : 'Coordonnées protégées'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isRTL
                        ? 'تعديل وسائل الاتصال متاح فقط للمدير والإدارة المخولة.'
                        : 'La modification des moyens de contact est réservée à la direction.'}
                    </p>
                  </div>
                )}

                {/* Option de suspension - Uniquement pour l'admin */}
                {isAdmin() && selectedChild.status !== 'suspended' && selectedChild.is_active !== false && (
                  <div className="pt-3 border-t border-amber-200 dark:border-amber-900/50 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-xl">
                    <div>
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                        {isRTL ? 'إيقاف الحضور مؤقتاً (تعليق)' : 'Suspendre temporairement l\'enfant'}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                        {isRTL ? 'خاص بالإدارة فقط. يستبعد الطفل من قائمة النداء اليومي.' : 'Réservé à l\'administration. Exclut l\'enfant du pointage quotidien.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const childToSuspend = selectedChild;
                        setShowEditModal(false);
                        handleOpenSuspend(childToSuspend);
                      }}
                      className="text-amber-700 border-amber-300 bg-white hover:bg-amber-100 dark:bg-gray-800 dark:text-amber-300 dark:border-amber-700 text-xs shadow-sm flex-shrink-0"
                    >
                      <PauseCircle className="w-4 h-4 mr-1 rtl:mr-0 rtl:ml-1 text-amber-600" />
                      {isRTL ? 'تعليق الحضور' : 'Suspendre'}
                    </Button>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedChild(null);
                      setEditFormData({});
                      setSelectedPhotoFile(null);
                    }}
                    variant="outline"
                    className="flex-1"
                    disabled={actionLoading === 'save'}
                  >
                    {isRTL ? 'إلغاء' : 'Annuler'}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={actionLoading === 'save'}
                  >
                    {actionLoading === 'save' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 animate-spin" />
                        {isRTL ? 'جاري الحفظ...' : 'Sauvegarde...'}
                      </>
                    ) : canEditOnlyPhoto ? (
                      isRTL ? 'إغلاق وحفظ' : 'Terminer'
                    ) : (
                      isRTL ? 'حفظ التغييرات' : 'Sauvegarder'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suspension d'un enfant */}
      {showSuspendModal && suspendingChild && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
                  <PauseCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {isRTL ? 'تعليق حضور طفل' : 'Mettre l\'enfant en pause'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {suspendingChild.first_name} {suspendingChild.last_name}
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 mb-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40 leading-relaxed">
                ℹ️ {isRTL 
                  ? 'سيتم استبعاد الطفل من لائحة الحضور والغياب اليومية مع الحفاظ الكامل على ملفه. يمكنك استئناف حضوره بنقرة واحدة في أي وقت.'
                  : 'L\'enfant sera exclu de la liste d\'appel quotidienne tout en conservant son dossier intact. Vous pourrez le réactiver en un clic dès son retour.'}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'سبب التعليق' : 'Motif principal *'}
                  </label>
                  <select
                    value={suspendReasonCategory}
                    onChange={(e) => setSuspendReasonCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="Retard de paiement">{isRTL ? 'تأخر في الدفع' : 'Retard de paiement'}</option>
                    <option value="Voyage / Absence familiale">{isRTL ? 'سفر / غياب عائلي' : 'Voyage / Absence familiale'}</option>
                    <option value="Raison médicale prolongée">{isRTL ? 'سبب صحي مطول' : 'Raison médicale prolongée'}</option>
                    <option value="Pause demandée par les parents">{isRTL ? 'طلب من الوالدين' : 'Pause demandée par les parents'}</option>
                    <option value="Autre motif">{isRTL ? 'سبب آخر' : 'Autre motif'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'تفاصيل إضافية (اختياري)' : 'Précisions / Notes internes (optionnel)'}
                  </label>
                  <textarea
                    rows={2}
                    value={suspendReasonDetails}
                    onChange={(e) => setSuspendReasonDetails(e.target.value)}
                    placeholder={isRTL ? 'ملاحظة خاصة بالإدارة...' : 'Ex: Accord verbal pour reprise le mois prochain...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    {isRTL ? 'تاريخ العودة المتوقع (اختياري)' : 'Date de retour prévue (optionnel)'}
                  </label>
                  <input
                    type="date"
                    value={suspendExpectedReturnDate}
                    onChange={(e) => setSuspendExpectedReturnDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendingChild(null);
                  }}
                  disabled={suspendLoading}
                >
                  {isRTL ? 'إلغاء' : 'Annuler'}
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmSuspend}
                  disabled={suspendLoading}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {suspendLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <PauseCircle className="w-4 h-4 mr-2" />
                  )}
                  {isRTL ? 'تأكيد التعليق' : 'Suspendre l\'enfant'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChildrenPage;
