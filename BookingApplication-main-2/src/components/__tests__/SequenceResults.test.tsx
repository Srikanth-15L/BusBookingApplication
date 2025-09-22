import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SequenceResults } from '../SequenceResults';
import { BoardingSequence } from '../../types/booking';

describe('SequenceResults', () => {
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

  const mockEfficiency = {
    averageDistance: 10.8,
    blockingPotential: 5.2,
    optimalityScore: 85.5
  };

  it('should render title', () => {
    render(<SequenceResults boardingSequence={mockBoardingSequence} />);
    
    expect(screen.getByText('Optimal Boarding Sequence')).toBeInTheDocument();
  });

  it('should display summary statistics', () => {
    render(<SequenceResults boardingSequence={mockBoardingSequence} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total bookings
    expect(screen.getByText('4')).toBeInTheDocument(); // Total passengers (2 seats each)
    expect(screen.getByText('Optimized')).toBeInTheDocument();
  });

  it('should display efficiency metrics when provided', () => {
    render(
      <SequenceResults 
        boardingSequence={mockBoardingSequence} 
        efficiency={mockEfficiency} 
      />
    );
    
    expect(screen.getByText('10.8')).toBeInTheDocument(); // Average distance
    expect(screen.getByText('5.2')).toBeInTheDocument(); // Blocking potential
    expect(screen.getByText('86%')).toBeInTheDocument(); // Optimality score (rounded)
  });

  it('should render boarding sequence table', () => {
    render(<SequenceResults boardingSequence={mockBoardingSequence} />);
    
    // Check table headers
    expect(screen.getByText('Sequence')).toBeInTheDocument();
    expect(screen.getByText('Booking ID')).toBeInTheDocument();
    expect(screen.getByText('Seats')).toBeInTheDocument();
    expect(screen.getByText('Max Distance')).toBeInTheDocument();
    
    // Check table data
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('102')).toBeInTheDocument();
    expect(screen.getByText('A20')).toBeInTheDocument();
    expect(screen.getByText('B20')).toBeInTheDocument();
    expect(screen.getByText('20.3')).toBeInTheDocument();
  });

  it('should display algorithm explanation', () => {
    render(<SequenceResults boardingSequence={mockBoardingSequence} />);
    
    expect(screen.getByText('Boarding Algorithm')).toBeInTheDocument();
    expect(screen.getByText(/Advanced algorithm using priority queues/)).toBeInTheDocument();
  });

  it('should handle empty boarding sequence', () => {
    render(<SequenceResults boardingSequence={[]} />);
    
    expect(screen.getByText('Optimal Boarding Sequence')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Total bookings should be 0
  });

  it('should calculate correct passenger count for multi-seat bookings', () => {
    const multiSeatBooking: BoardingSequence[] = [
      {
        sequence: 1,
        bookingId: '101',
        seats: ['A1', 'B1', 'C1', 'D1'], // 4 seats
        maxDistance: 1.3,
        minDistance: 1.0
      }
    ];

    render(<SequenceResults boardingSequence={multiSeatBooking} />);
    
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 booking
    expect(screen.getByText('4')).toBeInTheDocument(); // 4 passengers
  });
});