import pytest
import sys
import os
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app, BookingProcessor, OptimizedBoardingProcessor

client = TestClient(app)

class TestBookingProcessor:
    def setup_method(self):
        self.processor = BookingProcessor()
    
    def test_calculate_seat_distance(self):
        """Test seat distance calculation"""
        assert self.processor.calculate_seat_distance('A1') == 1.3
        assert self.processor.calculate_seat_distance('D20') == 20.0
        assert self.processor.calculate_seat_distance('B10') == 10.2
        assert self.processor.calculate_seat_distance('C5') == 5.1
    
    def test_invalid_seat_format(self):
        """Test invalid seat format handling"""
        with pytest.raises(ValueError, match="Invalid seat format"):
            self.processor.calculate_seat_distance('Z99')
        
        with pytest.raises(ValueError, match="Invalid seat format"):
            self.processor.calculate_seat_distance('A')
        
        with pytest.raises(ValueError, match="Invalid seat format"):
            self.processor.calculate_seat_distance('123')
    
    def test_parse_booking_data_standard_format(self):
        """Test parsing standard tab-separated format"""
        data = """Booking_ID\tSeats
101\tA1,B1
120\tA20,C2"""
        
        bookings = self.processor.parse_booking_data(data)
        assert len(bookings) == 2
        assert bookings[0] == {'bookingId': '101', 'seats': ['A1', 'B1']}
        assert bookings[1] == {'bookingId': '120', 'seats': ['A20', 'C2']}
    
    def test_parse_booking_data_csv_format(self):
        """Test parsing CSV format with quotes"""
        data = """Booking_ID,Seats
101,"A1,B1"
120, "A20,C2" """
        
        bookings = self.processor.parse_booking_data(data)
        assert len(bookings) == 2
        assert bookings[0] == {'bookingId': '101', 'seats': ['A1', 'B1']}
        assert bookings[1] == {'bookingId': '120', 'seats': ['A20', 'C2']}
    
    def test_parse_booking_data_space_separated(self):
        """Test parsing space-separated format"""
        data = """Booking_ID Seats
101 A1 B1
120 A20 C2"""
        
        bookings = self.processor.parse_booking_data(data)
        assert len(bookings) == 2
        assert bookings[0] == {'bookingId': '101', 'seats': ['A1', 'B1']}
        assert bookings[1] == {'bookingId': '120', 'seats': ['A20', 'C2']}
    
    def test_parse_booking_data_mixed_formats(self):
        """Test parsing mixed formats"""
        data = """Booking_ID,Seats
101,"A1,B1"
120 A20,C2
130\tD15,C15"""
        
        bookings = self.processor.parse_booking_data(data)
        assert len(bookings) == 3
        assert bookings[0]['seats'] == ['A1', 'B1']
        assert bookings[1]['seats'] == ['A20', 'C2']
        assert bookings[2]['seats'] == ['D15', 'C15']
    
    def test_parse_booking_data_skip_invalid(self):
        """Test skipping invalid data"""
        data = """Booking_ID Seats
101 A1,B1

120 A20,C2
invalid line
130 D15,C15"""
        
        bookings = self.processor.parse_booking_data(data)
        assert len(bookings) == 3
    
    def test_parse_booking_data_duplicate_ids(self):
        """Test handling duplicate booking IDs"""
        data = """Booking_ID Seats
101 A1,B1
101 A2,B2
120 A20,C2"""
        
        bookings = self.processor.parse_booking_data(data)
        assert len(bookings) == 2  # Duplicate should be skipped
        assert bookings[0]['bookingId'] == '101'
        assert bookings[1]['bookingId'] == '120'
    
    def test_parse_booking_data_invalid_seats(self):
        """Test filtering invalid seat formats"""
        data = """Booking_ID Seats
101 A1,B1,Z99
120 A20,C2"""
        
        bookings = self.processor.parse_booking_data(data)
        assert bookings[0]['seats'] == ['A1', 'B1']  # Z99 should be filtered out
    
    def test_generate_boarding_sequence(self):
        """Test boarding sequence generation"""
        bookings = [
            {'bookingId': '101', 'seats': ['A1', 'B1']},
            {'bookingId': '120', 'seats': ['A20', 'C2']},
            {'bookingId': '150', 'seats': ['D15', 'C15']}
        ]
        
        result = self.processor.generate_boarding_sequence(bookings)
        sequence = result['boardingSequence']
        
        assert len(sequence) == 3
        assert sequence[0]['sequence'] == 1
        assert sequence[1]['sequence'] == 2
        assert sequence[2]['sequence'] == 3
        
        # Should be ordered by max distance (descending)
        assert sequence[0]['maxDistance'] >= sequence[1]['maxDistance']
        assert sequence[1]['maxDistance'] >= sequence[2]['maxDistance']
    
    def test_generate_boarding_sequence_single_booking(self):
        """Test single booking sequence"""
        bookings = [{'bookingId': '101', 'seats': ['A10', 'B10']}]
        
        result = self.processor.generate_boarding_sequence(bookings)
        sequence = result['boardingSequence']
        
        assert len(sequence) == 1
        assert sequence[0]['sequence'] == 1
        assert sequence[0]['bookingId'] == '101'
        assert sequence[0]['seats'] == ['A10', 'B10']
        assert sequence[0]['maxDistance'] == 10.3
        assert sequence[0]['minDistance'] == 10.2
    
    def test_generate_boarding_sequence_empty(self):
        """Test empty bookings array"""
        result = self.processor.generate_boarding_sequence([])
        assert result['boardingSequence'] == []
        assert result['totalBookings'] == 0
        assert result['totalPassengers'] == 0
    
    def test_analyze_boarding_efficiency(self):
        """Test efficiency analysis"""
        sequence = [
            {
                'sequence': 1,
                'bookingId': '101',
                'seats': ['A20'],
                'maxDistance': 20.3,
                'minDistance': 20.3
            },
            {
                'sequence': 2,
                'bookingId': '102',
                'seats': ['A10'],
                'maxDistance': 10.3,
                'minDistance': 10.3
            }
        ]
        
        efficiency = self.processor.analyze_boarding_efficiency(sequence)
        
        assert efficiency['averageDistance'] == 15.3
        assert efficiency['optimalityScore'] == 100.0  # Perfect order
        assert efficiency['blockingPotential'] == 0.0  # No blocking
    
    def test_analyze_boarding_efficiency_empty(self):
        """Test efficiency analysis with empty sequence"""
        efficiency = self.processor.analyze_boarding_efficiency([])
        
        assert efficiency['averageDistance'] == 0
        assert efficiency['optimalityScore'] == 0
        assert efficiency['blockingPotential'] == 0


