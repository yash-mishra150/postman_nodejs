"use client";

import * as React from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
console.log(process.env.API_BASE);

interface RequestItem {
  id: number;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers: {
    [key: string]: string;
  };
  requestBody?: any;
  responseBody?: any;
  statusCode: number;
  timestamp: string;
  responseTime: number;
  error: string | null;
}

interface ApisidebarProps {
  onRequestSelect?: (request: RequestItem) => void;
  refreshTrigger?: number;
  isMobile?: boolean;
}

const Apisidebar = ({ onRequestSelect, refreshTrigger, isMobile = false }: ApisidebarProps) => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch request data
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/proxy', {
        endpoint: '/api/log',
        method: 'GET',
        params: {
          page: currentPage,
          limit: itemsPerPage,
          _t: refreshTrigger
        }
      });
      
      const data = response.data;
      console.log('API Response:', data);
      
      // Use functional update to avoid stale closures
      setRequests(data.logs || []);
      
      // If total count is available in the API response
      if (data.total) {
        setTotalCount(data.total);
      } else {
        // Estimate based on current data
        setTotalCount((currentPage * itemsPerPage) + 
          (data.logs?.length < itemsPerPage ? 0 : itemsPerPage));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, refreshTrigger]);

  // Update this useEffect to be more specific about what it's refreshing
  useEffect(() => {
    // Only fetch requests when refreshTrigger changes, not on initial mount
    if (refreshTrigger !== undefined) {
      console.log("Refresh trigger changed, fetching latest data...");
      // Keep current page when refreshing via trigger
      fetchRequests();
    }
  }, [refreshTrigger, fetchRequests]);

  // Separate useEffect for page changes
  useEffect(() => {
    console.log("Page changed, fetching data for page:", currentPage);
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, fetchRequests]);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-purple-500';
      case 'POST': return 'text-teal-500';
      case 'PUT': return 'text-blue-500';
      case 'DELETE': return 'text-red-500';
      case 'PATCH': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-500';
    if (statusCode >= 300 && statusCode < 400) return 'text-blue-500';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-500';
    if (statusCode >= 500) return 'text-red-500';
    return 'text-gray-500';
  };

  const handleRequestClick = (request: RequestItem) => {
    if (onRequestSelect) {
      onRequestSelect(request);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request =>
      request.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.method.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Format the URL to get a display name
  const getDisplayName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split('/').filter(Boolean);
      return pathSegments.length > 0
        ? pathSegments[pathSegments.length - 1]
        : urlObj.hostname;
    } catch (e) {
      return url;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`
      border-r-2 border-gray-700 bg-gray-900 text-gray-300 flex flex-col h-full
      ${isMobile ? '' : 'w-72'}
    `}>
      {/* Remove the title as it's now handled by the Sheet header for mobile */}
      {!isMobile && (
        <div className='p-2 flex items-center justify-between border-b border-gray-700'>
          <div className='flex items-center space-x-2'>
            <span className='font-bold'>API Testing Tool</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      <div className='p-2'>
        <div className='flex gap-2'>
          <div className='relative flex-grow'>
            <input 
              type="text" 
              placeholder="Filter" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full bg-gray-800 border border-gray-700 rounded py-1 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500'
            />
            <button className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500'>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
          </div>
          <button 
            onClick={() => onRequestSelect && onRequestSelect({ 
              id: 0,  // Use 0 or null for new requests
              method: 'GET',
              url: '',
              headers: {},
              statusCode: 0,
              timestamp: new Date().toISOString(),
              responseTime: 0,
              error: null
            })}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded p-1 text-gray-300"
            title="New Request"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      <div className='overflow-y-auto flex-grow'>
        {isLoading ? (
          <div className="animate-pulse p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col px-4 py-2 mb-2 bg-gray-800 rounded">
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            <p>{error}</p>
            <button
              onClick={fetchRequests}
              className="mt-2 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
            >
              Retry
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No matching requests found" : "No requests available"}
          </div>
        ) : (
          <>
            {/* API Requests */}
            {filteredRequests.map(request => (
              <div
                key={request.id}
                className='flex flex-col px-4 py-2 hover:bg-gray-800 cursor-pointer border-b border-gray-800'
                onClick={() => handleRequestClick(request)}
              >
                <div className='flex items-center'>
                  <span className={`w-12 font-mono text-xs font-semibold ${getMethodColor(request.method)}`}>
                    {request.method}
                  </span>
                  <span className='text-sm truncate flex-grow'>{getDisplayName(request.url)}</span>
                  <span className={`text-xs font-semibold ${getStatusColor(request.statusCode)}`}>
                    {request.statusCode}
                  </span>
                </div>
                <div className='flex items-center mt-1'>
                  <span className='text-xs text-gray-500'>{formatDate(request.timestamp)}</span>
                  <span className='text-xs text-gray-500 ml-2'>{request.responseTime}ms</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Pagination Controls */}
        <div className='flex justify-between items-center px-4 py-2 border-t border-gray-800 mt-2'>
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded text-xs ${currentPage === 1 ? 'text-gray-600' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            &lt; Prev
          </button>
          <span className='text-xs text-gray-500'>
            {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded text-xs ${currentPage === totalPages ? 'text-gray-600' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
};

export default Apisidebar;