import React, { useState } from 'react';
import { Upload, FileText, Server, Wifi, WifiOff, Zap, BarChart3 } from 'lucide-react';
import { ApiService } from '../services/api';

interface BookingInputProps {
  onDataSubmit: (data: string) => void;
  onApiResult: (result: any, efficiency?: any) => void;
}

export function BookingInput({ onDataSubmit, onApiResult }: BookingInputProps) {
  const [inputData, setInputData] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'online' | 'offline'>('unknown');
  const [isBenchmarking, setIsBenchmarking] = useState(false);

  const sampleData = `Booking_ID   Seats
101	A1,B1
120	A20,C2
150	D15,C15
200	B5,A5
300	C18,D18`;

  // Check backend status on component mount
  React.useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      await ApiService.healthCheck();
      setBackendStatus('online');
    } catch (error) {
      setBackendStatus('offline');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (useBackend && backendStatus === 'online') {
        handleBackendFileUpload(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFileContent(content);
          setInputData(content);
        };
        reader.readAsText(file);
      }
    }
  };

  const handleBackendFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const result = await ApiService.uploadFile(file);
      onApiResult(result);
      setInputData(''); // Clear input since we're using backend result
    } catch (error) {
      console.error('Backend file upload failed:', error);
      // Fallback to frontend processing
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
        setInputData(content);
      };
      reader.readAsText(file);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (inputData.trim()) {
      if (useBackend && backendStatus === 'online') {
        setIsLoading(true);
        try {
          const result = await ApiService.processBookingData(inputData);
          onApiResult(result, result.efficiency);
        } catch (error) {
          console.error('Backend processing failed:', error);
          // Fallback to frontend processing
          onDataSubmit(inputData);
        } finally {
          setIsLoading(false);
        }
      } else {
        onDataSubmit(inputData);
      }
    }
  };

  const handleBenchmark = async () => {
    if (inputData.trim() && useBackend && backendStatus === 'online') {
      setIsBenchmarking(true);
      try {
        const result = await ApiService.benchmarkAlgorithms(inputData, 10);
        onApiResult(result, result.efficiency);
      } catch (error) {
        console.error('Benchmark failed:', error);
      } finally {
        setIsBenchmarking(false);
      }
    }
  };

  const loadSample = () => {
    setInputData(sampleData);
    setFileContent(sampleData);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Booking Data Input</h2>
      
      {/* Backend toggle */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">Backend Processing</span>
            <div className="flex items-center gap-1">
              {backendStatus === 'online' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : backendStatus === 'offline' ? (
                <WifiOff className="h-4 w-4 text-red-500" />
              ) : (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              )}
              <span className={`text-xs ${
                backendStatus === 'online' ? 'text-green-600' : 
                backendStatus === 'offline' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {backendStatus === 'online' ? 'Online' : 
                 backendStatus === 'offline' ? 'Offline' : 'Checking...'}
              </span>
            </div>
          </div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={useBackend}
              onChange={(e) => setUseBackend(e.target.checked)}
              disabled={backendStatus !== 'online'}
              className="sr-only"
            />
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              useBackend && backendStatus === 'online' ? 'bg-blue-600' : 'bg-gray-300'
            } ${backendStatus !== 'online' ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                useBackend && backendStatus === 'online' ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </div>
          </label>
        </div>
        {backendStatus === 'offline' && (
          <p className="text-xs text-gray-600 mt-1">
            Backend unavailable. Using frontend processing.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {/* File upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-center">
            <label className="cursor-pointer flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Upload booking data file</span>
              <input
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Text input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or paste booking data:
          </label>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-md font-mono text-sm"
            placeholder="Booking_ID   Seats&#10;101	A1,B1&#10;120	A20,C2"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={loadSample}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Load Sample Data
          </button>
          
          {useBackend && backendStatus === 'online' && (
            <button
              onClick={handleBenchmark}
              disabled={!inputData.trim() || isBenchmarking}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isBenchmarking && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <BarChart3 className="h-4 w-4" />
              {isBenchmarking ? 'Benchmarking...' : 'Benchmark'}
            </button>
          )}
          
          <button
            onClick={handleSubmit}
            disabled={!inputData.trim() || isLoading || isBenchmarking}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <Zap className="h-4 w-4" />
            {isLoading ? 'Processing...' : 'Generate Boarding Sequence'}
          </button>
        </div>
      </div>
    </div>
  );
}