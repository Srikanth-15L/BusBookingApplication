# Bus Boarding Sequence Generator

A comprehensive system that generates optimal boarding sequences for bus passengers to minimize boarding time with a single front entry point.

## Features

- **Frontend Processing**: Client-side optimization using TypeScript
- **Backend API**: FastAPI backend for enhanced file processing and testing
- **File Upload**: Support for .txt and .csv booking data files
- **Visual Bus Layout**: Interactive seat map with boarding sequence visualization
- **Optimization Algorithm**: Smart sequencing based on seat distance from front entry
- **Dual Mode**: Automatic fallback between backend and frontend processing

## Quick Start

### Frontend Only
```bash
npm run dev
```

### Full Stack (Frontend + Backend)
```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

# Run both frontend and backend
npm run dev:full
```

### Backend Only
```bash
npm run dev:backend
```

## API Endpoints

- `POST /process-booking-data` - Process booking data from JSON
- `POST /upload-file` - Upload and process booking data files
- `POST /test-optimization` - Test optimization performance (hidden timing)
- `GET /health` - Backend health check

## Input Format

```
Booking_ID   Seats
101          A1,B1
120          A20,C2
150          D15,C15
```

## Algorithm

The system prioritizes passengers with seats furthest from the front entry:
1. Calculate distance for each seat (higher row numbers = further back)
2. For multi-seat bookings, use the furthest seat for sequencing
3. Sort by maximum distance (descending)
4. Break ties using booking ID (ascending)

This approach minimizes aisle blocking and reduces overall boarding time.