class TestOptimizedBoardingProcessor:
    def setup_method(self):
        self.processor = OptimizedBoardingProcessor()
    
    def test_seat_distance_caching(self):
        """Test seat distance caching functionality"""
        # Clear cache first
        self.processor.clear_cache()
        
        # First call should be a cache miss
        distance1 = self.processor.get_seat_distance('A10')
        assert distance1 == 10.3
        assert self.processor.cache_misses == 1
        assert self.processor.cache_hits == 0
        
        # Second call should be a cache hit
        distance2 = self.processor.get_seat_distance('A10')
        assert distance2 == 10.3
        assert self.processor.cache_hits == 1
        assert self.processor.cache_misses == 1
    
    def test_process_bookings_with_heap(self):
        """Test heap-based booking processing"""
        bookings = [
            {'bookingId': '101', 'seats': ['A1', 'B1']},
            {'bookingId': '120', 'seats': ['A20', 'C2']},
            {'bookingId': '150', 'seats': ['D15', 'C15']}
        ]
        
        result = self.processor.process_bookings_with_heap(bookings)
        sequence = result['boardingSequence']
        
        assert len(sequence) == 3
        assert result['totalBookings'] == 3
        assert result['totalPassengers'] == 6
        
        # Verify ordering (highest distance first)
        for i in range(len(sequence) - 1):
            assert sequence[i]['maxDistance'] >= sequence[i + 1]['maxDistance']
    
    def test_large_dataset_performance(self):
        """Test performance with large dataset"""
        bookings = []
        for i in range(1, 101):  # 100 bookings
            bookings.append({
                'bookingId': str(i),
                'seats': [f'A{i}', f'B{i}']
            })
        
        result = self.processor.process_bookings_with_heap(bookings)
        sequence = result['boardingSequence']
        
        assert len(sequence) == 100
        assert result['processingTime'] < 1.0  # Should be fast
        
        # Verify correct ordering
        for i in range(len(sequence) - 1):
            assert sequence[i]['maxDistance'] >= sequence[i + 1]['maxDistance']


