import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiService } from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processBookingData', () => {
    it('should process booking data successfully', async () => {
      const mockResponse = {
        boardingSequence: [
          {
            sequence: 1,
            bookingId: '101',
            seats: ['A20', 'B20'],
            maxDistance: 20.3,
            minDistance: 20.2
          }
        ],
        totalBookings: 1,
        totalPassengers: 2,
        success: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = 'Booking_ID Seats\n101 A20,B20';
      const result = await ApiService.processBookingData(data);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/process-booking-data',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data }),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const errorResponse = {
        detail: 'Invalid booking data format'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => errorResponse
      });

      const data = 'invalid data';
      
      await expect(ApiService.processBookingData(data))
        .rejects.toThrow('Invalid booking data format');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const data = 'Booking_ID Seats\n101 A1,B1';
      
      await expect(ApiService.processBookingData(data))
        .rejects.toThrow('Network error');
    });
  });

  describe('uploadFile', () => {
    it('should upload file successfully', async () => {
      const mockResponse = {
        boardingSequence: [],
        totalBookings: 0,
        totalPassengers: 0,
        filename: 'test.csv',
        success: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const file = new File(['Booking_ID,Seats\n101,"A1,B1"'], 'test.csv', {
        type: 'text/csv'
      });

      const result = await ApiService.uploadFile(file);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/upload-file',
        {
          method: 'POST',
          body: expect.any(FormData),
        }
      );

      expect(result).toEqual(mockResponse);
    });

    it('should handle file upload errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'File format not supported' })
      });

      const file = new File(['invalid'], 'test.txt', { type: 'text/plain' });
      
      await expect(ApiService.uploadFile(file))
        .rejects.toThrow('File format not supported');
    });
  });

  describe('testOptimization', () => {
    it('should run optimization test successfully', async () => {
      const mockResponse = {
        boardingSequence: [],
        totalBookings: 0,
        totalPassengers: 0,
        testCompleted: true,
        success: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = 'Booking_ID Seats\n101 A1,B1';
      const result = await ApiService.testOptimization(data, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/test-optimization',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data, iterations: 5 }),
        }
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('benchmarkAlgorithms', () => {
    it('should run benchmark successfully', async () => {
      const mockResponse = {
        boardingSequence: [],
        totalBookings: 0,
        totalPassengers: 0,
        benchmarkCompleted: true,
        success: true
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const data = 'Booking_ID Seats\n101 A1,B1';
      const result = await ApiService.benchmarkAlgorithms(data, 10);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: Date.now()
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await ApiService.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/health');
      expect(result).toEqual(mockResponse);
    });

    it('should handle health check failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      await expect(ApiService.healthCheck())
        .rejects.toThrow('Health check failed');
    });

    it('should handle network error during health check', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(ApiService.healthCheck())
        .rejects.toThrow('Backend service unavailable');
    });
  });
});