import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RatingButtons } from './RatingButtons'
import { Rating } from '../lib/fsrs'

// Mock telegram haptic
vi.mock('../lib/telegram', () => ({
  hapticFeedback: vi.fn(),
}))

const mockIntervals = {
  [Rating.Again]: '<1m',
  [Rating.Hard]: '6m',
  [Rating.Good]: '1d',
  [Rating.Easy]: '3d',
}

describe('RatingButtons', () => {
  it('renders all 4 buttons when visible', () => {
    render(<RatingButtons intervals={mockIntervals} onRate={vi.fn()} visible={true} />)
    expect(screen.getByText('Again')).toBeInTheDocument()
    expect(screen.getByText('Hard')).toBeInTheDocument()
    expect(screen.getByText('Good')).toBeInTheDocument()
    expect(screen.getByText('Easy')).toBeInTheDocument()
  })

  it('renders nothing when not visible', () => {
    const { container } = render(
      <RatingButtons intervals={mockIntervals} onRate={vi.fn()} visible={false} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when intervals is null', () => {
    const { container } = render(
      <RatingButtons intervals={null} onRate={vi.fn()} visible={true} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows interval labels', () => {
    render(<RatingButtons intervals={mockIntervals} onRate={vi.fn()} visible={true} />)
    expect(screen.getByText('<1m')).toBeInTheDocument()
    expect(screen.getByText('1d')).toBeInTheDocument()
  })

  it('calls onRate with correct rating on click', () => {
    const onRate = vi.fn()
    render(<RatingButtons intervals={mockIntervals} onRate={onRate} visible={true} />)

    fireEvent.click(screen.getByText('Good'))
    expect(onRate).toHaveBeenCalledWith(Rating.Good)

    fireEvent.click(screen.getByText('Again'))
    expect(onRate).toHaveBeenCalledWith(Rating.Again)
  })
})
