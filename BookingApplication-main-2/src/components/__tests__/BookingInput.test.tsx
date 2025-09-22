import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookingInput } from '../BookingInput';
import { ApiService } from '../../services/api';

// Mock the ApiService
vi.mock('../../services/api', () => ({
  ApiService: {
    healthCheck: vi.fn(),
    processBookingData: vi.fn(),
    uploadFile: vi.fn(),
    benchmarkAlgorithms: vi.fn(),
  }
}));

describe('BookingInput', () => {
  const mockOnDataSubmit = vi.fn();
  const mockOnApiResult = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful health check by default
    vi.mocked(ApiService.healthCheck).mockResolvedValue({
      status: 'healthy',
      timestamp: Date.now()
    });
  });

  it('should render input components', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    expect(screen.getByText('Booking Data Input')).toBeInTheDocument();
    expect(screen.getByText('Upload booking data file')).toBeInTheDocument();
    expect(screen.getByText('Or paste booking data:')).toBeInTheDocument();
    expect(screen.getByText('Load Sample Data')).toBeInTheDocument();
    expect(screen.getByText('Generate Boarding Sequence')).toBeInTheDocument();
  });

  it('should load sample data when button is clicked', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    const loadSampleButton = screen.getByText('Load Sample Data');
    fireEvent.click(loadSampleButton);
    
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(expect.stringContaining('Booking_ID'));
    expect(textarea).toHaveValue(expect.stringContaining('101'));
  });

  it('should handle text input changes', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { 
      target: { value: 'Booking_ID Seats\n101 A1,B1' } 
    });
    
    expect(textarea).toHaveValue('Booking_ID Seats\n101 A1,B1');
  });

  it('should submit data when generate button is clicked', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { 
      target: { value: 'Booking_ID Seats\n101 A1,B1' } 
    });
    
    const generateButton = screen.getByText('Generate Boarding Sequence');
    fireEvent.click(generateButton);
    
    expect(mockOnDataSubmit).toHaveBeenCalledWith('Booking_ID Seats\n101 A1,B1');
  });

  it('should disable generate button when input is empty', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    const generateButton = screen.getByText('Generate Boarding Sequence');
    expect(generateButton).toBeDisabled();
  });

  it('should show backend status', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
  });

  it('should handle backend offline status', async () => {
    vi.mocked(ApiService.healthCheck).mockRejectedValue(new Error('Network error'));
    
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Backend unavailable. Using frontend processing.')).toBeInTheDocument();
    });
  });

  it('should use backend processing when enabled and available', async () => {
    const mockApiResponse = {
      boardingSequence: [],
      totalBookings: 0,
      totalPassengers: 0,
      success: true
    };
    
    vi.mocked(ApiService.processBookingData).mockResolvedValue(mockApiResponse);
    
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    // Wait for backend status to be checked
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
    
    // Enable backend processing
    const backendToggle = screen.getByRole('checkbox');
    fireEvent.click(backendToggle);
    
    // Add input data
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { 
      target: { value: 'Booking_ID Seats\n101 A1,B1' } 
    });
    
    // Submit
    const generateButton = screen.getByText('Generate Boarding Sequence');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(ApiService.processBookingData).toHaveBeenCalledWith('Booking_ID Seats\n101 A1,B1');
      expect(mockOnApiResult).toHaveBeenCalledWith(mockApiResponse, undefined);
    });
  });

  it('should handle file upload', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    const fileInput = screen.getByRole('textbox', { hidden: true });
    const file = new File(['Booking_ID,Seats\n101,"A1,B1"'], 'test.csv', {
      type: 'text/csv'
    });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Should update the textarea with file content
    await waitFor(() => {
      const textarea = screen.getByRole('textbox', { hidden: false });
      expect(textarea).toHaveValue(expect.stringContaining('101'));
    });
  });

  it('should show benchmark button when backend is enabled', async () => {
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    // Wait for backend status
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
    
    // Enable backend
    const backendToggle = screen.getByRole('checkbox');
    fireEvent.click(backendToggle);
    
    expect(screen.getByText('Benchmark')).toBeInTheDocument();
  });

  it('should handle benchmark execution', async () => {
    const mockBenchmarkResponse = {
      boardingSequence: [],
      totalBookings: 0,
      totalPassengers: 0,
      benchmarkCompleted: true,
      success: true
    };
    
    vi.mocked(ApiService.benchmarkAlgorithms).mockResolvedValue(mockBenchmarkResponse);
    
    render(
      <BookingInput 
        onDataSubmit={mockOnDataSubmit} 
        onApiResult={mockOnApiResult} 
      />
    );
    
    // Wait for backend status and enable backend
    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
    });
    
    const backendToggle = screen.getByRole('checkbox');
    fireEvent.click(backendToggle);
    
    // Add input data
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { 
      target: { value: 'Booking_ID Seats\n101 A1,B1' } 
    });
    
    // Click benchmark
    const benchmarkButton = screen.getByText('Benchmark');
    fireEvent.click(benchmarkButton);
    
    await waitFor(() => {
      expect(ApiService.benchmarkAlgorithms).toHaveBeenCalledWith('Booking_ID Seats\n101 A1,B1', 10);
      expect(mockOnApiResult).toHaveBeenCalledWith(mockBenchmarkResponse, undefined);
    });
  });
});