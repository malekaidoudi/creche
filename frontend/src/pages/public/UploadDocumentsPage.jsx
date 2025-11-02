import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useLanguage } from '../../hooks/useLanguage';

export default function UploadDocumentsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  
  const enrollmentId = searchParams.get('enrollment');
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData();
      Object.entries(files).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      
      await api.post(`/api/enrollments/${enrollmentId}/documents`, formData);
      setSuccess(true);
      toast.success('Documents téléchargés !');
      setTimeout(() => navigate('/'), 3000);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Succès !</h1>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">Télécharger les documents</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['carnet_medical', 'acte_naissance', 'certificat_medical'].map(key => (
            <div key={key}>
              <label className="block mb-2 font-medium">{key.replace('_', ' ')}</label>
              <input
                type="file"
                onChange={(e) => setFiles({...files, [key]: e.target.files[0]})}
                className="w-full"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white py-3 rounded-lg"
          >
            {loading ? 'Chargement...' : 'Télécharger'}
          </button>
        </form>
      </div>
    </div>
  );
}
