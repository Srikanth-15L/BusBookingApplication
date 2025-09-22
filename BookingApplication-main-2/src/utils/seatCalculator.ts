import { SeatPosition, Booking, BoardingSequence } from '../types/booking';

// Priority queue implementation for efficient sorting
class PriorityQueue<T> {
  private heap: T[] = [];
  private compare: (a: T, b: T) => number;

  constructor(compareFn: (a: T, b: T) => number) {
    this.compare = compareFn;
  }

  push(item: T): void {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();

    const root = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return root;
  }

  size(): number {
    return this.heap.length;
  }

  private heapifyUp(index: number): void {
    if (index === 0) return;
    
    const parentIndex = Math.floor((index - 1) / 2);
    if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      this.heapifyUp(parentIndex);
    }
  }

  private heapifyDown(index: number): void {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let smallest = index;

    if (leftChild < this.heap.length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
      smallest = leftChild;
    }

    if (rightChild < this.heap.length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
      smallest = rightChild;
    }

    if (smallest !== index) {
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      this.heapifyDown(smallest);
    }
  }
}

// Seat distance cache using HashMap for O(1) lookups
class SeatDistanceCache {
  private cache = new Map<string, number>();
  private columnWeights = new Map<string, number>([
    ['A', 0.3], // Window seat, harder to access
    ['B', 0.2], // Middle seat
    ['C', 0.1], // Aisle seat, easier access
    ['D', 0.0]  // Aisle seat, easiest access
  ]);

  getDistance(seatLabel: string): number {
    if (this.cache.has(seatLabel)) {
      return this.cache.get(seatLabel)!;
    }

    const distance = this.calculateDistance(seatLabel);
    this.cache.set(seatLabel, distance);
    return distance;
  }

  private calculateDistance(seatLabel: string): number {
    const match = seatLabel.match(/^([A-D])(\d+)$/);
    if (!match) throw new Error(`Invalid seat format: ${seatLabel}`);
    
    const column = match[1];
    const row = parseInt(match[2]);
    
    // Base distance is the row number (higher row = further back)
    let distance = row;
    
    // Add column weight for accessibility
    const columnWeight = this.columnWeights.get(column) || 0;
    distance += columnWeight;
    
    return distance;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Booking processor with optimized data structures
interface BookingData {
  bookingId: string;
  seats: string[];
  maxDistance: number;
  minDistance: number;
  seatCount: number;
}

class BoardingOptimizer {
  private seatCache = new SeatDistanceCache();
  private bookingMap = new Map<string, BookingData>();

  processBookings(bookings: Booking[]): BoardingSequence[] {
    // Clear previous data
    this.bookingMap.clear();
    this.seatCache.clearCache();

    // Process bookings and build hashmap
    const processedBookings = this.buildBookingMap(bookings);
    
    // Use priority queue for optimal sorting
    const priorityQueue = this.createPriorityQueue();
    
    // Add all bookings to priority queue
    processedBookings.forEach(booking => priorityQueue.push(booking));
    
    // Extract sorted results
    const sortedBookings: BookingData[] = [];
    while (priorityQueue.size() > 0) {
      sortedBookings.push(priorityQueue.pop()!);
    }

    // Convert to boarding sequence format
    return this.convertToBoardingSequence(sortedBookings);
  }

  private buildBookingMap(bookings: Booking[]): BookingData[] {
    const processedBookings: BookingData[] = [];

    for (const booking of bookings) {
      const seatDistances = booking.seats.map(seat => this.seatCache.getDistance(seat));
      const maxDistance = Math.max(...seatDistances);
      const minDistance = Math.min(...seatDistances);

      const bookingData: BookingData = {
        bookingId: booking.bookingId,
        seats: booking.seats,
        maxDistance,
        minDistance,
        seatCount: booking.seats.length
      };

      // Store in hashmap for quick lookup
      this.bookingMap.set(booking.bookingId, bookingData);
      processedBookings.push(bookingData);
    }

    return processedBookings;
  }

  private createPriorityQueue(): PriorityQueue<BookingData> {
    // Custom comparator for boarding priority
    // Priority: Higher maxDistance first, then earlier bookingId for ties
    return new PriorityQueue<BookingData>((a, b) => {
      // Primary sort: maxDistance (descending - higher distance first)
      if (a.maxDistance !== b.maxDistance) {
        return b.maxDistance - a.maxDistance;
      }
      
      // Secondary sort: bookingId (ascending - earlier IDs first)
      return a.bookingId.localeCompare(b.bookingId);
    });
  }

  private convertToBoardingSequence(sortedBookings: BookingData[]): BoardingSequence[] {
    return sortedBookings.map((booking, index) => ({
      sequence: index + 1,
      bookingId: booking.bookingId,
      seats: booking.seats,
      maxDistance: booking.maxDistance,
      minDistance: booking.minDistance
    }));
  }

  getBookingData(bookingId: string): BookingData | undefined {
    return this.bookingMap.get(bookingId);
  }

  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.seatCache.getCacheSize(),
      hitRate: 0 // Could be implemented with hit/miss counters
    };
  }
}

