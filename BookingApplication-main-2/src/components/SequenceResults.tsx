import React from 'react';
import { BoardingSequence } from '../types/booking';
import { Clock, Users, MapPin, TrendingUp, Zap, Target } from 'lucide-react';

interface SequenceResultsProps {
  boardingSequence: BoardingSequence[];
  efficiency?: {
    averageDistance: number;
    blockingPotential: number;
    optimalityScore: number;
  };
}

export function SequenceResults({ boardingSequence, efficiency }: SequenceResultsProps) {
  const totalBookings = boardingSequence.length;
  const totalPassengers = boardingSequence.reduce((sum, booking) => sum + booking.seats.length, 0);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Optimal Boarding Sequence</h2>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
          <div className="text-sm text-gray-600">Bookings</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <MapPin className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalPassengers}</div>
          <div className="text-sm text-gray-600">Passengers</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Clock className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">Optimized</div>
          <div className="text-sm text-gray-600">Boarding Time</div>
        </div>
      </div>

      {/* Efficiency metrics */}
      {efficiency && (
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-green-50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{efficiency.averageDistance.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Distance</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{efficiency.blockingPotential.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Blocking Risk</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{efficiency.optimalityScore.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Optimality</div>
          </div>
        </div>
      )}

      {/* Sequence table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sequence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Distance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {boardingSequence.map((item, index) => (
              <tr key={item.bookingId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                        {item.sequence}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.bookingId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-1">
                    {item.seats.map(seat => (
                      <span key={seat} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {seat}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.maxDistance.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Algorithm explanation */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Boarding Algorithm</h3>
        <p className="text-sm text-blue-800">
          Advanced algorithm using priority queues and hashmaps for optimal performance. 
          The system uses heap-based sorting to prioritize bookings with seats furthest from the front entry, 
          minimizing aisle blocking. Seat distance calculations are cached for O(1) lookup efficiency.
        </p>
      </div>
    </div>
  );
}