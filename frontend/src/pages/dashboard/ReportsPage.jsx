import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'
import PageHeader from '../../components/ui/PageHeader'
import StatsCard from '../../components/ui/StatsCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { formatSimpleTND } from '../../utils/currency'

const ReportsPage = () => {
  const { t } = useTranslation()
  const { isRTL } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('month')
  const [stats, setStats] = useState({
    totalChildren: 0,
    totalEnrollments: 0,
    attendanceRate: 0,
    revenue: 0
  })

  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    setLoading(true)
    try {
      // Simuler des données pour la démo
      setTimeout(() => {
        setStats({
          totalChildren: 45,
          totalEnrollments: 12,
          attendanceRate: 92,
          revenue: 15750
        })
        
        setChartData([
          { month: 'Jan', enrollments: 8, revenue: 12000 },
          { month: 'Fév', enrollments: 12, revenue: 15000 },
          { month: 'Mar', enrollments: 15, revenue: 18500 },
          { month: 'Avr', enrollments: 10, revenue: 14200 },
          { month: 'Mai', enrollments: 18, revenue: 21000 },
          { month: 'Juin', enrollments: 12, revenue: 15750 }
        ])
        
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Erreur lors du chargement des rapports:', error)
      setLoading(false)
    }
  }

  const exportReport = (format) => {
    // Logique d'export
    console.log(`Export en format ${format}`)
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
        title={isRTL ? 'التقارير والإحصائيات' : 'Rapports & Statistiques'}
        subtitle={isRTL ? 'تحليل شامل لأداء الحضانة' : 'Analyse complète des performances de la crèche'}
      >
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-input w-auto"
          >
            <option value="week">{isRTL ? 'هذا الأسبوع' : 'Cette semaine'}</option>
            <option value="month">{isRTL ? 'هذا الشهر' : 'Ce mois'}</option>
            <option value="quarter">{isRTL ? 'هذا الربع' : 'Ce trimestre'}</option>
            <option value="year">{isRTL ? 'هذه السنة' : 'Cette année'}</option>
          </select>
          
          <button
            onClick={fetchReports}
            className="btn-secondary"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {isRTL ? 'تحديث' : 'Actualiser'}
          </button>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => exportReport('pdf')}
              className="btn-outline-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="btn-outline-primary"
            >
              <Download className="w-4 h-4 mr-2" />
              Excel
            </button>
          </div>
        </div>
      </PageHeader>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={isRTL ? 'إجمالي الأطفال' : 'Total Enfants'}
          value={stats.totalChildren}
          icon={Users}
          color="blue"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title={isRTL ? 'التسجيلات الجديدة' : 'Nouvelles Inscriptions'}
          value={stats.totalEnrollments}
          icon={TrendingUp}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title={isRTL ? 'معدل الحضور' : 'Taux de Présence'}
          value={`${stats.attendanceRate}%`}
          icon={Calendar}
          color="purple"
          trend={{ value: 3, isPositive: true }}
        />
        <StatsCard
          title={isRTL ? 'الإيرادات' : 'Revenus'}
          value={formatSimpleTND(stats.revenue)}
          icon={BarChart3}
          color="yellow"
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique des inscriptions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">
              {isRTL ? 'تطور التسجيلات' : 'Évolution des Inscriptions'}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {isRTL ? 'الرسم البياني سيتم تطبيقه هنا' : 'Graphique à implémenter'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique des revenus */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">
              {isRTL ? 'تطور الإيرادات' : 'Évolution des Revenus'}
            </h3>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  {isRTL ? 'الرسم البياني سيتم تطبيقه هنا' : 'Graphique à implémenter'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tableau détaillé */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold">
            {isRTL ? 'تفاصيل شهرية' : 'Détails Mensuels'}
          </h3>
        </div>
        <div className="card-body">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">
                    {isRTL ? 'الشهر' : 'Mois'}
                  </th>
                  <th className="table-header-cell">
                    {isRTL ? 'التسجيلات' : 'Inscriptions'}
                  </th>
                  <th className="table-header-cell">
                    {isRTL ? 'الإيرادات' : 'Revenus'}
                  </th>
                  <th className="table-header-cell">
                    {isRTL ? 'معدل الحضور' : 'Taux Présence'}
                  </th>
                </tr>
              </thead>
              <tbody className="table-body">
                {chartData.map((item, index) => (
                  <tr key={index}>
                    <td className="table-cell font-medium">{item.month}</td>
                    <td className="table-cell">{item.enrollments}</td>
                    <td className="table-cell">{formatSimpleTND(item.revenue)}</td>
                    <td className="table-cell">
                      <span className="badge-success">
                        {Math.floor(Math.random() * 10) + 85}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage
