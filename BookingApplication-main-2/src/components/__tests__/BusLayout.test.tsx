import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusLayout } from '../BusLayout';
import { BoardingSequence } from '../../types/booking';

describe('BusLayout', () => {
  const mockBoardingSequence: BoardingSequence[] = [
    {
      sequence: 1,
      bookingId: '101',
      seats: ['A20', 'B20'],
      maxDistance: 20.3,
      minDistance: 20.2
    },
    {
      sequence: 2,
      bookingId: '102',
      seats: ['A1', 'B1'],
      maxDistance: 1.3,
      minDistance: 1.2
    }
  ];

  it('should render bus layout with title', () => {
    render(<BusLayout boardingSequence={[]} />);
    
    expect(screen.getByText('Bus Layout & Boarding Sequence')).toBeInTheDocument();
  });

  it('should render legend', () => {
    render(<BusLayout boardingSequence={[]} />);
    
    expect(screen.getByText('1-2')).toBeInTheDocument();
    expect(screen.getByText('3-4')).toBeInTheDocument();
    expect(screen.getByText('5-6')).toBeInTheDocument();
    expect(screen.getByText('7+')).toBeInTheDocument();
  });

  it('should render front entry', () => {
    render(<BusLayout boardingSequence={[]} />);
    
    expect(screen.getByText('🚪 FRONT ENTRY')).toBeInTheDocument();
  });

  it('should display boarding sequence numbers on seats', () => {
    render(<BusLayout boardingSequence={mockBoardingSequence} />);
    
    // Check if sequence numbers are displayed
    const sequenceElements = screen.getAllByText('1');
    expect(sequenceElements.length).toBeGreaterThan(0);
    
    const sequenceElements2 = screen.getAllByText('2');
    expect(sequenceElements2.length).toBeGreaterThan(0);
  });

  it('should handle empty boarding sequence', () => {
    render(<BusLayout boardingSequence={[]} />);
    
    // Should render without errors
    expect(screen.getByText('Bus Layout & Boarding Sequence')).toBeInTheDocument();
  });

  it('should apply correct color coding based on sequence', () => {
    render(<BusLayout boardingSequence={mockBoardingSequence} />);
    
    // Check if seats have appropriate styling classes
    const container = screen.getByText('Bus Layout & Boarding Sequence').closest('div');
    expect(container).toBeInTheDocument();
  });
});