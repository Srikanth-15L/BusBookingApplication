import React from 'react';
import { BoardingSequence } from '../types/booking';

interface BusLayoutProps {
  boardingSequence: BoardingSequence[];
}

export function BusLayout({ boardingSequence }: BusLayoutProps) {
  // Create a map of seat to booking sequence
  const seatToSequence = new Map<string, number>();
  boardingSequence.forEach(item => {
    item.seats.forEach(seat => {
      seatToSequence.set(seat, item.sequence);
    });
  });

  const getSeatColor = (seat: string): string => {
    const sequence = seatToSequence.get(seat);
    if (!sequence) return 'bg-gray-100 border-gray-300';
    
    // Color coding based on boarding sequence
    if (sequence <= 2) return 'bg-green-200 border-green-400';
    if (sequence <= 4) return 'bg-yellow-200 border-yellow-400';
    if (sequence <= 6) return 'bg-orange-200 border-orange-400';
    return 'bg-red-200 border-red-400';
  };

  const getSeatLabel = (seat: string): string => {
    const sequence = seatToSequence.get(seat);
    return sequence ? sequence.toString() : '';
  };

  const renderSeatRow = (rowNum: number) => (
    <div key={rowNum} className="flex justify-center gap-8 mb-1">
      <div className="flex gap-1">
        {['A', 'B'].map(col => {
          const seat = `${col}${rowNum}`;
          return (
            <div
              key={seat}
              className={`w-8 h-8 border-2 rounded flex items-center justify-center text-xs font-bold ${getSeatColor(seat)}`}
              title={`${seat}${seatToSequence.get(seat) ? ` - Seq ${seatToSequence.get(seat)}` : ''}`}
            >
              {getSeatLabel(seat)}
            </div>
          );
        })}
      </div>
      
      <div className="w-6 flex items-center justify-center text-xs text-gray-500">
        {rowNum}
      </div>
      
      <div className="flex gap-1">
        {['C', 'D'].map(col => {
          const seat = `${col}${rowNum}`;
          return (
            <div
              key={seat}
              className={`w-8 h-8 border-2 rounded flex items-center justify-center text-xs font-bold ${getSeatColor(seat)}`}
              title={`${seat}${seatToSequence.get(seat) ? ` - Seq ${seatToSequence.get(seat)}` : ''}`}
            >
              {getSeatLabel(seat)}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center">Bus Layout & Boarding Sequence</h3>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
          <span>1-2</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
          <span>3-4</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded"></div>
          <span>5-6</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
          <span>7+</span>
        </div>
      </div>

      {/* Bus layout */}
      <div className="font-mono">
        {/* Back rows first */}
        {Array.from({ length: 20 }, (_, i) => 20 - i).map(renderSeatRow)}
        
        {/* Entry point */}
        <div className="flex justify-center mt-4">
          <div className="bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold">
            🚪 FRONT ENTRY
          </div>
        </div>
      </div>
    </div>
  );
}