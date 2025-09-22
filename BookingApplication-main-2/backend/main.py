from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import io
from typing import List, Dict, Any
import re
import heapq
from collections import defaultdict

app = FastAPI(title="Bus Boarding Optimizer API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptimizedBoardingProcessor:
    def __init__(self):
        # Seat distance cache using dictionary (hashmap)
        self.seat_cache = {}
        # Column weights for accessibility
        self.column_weights = {'A': 0.3, 'B': 0.2, 'C': 0.1, 'D': 0.0}
        # Performance metrics
        self.cache_hits = 0
        self.cache_misses = 0
    
    def get_seat_distance(self, seat_label: str) -> float:
        """Get seat distance with caching for O(1) lookup"""
        if seat_label in self.seat_cache:
            self.cache_hits += 1
            return self.seat_cache[seat_label]
        
        self.cache_misses += 1
        distance = self._calculate_seat_distance(seat_label)
        self.seat_cache[seat_label] = distance
        return distance
    
    def _calculate_seat_distance(self, seat_label: str) -> float:
        """Calculate distance from front entry for a given seat"""
        match = re.match(r'^([A-D])(\d+)$', seat_label)
        if not match:
            raise ValueError(f"Invalid seat format: {seat_label}")
        
        column = match.group(1)
        row = int(match.group(2))
        
        # Base distance is the row number
        distance = float(row)
        
        # Add column weight for accessibility
        distance += self.column_weights.get(column, 0)
        
        return distance
    
    def process_bookings_with_heap(self, bookings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process bookings using heap-based priority queue for optimal performance"""
        start_time = time.time()
        
        # Build booking data with distance calculations
        booking_data = []
        booking_map = {}  # HashMap for O(1) booking lookup
        
        for booking in bookings:
            booking_id = booking['bookingId']
            seats = booking['seats']
            
            # Calculate distances for all seats
            seat_distances = [self.get_seat_distance(seat) for seat in seats]
            max_distance = max(seat_distances)
            min_distance = min(seat_distances)
            
            booking_info = {
                'bookingId': booking_id,
                'seats': seats,
                'maxDistance': max_distance,
                'minDistance': min_distance,
                'seatCount': len(seats)
            }
            
            # Store in hashmap for quick access
            booking_map[booking_id] = booking_info
            
            # Add to heap (negative maxDistance for max-heap behavior)
            # Tuple: (-maxDistance, bookingId, booking_info)
            heapq.heappush(booking_data, (-max_distance, booking_id, booking_info))
        
        # Extract sorted results from heap
        boarding_sequence = []
        sequence_num = 1
        
        while booking_data:
            neg_distance, booking_id, booking_info = heapq.heappop(booking_data)
            
            boarding_sequence.append({
                'sequence': sequence_num,
                'bookingId': booking_info['bookingId'],
                'seats': booking_info['seats'],
                'maxDistance': booking_info['maxDistance'],
                'minDistance': booking_info['minDistance']
            })
            sequence_num += 1
        
        processing_time = time.time() - start_time
        
        # Log performance metrics (server-side only)
        cache_hit_rate = self.cache_hits / (self.cache_hits + self.cache_misses) if (self.cache_hits + self.cache_misses) > 0 else 0
        print(f"Heap-based processing - Time: {processing_time:.4f}s, Cache hits: {self.cache_hits}, Hit rate: {cache_hit_rate:.2%}")
        
        return {
            'boardingSequence': boarding_sequence,
            'processingTime': processing_time,
            'totalBookings': len(bookings),
            'totalPassengers': sum(len(booking['seats']) for booking in bookings),
            'cacheStats': {
                'hits': self.cache_hits,
                'misses': self.cache_misses,
                'hitRate': cache_hit_rate
            }
        }
    
    def analyze_boarding_efficiency(self, sequence: List[Dict[str, Any]]) -> Dict[str, float]:
        """Analyze boarding efficiency using advanced metrics"""
        if not sequence:
            return {'averageDistance': 0, 'blockingPotential': 0, 'optimalityScore': 0}
        
        distances = [item['maxDistance'] for item in sequence]
        average_distance = sum(distances) / len(distances)
        
        # Calculate blocking potential
        blocking_potential = 0
        for i in range(len(sequence) - 1):
            for j in range(i + 1, len(sequence)):
                if sequence[i]['maxDistance'] < sequence[j]['maxDistance']:
                    blocking_potential += sequence[j]['maxDistance'] - sequence[i]['maxDistance']
        
        # Optimality score
        ideal_order = sorted(sequence, key=lambda x: -x['maxDistance'])
        correct_positions = sum(1 for i, item in enumerate(sequence) 
                              if item['bookingId'] == ideal_order[i]['bookingId'])
        optimality_score = (correct_positions / len(sequence)) * 100
        
        return {
            'averageDistance': average_distance,
            'blockingPotential': blocking_potential,
            'optimalityScore': optimality_score
        }
    
    def clear_cache(self):
        """Clear the seat distance cache"""
        self.seat_cache.clear()
        self.cache_hits = 0
        self.cache_misses = 0
class BookingProcessor(OptimizedBoardingProcessor):
    def __init__(self):
        super().__init__()
    
    def calculate_seat_distance(self, seat_label: str) -> float:  # Legacy method
        return self.get_seat_distance(seat_label)
    
    def _legacy_calculate_seat_distance(self, seat_label: str) -> float:
        """Calculate distance from front entry for a given seat"""
        match = re.match(r'^([A-D])(\d+)$', seat_label)
        if not match:
            raise ValueError(f"Invalid seat format: {seat_label}")
        
        column = match.group(1)
        row = int(match.group(2))
        
        # Base distance is the row number (higher row = further back)
        distance = float(row)
        
        # Add column penalty (A/B are window seats, C/D are aisle seats)
        # Aisle seats (C/D) are slightly easier to access
        if column in ['C', 'D']:
            distance += 0.1  # Slight penalty for crossing aisle
        
        return distance
    
    def parse_booking_data(self, data: str) -> List[Dict[str, Any]]:
        """Parse booking data from text input"""
        lines = data.strip().split('\n')
        bookings = []
        booking_ids = set()  # Use set for O(1) duplicate detection
        
        for i in range(1, len(lines)):  # Skip header
            line = lines[i].strip()
            if not line:
                continue
            
            # Handle CSV format with potential quotes and commas
            booking_id = ''
            seats_str = ''
            
            # Check if line contains quotes (CSV format)
            if '"' in line:
                # Parse CSV format: 101, "A1,B1" or 101,"A1,B1"
                import re
                csv_match = re.match(r'^([^,]+),\s*"([^"]+)"', line)
                if csv_match:
                    booking_id = csv_match.group(1).strip()
                    seats_str = csv_match.group(2).strip()
                else:
                    # Fallback for malformed CSV
                    parts = line.split(',')
                    if len(parts) >= 2:
                        booking_id = parts[0].strip()
                        seats_str = ','.join(parts[1:]).replace('"', '').strip()
            else:
                # Handle tab/space separated format: 101 A1,B1 or 101	A1,B1
                parts = re.split(r'[\s,]+', line)
                if len(parts) < 2:
                    continue
                
                booking_id = parts[0]
                
                # Join remaining parts and handle different separators
                remaining_parts = parts[1:]
                if len(remaining_parts) == 1 and ',' in remaining_parts[0]:
                    # Format: 101 A1,B1
                    seats_str = remaining_parts[0]
                else:
                    # Format: 101 A1 B1 (space separated seats)
                    seats_str = ','.join(remaining_parts)
            
            if not booking_id or not seats_str:
                continue
            
            # Check for duplicates
            if booking_id in booking_ids:
                print(f"Warning: Duplicate booking ID {booking_id}")
                continue
            
            # Parse seats - handle both comma and space separated
            seats = [s.strip() for s in re.split(r'[,\s]+', seats_str) if s.strip()]
            
            # Validate seat formats
            valid_seats = [seat for seat in seats if re.match(r'^[A-D]\d+$', seat)]
            if len(valid_seats) != len(seats):
                print(f"Warning: Invalid seat format in booking {booking_id}")
            
            if valid_seats:
                booking_ids.add(booking_id)
                bookings.append({
                    'bookingId': booking_id,
                    'seats': valid_seats
                })
        
        return bookings
    
    def generate_boarding_sequence(self, bookings: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate optimal boarding sequence using heap-based algorithm"""
        return self.process_bookings_with_heap(bookings)

processor = BookingProcessor()

@app.get("/")
async def root():
    return {"message": "Bus Boarding Optimizer API", "status": "running"}

@app.post("/process-booking-data")
async def process_booking_data(data: dict):
    """Process booking data from JSON input"""
    try:
        if 'data' not in data:
            raise HTTPException(status_code=400, detail="Missing 'data' field")
        
        bookings = processor.parse_booking_data(data['data'])
        result = processor.generate_boarding_sequence(bookings)
        
        # Add efficiency analysis
        efficiency = processor.analyze_boarding_efficiency(result['boardingSequence'])
        
        # Remove processing time and cache stats from response (keep them hidden)
        response = {
            'boardingSequence': result['boardingSequence'],
            'totalBookings': result['totalBookings'],
            'totalPassengers': result['totalPassengers'],
            'efficiency': efficiency,
            'success': True
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/upload-file")
async def upload_file(file: UploadFile = File(...)):
    """Process uploaded booking data file"""
    try:
        if not file.filename.endswith(('.txt', '.csv')):
            raise HTTPException(status_code=400, detail="Only .txt and .csv files are supported")
        
        content = await file.read()
        data = content.decode('utf-8')
        
        bookings = processor.parse_booking_data(data)
        result = processor.generate_boarding_sequence(bookings)
        
        # Add efficiency analysis
        efficiency = processor.analyze_boarding_efficiency(result['boardingSequence'])
        
        # Remove processing time and cache stats from response (keep them hidden)
        response = {
            'boardingSequence': result['boardingSequence'],
            'totalBookings': result['totalBookings'],
            'totalPassengers': result['totalPassengers'],
            'filename': file.filename,
            'efficiency': efficiency,
            'success': True
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/test-optimization")
async def test_optimization(data: dict):
    """Test endpoint for optimization performance (processing time hidden from frontend)"""
    try:
        if 'data' not in data:
            raise HTTPException(status_code=400, detail="Missing 'data' field")
        
        bookings = processor.parse_booking_data(data['data'])
        
        # Run multiple iterations for testing
        iterations = data.get('iterations', 1)
        results = []
        
        for _ in range(iterations):
            processor.clear_cache()  # Clear cache for each iteration
            result = processor.generate_boarding_sequence(bookings)
            results.append(result)
        
        # Calculate average metrics (server-side only)
        avg_time = sum(r['processingTime'] for r in results) / iterations
        avg_cache_hit_rate = sum(r['cacheStats']['hitRate'] for r in results) / iterations
        
        # Log performance metrics (server-side only)
        print(f"Performance Test - Bookings: {len(bookings)}, Iterations: {iterations}")
        print(f"Avg Time: {avg_time:.4f}s, Avg Cache Hit Rate: {avg_cache_hit_rate:.2%}")
        
        # Return only the final result without timing info
        final_result = processor.generate_boarding_sequence(bookings)
        efficiency = processor.analyze_boarding_efficiency(final_result['boardingSequence'])
        
        response = {
            'boardingSequence': final_result['boardingSequence'],
            'totalBookings': final_result['totalBookings'],
            'totalPassengers': final_result['totalPassengers'],
            'efficiency': efficiency,
            'testCompleted': True,
            'success': True
        }
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/benchmark")
async def benchmark_algorithms(data: dict):
    """Benchmark different algorithm implementations (timing hidden from frontend)"""
    try:
        if 'data' not in data:
            raise HTTPException(status_code=400, detail="Missing 'data' field")
        
        bookings = processor.parse_booking_data(data['data'])
        iterations = data.get('iterations', 10)
        
        # Test heap-based algorithm
        heap_times = []
        for _ in range(iterations):
            processor.clear_cache()
            start = time.time()
            result = processor.process_bookings_with_heap(bookings)
            heap_times.append(time.time() - start)
        
        avg_heap_time = sum(heap_times) / len(heap_times)
        
        # Log benchmark results (server-side only)
        print(f"Benchmark Results:")
        print(f"Bookings: {len(bookings)}, Iterations: {iterations}")
        print(f"Heap Algorithm - Avg Time: {avg_heap_time:.4f}s")
        
        # Return only success status (no timing data)
        final_result = processor.generate_boarding_sequence(bookings)
        efficiency = processor.analyze_boarding_efficiency(final_result['boardingSequence'])
        
        return {
            'boardingSequence': final_result['boardingSequence'],
            'totalBookings': final_result['totalBookings'],
            'totalPassengers': final_result['totalPassengers'],
            'efficiency': efficiency,
            'benchmarkCompleted': True,
            'success': True
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)