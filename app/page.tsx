"use client";

import { useState, useEffect } from "react";
import Apisidebar from "./components/apiSidebar";
import ApiTestBar from "./components/apitestbar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./components/ui/sheet";

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

export default function Home() {
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Check if the current device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Consider devices below 768px as mobile
    };
    
    // Set initial value
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleRequestSelect = (request: RequestItem) => {
    setSelectedRequest(request);
    setIsSheetOpen(false); // Close the sheet when a request is selected on mobile
  };

  // This function will be called after a request is completed
  const handleRequestComplete = () => {
    // Just increment the counter, don't do anything that would cause a full page reload
    setRefreshCounter(prev => prev + 1);
    console.log("Request completed, refreshing sidebar data with trigger:", refreshCounter + 1);
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar - Only visible on larger screens */}
      <div className="hidden lg:block">
        <Apisidebar
          onRequestSelect={handleRequestSelect}
          refreshTrigger={refreshCounter}
        />
      </div>
      
      {/* Mobile Sheet Navigation - Only visible on mobile */}
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <button className="fixed top-4 left-4 z-10 bg-gray-800 p-2 rounded-md text-gray-200 hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </SheetTrigger>
          
          <SheetContent side="left" className="p-0 w-64 bg-gray-900 border-r-gray-700">
            <SheetHeader className="border-b border-gray-700 p-3">
              <SheetTitle className="text-gray-200">API Testing Tool</SheetTitle>
            </SheetHeader>
            
            {/* Include the Apisidebar component inside the Sheet */}
            <div className="h-[calc(100vh-4rem)]">
              <Apisidebar
                onRequestSelect={handleRequestSelect}
                refreshTrigger={refreshCounter}
                isMobile={true}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main content area */}
      <div className={`flex-1 p-4 bg-gray-100 ${!isMobile ? '' : 'ml-0'}`}>
        <ApiTestBar
          initialRequest={selectedRequest ? {
            id: selectedRequest.id,
            method: selectedRequest.method,
            url: selectedRequest.url,
            headers: selectedRequest.headers,
            body: selectedRequest.requestBody
          } : undefined}
          onRequestComplete={handleRequestComplete}
        />
      </div>
    </div>
  );
}
