import { render, screen } from '@testing-library/react'
import { Users } from 'lucide-react'
import StatsCard from '../../components/ui/StatsCard'

describe('StatsCard', () => {
  const defaultProps = {
    title: 'Total Users',
    value: '150',
    icon: Users,
    color: 'blue'
  }

  test('renders basic stats card', () => {
    render(<StatsCard {...defaultProps} />)
    
    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  test('renders with trend data', () => {
    const props = {
      ...defaultProps,
      trend: { value: 12, isPositive: true }
    }
    
    render(<StatsCard {...props} />)
    
    expect(screen.getByText('12%')).toBeInTheDocument()
    expect(screen.getByText('vs mois dernier')).toBeInTheDocument()
  })

  test('renders with negative trend', () => {
    const props = {
      ...defaultProps,
      trend: { value: 5, isPositive: false }
    }
    
    render(<StatsCard {...props} />)
    
    expect(screen.getByText('5%')).toBeInTheDocument()
  })

  test('applies correct color classes', () => {
    const { container } = render(<StatsCard {...defaultProps} color="green" />)
    
    const iconContainer = container.querySelector('.text-green-600')
    expect(iconContainer).toBeInTheDocument()
  })
})
