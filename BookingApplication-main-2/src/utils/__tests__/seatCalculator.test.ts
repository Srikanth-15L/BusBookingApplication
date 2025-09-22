import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateSeatDistance,
  parseSeatPosition,
  parseBookingData,
  generateBoardingSequence,
  analyzeBoardingEfficiency
} from '../seatCalculator';

describe('seatCalculator', () => {
  describe('calculateSeatDistance', () => {
    it('should calculate correct distance for seat A1', () => {
      expect(calculateSeatDistance('A1')).toBe(1.3);
    });

    it('should calculate correct distance for seat D20', () => {
      expect(calculateSeatDistance('D20')).toBe(20.0);
    });

    it('should calculate correct distance for seat B10', () => {
      expect(calculateSeatDistance('B10')).toBe(10.2);
    });

    it('should calculate correct distance for seat C5', () => {
      expect(calculateSeatDistance('C5')).toBe(5.1);
    });

    it('should throw error for invalid seat format', () => {
      expect(() => calculateSeatDistance('Z99')).toThrow('Invalid seat format: Z99');
      expect(() => calculateSeatDistance('A')).toThrow('Invalid seat format: A');
      expect(() => calculateSeatDistance('123')).toThrow('Invalid seat format: 123');
    });
  });

  describe('parseSeatPosition', () => {
    it('should parse seat position correctly', () => {
      const position = parseSeatPosition('B15');
      expect(position.row).toBe(15);
      expect(position.column).toBe('B');
      expect(position.distance).toBe(15.2);
    });

    it('should throw error for invalid seat format', () => {
      expect(() => parseSeatPosition('E1')).toThrow('Invalid seat format: E1');
    });
  });

  describe('parseBookingData', () => {
    it('should parse standard tab-separated format', () => {
      const data = `Booking_ID\tSeats
101\tA1,B1
120\tA20,C2`;
      
      const bookings = parseBookingData(data);
      expect(bookings).toHaveLength(2);
      expect(bookings[0]).toEqual({
        bookingId: '101',
        seats: ['A1', 'B1']
      });
      expect(bookings[1]).toEqual({
        bookingId: '120',
        seats: ['A20', 'C2']
      });
    });

    it('should parse CSV format with quotes', () => {
      const data = `Booking_ID,Seats
101,"A1,B1"
120, "A20,C2"`;
      
      const bookings = parseBookingData(data);
      expect(bookings).toHaveLength(2);
      expect(bookings[0]).toEqual({
        bookingId: '101',
        seats: ['A1', 'B1']
      });
      expect(bookings[1]).toEqual({
        bookingId: '120',
        seats: ['A20', 'C2']
      });
    });

    it('should parse space-separated seats', () => {
      const data = `Booking_ID Seats
101 A1 B1
120 A20 C2`;
      
      const bookings = parseBookingData(data);
      expect(bookings).toHaveLength(2);
      expect(bookings[0]).toEqual({
        bookingId: '101',
        seats: ['A1', 'B1']
      });
    });

    it('should handle mixed formats', () => {
      const data = `Booking_ID,Seats
101,"A1,B1"
120 A20,C2
130\tD15,C15`;
      
      const bookings = parseBookingData(data);
      expect(bookings).toHaveLength(3);
      expect(bookings[0].seats).toEqual(['A1', 'B1']);
      expect(bookings[1].seats).toEqual(['A20', 'C2']);
      expect(bookings[2].seats).toEqual(['D15', 'C15']);
    });

    it('should skip empty lines and invalid data', () => {
      const data = `Booking_ID Seats
101 A1,B1

120 A20,C2
invalid line
130 D15,C15`;
      
      const bookings = parseBookingData(data);
      expect(bookings).toHaveLength(3);
    });

    it('should handle duplicate booking IDs', () => {
      const data = `Booking_ID Seats
101 A1,B1
101 A2,B2
120 A20,C2`;
      
      const bookings = parseBookingData(data);
      expect(bookings).toHaveLength(2); // Duplicate should be skipped
      expect(bookings[0].bookingId).toBe('101');
      expect(bookings[1].bookingId).toBe('120');
    });

    it('should filter out invalid seat formats', () => {
      const data = `Booking_ID Seats
101 A1,B1,Z99
120 A20,C2`;
      
      const bookings = parseBookingData(data);
      expect(bookings[0].seats).toEqual(['A1', 'B1']); // Z99 should be filtered out
    });
  });

  describe('generateBoardingSequence', () => {
    it('should generate correct boarding sequence', () => {
      const bookings = [
        { bookingId: '101', seats: ['A1', 'B1'] },
        { bookingId: '120', seats: ['A20', 'C2'] },
        { bookingId: '150', seats: ['D15', 'C15'] }
      ];
      
      const sequence = generateBoardingSequence(bookings);
      
      expect(sequence).toHaveLength(3);
      expect(sequence[0].sequence).toBe(1);
      expect(sequence[1].sequence).toBe(2);
      expect(sequence[2].sequence).toBe(3);
      
      // Should be ordered by max distance (descending)
      expect(sequence[0].maxDistance).toBeGreaterThanOrEqual(sequence[1].maxDistance);
      expect(sequence[1].maxDistance).toBeGreaterThanOrEqual(sequence[2].maxDistance);
    });

    it('should handle single booking', () => {
      const bookings = [
        { bookingId: '101', seats: ['A10', 'B10'] }
      ];
      
      const sequence = generateBoardingSequence(bookings);
      
      expect(sequence).toHaveLength(1);
      expect(sequence[0]).toEqual({
        sequence: 1,
        bookingId: '101',
        seats: ['A10', 'B10'],
        maxDistance: 10.3,
        minDistance: 10.2
      });
    });

    it('should handle empty bookings array', () => {
      const sequence = generateBoardingSequence([]);
      expect(sequence).toHaveLength(0);
    });

    it('should sort by booking ID when distances are equal', () => {
      const bookings = [
        { bookingId: '200', seats: ['A10'] },
        { bookingId: '100', seats: ['B10'] }
      ];
      
      const sequence = generateBoardingSequence(bookings);
      
      // Both have similar distances, should sort by booking ID
      expect(sequence[0].bookingId).toBe('100'); // Earlier booking ID first
      expect(sequence[1].bookingId).toBe('200');
    });
  });

  describe('analyzeBoardingEfficiency', () => {
    it('should calculate efficiency metrics correctly', () => {
      const sequence = [
        {
          sequence: 1,
          bookingId: '101',
          seats: ['A20'],
          maxDistance: 20.3,
          minDistance: 20.3
        },
        {
          sequence: 2,
          bookingId: '102',
          seats: ['A10'],
          maxDistance: 10.3,
          minDistance: 10.3
        }
      ];
      
      const efficiency = analyzeBoardingEfficiency(sequence);
      
      expect(efficiency.averageDistance).toBe(15.3);
      expect(efficiency.optimalityScore).toBe(100); // Perfect order
      expect(efficiency.maxBlockingPotential).toBe(0); // No blocking
    });

    it('should handle empty sequence', () => {
      const efficiency = analyzeBoardingEfficiency([]);
      
      expect(efficiency.averageDistance).toBe(0);
      expect(efficiency.optimalityScore).toBe(0);
      expect(efficiency.maxBlockingPotential).toBe(0);
    });

    it('should calculate blocking potential correctly', () => {
      const sequence = [
        {
          sequence: 1,
          bookingId: '101',
          seats: ['A5'],
          maxDistance: 5.3,
          minDistance: 5.3
        },
        {
          sequence: 2,
          bookingId: '102',
          seats: ['A20'],
          maxDistance: 20.3,
          minDistance: 20.3
        }
      ];
      
      const efficiency = analyzeBoardingEfficiency(sequence);
      
      expect(efficiency.maxBlockingPotential).toBe(15); // 20.3 - 5.3
      expect(efficiency.optimalityScore).toBe(0); // Wrong order
    });
  });

  describe('Priority Queue and Caching', () => {
    it('should handle large datasets efficiently', () => {
      const bookings = [];
      for (let i = 1; i <= 100; i++) {
        bookings.push({
          bookingId: i.toString(),
          seats: [`A${i}`, `B${i}`]
        });
      }
      
      const startTime = Date.now();
      const sequence = generateBoardingSequence(bookings);
      const endTime = Date.now();
      
      expect(sequence).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      
      // Verify correct ordering
      for (let i = 0; i < sequence.length - 1; i++) {
        expect(sequence[i].maxDistance).toBeGreaterThanOrEqual(sequence[i + 1].maxDistance);
      }
    });

    it('should maintain sequence integrity with complex bookings', () => {
      const bookings = [
        { bookingId: 'A001', seats: ['A1', 'B1', 'C1'] },
        { bookingId: 'B002', seats: ['D20'] },
        { bookingId: 'C003', seats: ['A15', 'D15'] },
        { bookingId: 'D004', seats: ['C5'] }
      ];
      
      const sequence = generateBoardingSequence(bookings);
      
      expect(sequence).toHaveLength(4);
      
      // Verify all bookings are present
      const bookingIds = sequence.map(s => s.bookingId);
      expect(bookingIds).toContain('A001');
      expect(bookingIds).toContain('B002');
      expect(bookingIds).toContain('C003');
      expect(bookingIds).toContain('D004');
      
      // Verify sequence numbers are consecutive
      const sequenceNumbers = sequence.map(s => s.sequence);
      expect(sequenceNumbers).toEqual([1, 2, 3, 4]);
    });
  });
});