// Global optimizer instance
const boardingOptimizer = new BoardingOptimizer();

// Calculate distance from front entry for a given seat (legacy function for compatibility)
export function calculateSeatDistance(seatLabel: string): number {
  const cache = new SeatDistanceCache();
  return cache.getDistance(seatLabel);
}

// Parse seat position from seat label
export function parseSeatPosition(seatLabel: string): SeatPosition {
  const match = seatLabel.match(/^([A-D])(\d+)$/);
  if (!match) throw new Error(`Invalid seat format: ${seatLabel}`);
  
  const column = match[1];
  const row = parseInt(match[2]);
  const distance = calculateSeatDistance(seatLabel);
  
  return { row, column, distance };
}

// Generate optimal boarding sequence using advanced data structures
export function generateBoardingSequence(bookings: Booking[]): BoardingSequence[] {
  return boardingOptimizer.processBookings(bookings);
}

// Parse booking data from text input with optimized processing
export function parseBookingData(data: string): Booking[] {
  const lines = data.trim().split('\n');
  const bookings: Booking[] = [];
  const bookingSet = new Set<string>(); // Use Set for O(1) duplicate detection
  
  for (let i = 1; i < lines.length; i++) { // Skip header
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    
    const bookingId = parts[0];
    
    // Check for duplicate booking IDs
    if (bookingSet.has(bookingId)) {
      console.warn(`Duplicate booking ID found: ${bookingId}`);
      continue;
    }
    
    const seatsStr = parts.slice(1).join('');
    const seats = seatsStr.split(',').map(s => s.trim()).filter(s => s);
    
    // Validate seat formats
    const validSeats = seats.filter(seat => /^[A-D]\d+$/.test(seat));
    if (validSeats.length !== seats.length) {
      console.warn(`Invalid seat format in booking ${bookingId}`);
    }
    
    if (validSeats.length > 0) {
      bookingSet.add(bookingId);
      bookings.push({ bookingId, seats: validSeats });
    }
  }
  
  return bookings;
}

// Advanced analytics for boarding optimization
export function analyzeBoardingEfficiency(sequence: BoardingSequence[]): {
  averageDistance: number;
  maxBlockingPotential: number;
  optimalityScore: number;
} {
  if (sequence.length === 0) {
    return { averageDistance: 0, maxBlockingPotential: 0, optimalityScore: 0 };
  }

  const distances = sequence.map(s => s.maxDistance);
  const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  
  // Calculate blocking potential (how much earlier passengers might block later ones)
  let blockingPotential = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    for (let j = i + 1; j < sequence.length; j++) {
      if (sequence[i].maxDistance < sequence[j].maxDistance) {
        blockingPotential += sequence[j].maxDistance - sequence[i].maxDistance;
      }
    }
  }
  
  const maxBlockingPotential = blockingPotential;
  
  // Optimality score (0-100, higher is better)
  const idealOrder = [...sequence].sort((a, b) => b.maxDistance - a.maxDistance);
  let correctPositions = 0;
  for (let i = 0; i < sequence.length; i++) {
    if (sequence[i].bookingId === idealOrder[i].bookingId) {
      correctPositions++;
    }
  }
  const optimalityScore = (correctPositions / sequence.length) * 100;
  
  return { averageDistance, maxBlockingPotential, optimalityScore };
}