class TestAPI:
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert response.json() == {
            "message": "Bus Boarding Optimizer API", 
            "status": "running"
        }
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
    
    def test_process_booking_data_success(self):
        """Test successful booking data processing"""
        data = {
            "data": "Booking_ID Seats\n101 A1,B1\n120 A20,C2"
        }
        
        response = client.post("/process-booking-data", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert "boardingSequence" in result
        assert "totalBookings" in result
        assert "totalPassengers" in result
        assert "efficiency" in result
        assert len(result["boardingSequence"]) == 2
    
    def test_process_booking_data_missing_field(self):
        """Test missing data field"""
        response = client.post("/process-booking-data", json={})
        assert response.status_code == 400
        assert "Missing 'data' field" in response.json()["detail"]
    
    def test_process_booking_data_invalid_format(self):
        """Test invalid booking data format"""
        data = {"data": "invalid data format"}
        
        response = client.post("/process-booking-data", json=data)
        # Should still return 200 but with empty results
        assert response.status_code == 200
        result = response.json()
        assert result["totalBookings"] == 0
    
    def test_upload_file_success(self):
        """Test successful file upload"""
        file_content = "Booking_ID,Seats\n101,\"A1,B1\"\n120,\"A20,C2\""
        files = {"file": ("test.csv", file_content, "text/csv")}
        
        response = client.post("/upload-file", files=files)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["filename"] == "test.csv"
        assert "boardingSequence" in result
    
    def test_upload_file_invalid_extension(self):
        """Test invalid file extension"""
        files = {"file": ("test.pdf", "content", "application/pdf")}
        
        response = client.post("/upload-file", files=files)
        assert response.status_code == 400
        assert "Only .txt and .csv files are supported" in response.json()["detail"]
    
    def test_test_optimization_success(self):
        """Test optimization testing endpoint"""
        data = {
            "data": "Booking_ID Seats\n101 A1,B1\n120 A20,C2",
            "iterations": 3
        }
        
        response = client.post("/test-optimization", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["testCompleted"] is True
        assert "boardingSequence" in result
    
    def test_benchmark_success(self):
        """Test benchmark endpoint"""
        data = {
            "data": "Booking_ID Seats\n101 A1,B1\n120 A20,C2",
            "iterations": 5
        }
        
        response = client.post("/benchmark", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["benchmarkCompleted"] is True
        assert "boardingSequence" in result


class TestIntegration:
    def test_end_to_end_csv_processing(self):
        """Test complete CSV processing workflow"""
        csv_content = '''Booking_ID,Seats
101,"A1,B1"
120, "A20,C2"
150,"D15,C15"'''
        
        files = {"file": ("bookings.csv", csv_content, "text/csv")}
        response = client.post("/upload-file", files=files)
        
        assert response.status_code == 200
        result = response.json()
        
        # Verify results
        assert result["success"] is True
        assert result["totalBookings"] == 3
        assert result["totalPassengers"] == 6
        assert len(result["boardingSequence"]) == 3
        
        # Verify ordering (back seats first)
        sequence = result["boardingSequence"]
        assert sequence[0]["maxDistance"] >= sequence[1]["maxDistance"]
        assert sequence[1]["maxDistance"] >= sequence[2]["maxDistance"]
    
    def test_end_to_end_complex_booking(self):
        """Test complex booking scenario"""
        data = {
            "data": """Booking_ID Seats
FAMILY001 A1,B1,C1,D1
COUPLE002 A20,B20
SINGLE003 D15
GROUP004 C10,D10,A10,B10"""
        }
        
        response = client.post("/process-booking-data", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert result["success"] is True
        assert result["totalBookings"] == 4
        assert result["totalPassengers"] == 10
        
        # Verify efficiency metrics
        efficiency = result["efficiency"]
        assert "averageDistance" in efficiency
        assert "blockingPotential" in efficiency
        assert "optimalityScore" in efficiency


if __name__ == "__main__":
    pytest.main([__file__, "-v"])