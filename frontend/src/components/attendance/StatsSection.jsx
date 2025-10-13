import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Users, 
  Clock, 
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

const StatsSection = ({ stats, attendanceData }) => {
  const { isRTL } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Filtrer les données selon la période sélectionnée
  const getFilteredData = () => {
    if (!attendanceData || attendanceData.length === 0) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return attendanceData.filter(record => {
      // Utiliser la date de l'enregistrement ou extraire de check_in_time
      let recordDate;
      
      if (record.date) {
        recordDate = new Date(record.date);
      } else if (record.check_in_time) {
        // Extraire la date de check_in_time
        recordDate = new Date(record.check_in_time);
      } else {
        // Si pas de date ni check_in_time, utiliser aujourd'hui par défaut
        recordDate = new Date();
      }
      
      // Vérifier que la date est valide
      if (isNaN(recordDate.getTime())) {
        return false;
      }
      
      switch (selectedPeriod) {
        case 'week':
          // Cette semaine (lundi à dimanche)
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay() + 1);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          return recordDate >= startOfWeek && recordDate <= endOfWeek;
          
        case 'month':
          // Ce mois
          return recordDate.getMonth() === now.getMonth() && 
                 recordDate.getFullYear() === now.getFullYear();
                 
        case 'year':
          // Cette année
          return recordDate.getFullYear() === now.getFullYear();
          
        default:
          return true;
      }
    });
  };

  const filteredData = getFilteredData();

  // Calculer les statistiques avancées
  const calculateAdvancedStats = () => {
    if (!filteredData || filteredData.length === 0) {
      return {
        averagePresence: 0,
        punctualityRate: 0,
        averageStayDuration: 0,
        mostActiveDay: '-',
        topPerformers: []
      };
    }

    // Taux de présence moyen
    const totalRecords = filteredData.length;
    const presentRecords = filteredData.filter(r => r.check_in_time).length;
    const averagePresence = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Taux de ponctualité (arrivée avant 9h)
    const punctualRecords = filteredData.filter(r => {
      if (!r.check_in_time) return false;
      const checkInHour = new Date(r.check_in_time).getHours();
      return checkInHour < 9;
    }).length;
    const punctualityRate = presentRecords > 0 ? Math.round((punctualRecords / presentRecords) * 100) : 0;

    // Durée moyenne de séjour
    const completedRecords = filteredData.filter(r => r.check_in_time && r.check_out_time);
    const totalDuration = completedRecords.reduce((sum, r) => {
      if (!r.check_in_time || !r.check_out_time) return sum;
      
      const checkIn = new Date(r.check_in_time);
      const checkOut = new Date(r.check_out_time);
      
      // Vérifier que les dates sont valides
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return sum;
      
      const duration = (checkOut - checkIn) / (1000 * 60 * 60);
      return sum + (duration > 0 ? duration : 0);
    }, 0);
    const averageStayDuration = completedRecords.length > 0 && totalDuration > 0 ? 
      Math.round((totalDuration / completedRecords.length) * 10) / 10 : 0;

    // Jour le plus actif
    const dayStats = {};
    filteredData.forEach(r => {
      if (r.check_in_time) {
        const day = new Date(r.check_in_time).toLocaleDateString();
        dayStats[day] = (dayStats[day] || 0) + 1;
      }
    });
    const mostActiveDay = Object.keys(dayStats).reduce((a, b) => 
      dayStats[a] > dayStats[b] ? a : b, '-'
    );

    // Top performers (enfants les plus assidus)
    const childStats = {};
    filteredData.forEach(r => {
      if (r.child && r.check_in_time) {
        const childId = r.child.id;
        const childName = `${r.child.first_name} ${r.child.last_name}`;
        if (!childStats[childId]) {
          childStats[childId] = { name: childName, count: 0 };
        }
        childStats[childId].count++;
      }
    });
    const topPerformers = Object.values(childStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      averagePresence,
      punctualityRate,
      averageStayDuration,
      mostActiveDay,
      topPerformers
    };
  };

  const advancedStats = calculateAdvancedStats();

  // Données pour le graphique simple (simulation)
  const weeklyData = [
    { day: isRTL ? 'الإثنين' : 'Lun', present: 12, absent: 3 },
    { day: isRTL ? 'الثلاثاء' : 'Mar', present: 14, absent: 1 },
    { day: isRTL ? 'الأربعاء' : 'Mer', present: 13, absent: 2 },
    { day: isRTL ? 'الخميس' : 'Jeu', present: 15, absent: 0 },
    { day: isRTL ? 'الجمعة' : 'Ven', present: 11, absent: 4 },
  ];

  return (
    <div className="space-y-6">
      {/* Sélecteur de période */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isRTL ? 'إحصائيات الحضور' : 'Statistiques de présence'}
            </h3>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="week">{isRTL ? 'هذا الأسبوع' : 'Cette semaine'}</option>
              <option value="month">{isRTL ? 'هذا الشهر' : 'Ce mois'}</option>
              <option value="year">{isRTL ? 'هذا العام' : 'Cette année'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'معدل الحضور' : 'Taux de présence'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {advancedStats.averagePresence}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'معدل الالتزام بالوقت' : 'Ponctualité'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {advancedStats.punctualityRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'متوسط ساعات البقاء' : 'Durée moyenne'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {advancedStats.averageStayDuration}h
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-3 rtl:ml-0 rtl:mr-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {isRTL ? 'إجمالي الأطفال' : 'Total enfants'}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.total || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique de présence hebdomadaire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
            {isRTL ? 'الحضور الأسبوعي' : 'Présence hebdomadaire'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.map((day, index) => {
              const total = day.present + day.absent;
              const presentPercentage = total > 0 ? (day.present / total) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-16 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {day.day}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {day.present} {isRTL ? 'حاضر' : 'présents'} / {total} {isRTL ? 'إجمالي' : 'total'}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {Math.round(presentPercentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${presentPercentage}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'الأطفال الأكثر التزاماً' : 'Enfants les plus assidus'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {advancedStats.topPerformers.length === 0 ? (
              <div className="text-center py-8">
                <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {isRTL ? 'لا توجد بيانات كافية' : 'Pas assez de données'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {advancedStats.topPerformers.map((child, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {child.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {child.count} {isRTL ? 'يوم' : 'jours'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertes et recommandations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {isRTL ? 'تنبيهات وتوصيات' : 'Alertes et recommandations'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advancedStats.averagePresence < 80 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start space-x-2 rtl:space-x-reverse">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 dark:text-red-300">
                        {isRTL ? 'معدل حضور منخفض' : 'Taux de présence faible'}
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-400">
                        {isRTL ? 'معدل الحضور أقل من 80%. يُنصح بمتابعة الأسباب.' : 'Le taux de présence est inférieur à 80%. Il est recommandé de suivre les causes.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {advancedStats.punctualityRate < 70 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start space-x-2 rtl:space-x-reverse">
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        {isRTL ? 'تحسين الالتزام بالوقت' : 'Améliorer la ponctualité'}
                      </h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        {isRTL ? 'معدل الالتزام بالوقت يمكن تحسينه. تذكير الأهالي بأوقات الوصول.' : 'Le taux de ponctualité peut être amélioré. Rappeler aux parents les heures d\'arrivée.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {advancedStats.averagePresence >= 90 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start space-x-2 rtl:space-x-reverse">
                    <Award className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                        {isRTL ? 'أداء ممتاز!' : 'Excellent performance !'}
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {isRTL ? 'معدل حضور ممتاز. استمروا في العمل الرائع!' : 'Excellent taux de présence. Continuez ce travail formidable !'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatsSection;
