const API_BASE_URL = 'http://localhost:8000';

export interface ApiResponse {
  boardingSequence: Array<{
    sequence: number;
    bookingId: string;
    seats: string[];
    maxDistance: number;
    minDistance: number;
  }>;
  totalBookings: number;
  totalPassengers: number;
  efficiency?: {
    averageDistance: number;
    blockingPotential: number;
    optimalityScore: number;
  };
  success: boolean;
  filename?: string;
  testCompleted?: boolean;
  benchmarkCompleted?: boolean;
}

export class ApiService {
  static async processBookingData(data: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/process-booking-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process booking data');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  static async uploadFile(file: File): Promise<ApiResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  static async testOptimization(data: string, iterations: number = 1): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/test-optimization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, iterations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to test optimization');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  static async benchmarkAlgorithms(data: string, iterations: number = 10): Promise<ApiResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/benchmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, iterations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to benchmark algorithms');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  static async healthCheck(): Promise<{ status: string; timestamp: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      
      if (!response.ok) {
        throw new Error('Health check failed');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Backend service unavailable');
    }
  }
}