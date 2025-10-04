import { cn } from '../../utils/cn'

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const colorClasses = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-600',
    white: 'border-white',
    gray: 'border-gray-600',
  }

  return (
    <div
      className={cn(
        'loading-spinner',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      {...props}
    />
  )
}

export default LoadingSpinner
