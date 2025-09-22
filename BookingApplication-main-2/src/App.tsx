import React, { useState } from 'react';
import { Bus, Users, Clock, Server } from 'lucide-react';
import { BookingInput } from './components/BookingInput';
import { SequenceResults } from './components/SequenceResults';
import { BusLayout } from './components/BusLayout';
import { parseBookingData, generateBoardingSequence } from './utils/seatCalculator';
import { BoardingSequence } from './types/booking';

function App() {
  const [boardingSequence, setBoardingSequence] = useState<BoardingSequence[]>([]);
  const [efficiency, setEfficiency] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [processingMode, setProcessingMode] = useState<'frontend' | 'backend'>('frontend');

  const handleDataSubmit = (data: string) => {
    try {
      setProcessingMode('frontend');
      const bookings = parseBookingData(data);
      const sequence = generateBoardingSequence(bookings);
      setBoardingSequence(sequence);
      setEfficiency(null); // Frontend doesn't provide efficiency metrics
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing the data');
      setBoardingSequence([]);
      setEfficiency(null);
    }
  };

  const handleApiResult = (result: any, efficiencyData?: any) => {
    try {
      setProcessingMode('backend');
      // Convert API result to frontend format
      const sequence: BoardingSequence[] = result.boardingSequence.map((item: any) => ({
        sequence: item.sequence,
        bookingId: item.bookingId,
        seats: item.seats,
        maxDistance: item.maxDistance,
        minDistance: item.minDistance
      }));
      setBoardingSequence(sequence);
      setEfficiency(efficiencyData || null);
      setError('');
    } catch (err) {
      setError('Failed to process API response');
      setBoardingSequence([]);
      setEfficiency(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Bus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bus Boarding Optimizer</h1>
                <p className="text-sm text-gray-600">Minimize boarding time with optimal sequencing</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Single Entry</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Time Optimized</span>
              </div>
              <div className="flex items-center gap-1">
                <Server className="h-4 w-4" />
                <span className="capitalize">{processingMode}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Input */}
          <div className="space-y-6">
            <BookingInput onDataSubmit={handleDataSubmit} onApiResult={handleApiResult} />
            
            {boardingSequence.length > 0 && (
              <SequenceResults boardingSequence={boardingSequence} efficiency={efficiency} />
            )}
          </div>

          {/* Right column - Bus layout */}
          <div className="space-y-6">
            <BusLayout boardingSequence={boardingSequence} />
            
            {/* Instructions */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">How It Works</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">1</div>
                  <span>Upload or paste booking data with Booking_ID and seat assignments</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">2</div>
                  <span>System calculates optimal boarding sequence based on seat distances</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">3</div>
                  <span>Passengers with back seats board first to minimize aisle blocking</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center mt-0.5">4</div>
                  <span>Visual bus layout shows boarding sequence with color coding</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;