import { useLanguage } from '../../hooks/useLanguage'

const PageHeader = ({ 
  title, 
  subtitle, 
  children, 
  className = '' 
}) => {
  const { isRTL } = useLanguage()

  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
        
        {children && (
          <div className="flex flex-col sm:flex-row gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader
