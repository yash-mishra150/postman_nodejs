"use client";

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface ApiTestBarProps {
    initialRequest?: {
        id: number;
        method: string;
        url: string;
        headers?: Record<string, string>;
        body?: any;
    };
    onRequestComplete: () => void; // Add this callback prop
}

const ApiTestBar = ({ initialRequest, onRequestComplete }: ApiTestBarProps) => {
    const [clientId, setClientId] = useState<number | undefined>(initialRequest?.id || undefined);
    const [method, setMethod] = useState(initialRequest?.method || 'GET');
    const [url, setUrl] = useState(initialRequest?.url || 'https://jsonplaceholder.typicode.com/todos/1');
    const [headers, setHeaders] = useState<{ key: string; value: string }[]>(
        Object.entries(initialRequest?.headers || {}).map(([key, value]) => ({ key, value })) || []
    );
    const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>([]);
    const [bodyContent, setBodyContent] = useState(initialRequest?.body ? JSON.stringify(initialRequest.body, null, 2) : '');
    const [activeTab, setActiveTab] = useState('queryParams'); // 'queryParams', 'headers', 'body'
    const [isLoading, setIsLoading] = useState(false);
    const [activeResponseTab, setActiveResponseTab] = useState('responseBody'); // 'responseBody', 'responseHeader'

    // Add this ref to preserve the response between re-renders
    const responseRef = useRef<{
        status?: number;
        time?: number;
        size?: string;
        body?: any;
        headers?: Record<string, string>;
    }>({});

    // Keep the regular state for rendering
    const [response, setResponse] = useState<{
        status?: number;
        time?: number;
        size?: string;
        body?: any;
        headers?: Record<string, string>;
    }>({});

    // Add empty row if all rows have values
    useEffect(() => {
        if (activeTab === 'queryParams' && queryParams.every(param => param.key || param.value)) {
            setQueryParams([...queryParams, { key: '', value: '' }]);
        } else if (activeTab === 'headers' && headers.every(header => header.key || header.value)) {
            setHeaders([...headers, { key: '', value: '' }]);
        }
    }, [queryParams, headers, activeTab]);

    // Update the initialRequest effect to preserve response state
    useEffect(() => {
        if (initialRequest) {
            setMethod(initialRequest.method);
            setUrl(initialRequest.url);
            setClientId(initialRequest.id);

            // Update headers
            const newHeaders = Object.entries(initialRequest.headers || {})
                .map(([key, value]) => ({ key, value }));
            if (newHeaders.length > 0) {
                setHeaders(newHeaders);
            } else {
                setHeaders([{ key: '', value: '' }]);
            }

            // Update body if provided
            if (initialRequest.body) {
                setBodyContent(JSON.stringify(initialRequest.body, null, 2));
            } else {
                setBodyContent('');
            }

            // IMPORTANT: Only reset response when explicitly switching requests
            // Don't reset when the parent component re-renders for other reasons
            if (initialRequest.id !== clientId) {
                setResponse({});
                setActiveResponseTab('responseBody');
            }
        }
    }, [initialRequest]);

    const handleQueryParamChange = (index: number, field: 'key' | 'value', value: string) => {
        const newParams = [...queryParams];
        newParams[index] = { ...newParams[index], [field]: value };
        setQueryParams(newParams);
    };

    const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers];
        newHeaders[index] = { ...newHeaders[index], [field]: value };
        setHeaders(newHeaders);
    };

    const handleRemoveParam = (index: number) => {
        if (activeTab === 'queryParams') {
            setQueryParams(queryParams.filter((_, i) => i !== index));
        } else if (activeTab === 'headers') {
            setHeaders(headers.filter((_, i) => i !== index));
        }
    };

    const buildUrl = () => {
        try {
            const urlObj = new URL(url);
            // Clear existing query params
            urlObj.search = '';
            // Add query params
            queryParams.forEach(param => {
                if (param.key && param.value) {
                    urlObj.searchParams.append(param.key, param.value);
                }
            });
            return urlObj.toString();
        } catch (e) {
            return url;
        }
    };

    // Modify the response setters to update both state and ref
    const updateResponse = (newResponse: any) => {
        responseRef.current = newResponse;
        setResponse(newResponse);
    };

    const handleSend = async () => {
        setIsLoading(true);
        const startTime = performance.now();

        try {
            // Validate URL
            let finalUrl;
            try {
                finalUrl = buildUrl();
                new URL(finalUrl); // This will throw if URL is invalid
            } catch (e) {
                throw new Error("Invalid URL. Please enter a valid URL including protocol (e.g., https://)");
            }

            // Prepare the headers from the form as a proper object
            const requestHeaders: Record<string, string> = {};
            headers.forEach(header => {
                if (header.key && header.value) {
                    requestHeaders[header.key] = header.value;
                }
            });

            // Validate method
            if (!['GET', 'POST', 'PUT', 'DELETE'].includes(method)) {
                throw new Error("Invalid HTTP method");
            }

            // Prepare the request body based on the selected method
            let parsedBody = {};
            if (method !== 'GET' && method !== 'HEAD' && bodyContent) {
                try {
                    // Try to parse as JSON
                    parsedBody = JSON.parse(bodyContent);
                    // Validate that it's an object
                    if (typeof parsedBody !== 'object' || Array.isArray(parsedBody) || parsedBody === null) {
                        throw new Error();
                    }
                } catch (e) {
                    // If not valid JSON object, create a default object with text content
                    parsedBody = { data: bodyContent };
                }
            }

            // Create the request object to send to the API - strictly following the required format
            const requestPayload = {
                ...(clientId !== undefined ? { clientId } : {}), // Include clientId only if it's defined
                method,
                url: finalUrl,
                headers: requestHeaders,
                requestBody: parsedBody
            };

            console.log('Request payload:', requestPayload);

            // Send the request to the custom API endpoint using axios
            const apiResponse = await axios.post('/api/proxy', {
                endpoint: '/api/request',
                method: 'POST',
                requestBody: requestPayload
            });

            const endTime = performance.now();

            console.log('API Response:', apiResponse.data);

            // Extract the actual response data - change this part
            const actualResponse = apiResponse.data.response || apiResponse.data;

            // Format headers if they exist
            const responseHeaders: Record<string, string> = {};
            if (actualResponse.headers) {
                Object.entries(actualResponse.headers).forEach(([key, value]) => {
                    if (typeof value === 'string') {
                        responseHeaders[key] = value;
                    } else if (Array.isArray(value)) {
                        responseHeaders[key] = value.join(', ');
                    } else if (value !== null && typeof value === 'object') {
                        responseHeaders[key] = JSON.stringify(value);
                    }
                });
            }

            // Get response body and determine its size
            // More robust response body extraction
            let responseBody;
            if (actualResponse.data !== undefined) {
                responseBody = actualResponse.data;
            } else if (typeof actualResponse === 'object') {
                responseBody = actualResponse;
            } else {
                responseBody = { response: actualResponse };
            }

            let responseSize = 0;
            if (responseBody) {
                const bodyStr = typeof responseBody === 'object' ?
                    JSON.stringify(responseBody) : String(responseBody);
                responseSize = new TextEncoder().encode(bodyStr).length;
            }

            // Update both the state and ref
            updateResponse({
                status: actualResponse.status || 200,
                time: Math.round(endTime - startTime),
                size: `${responseSize} B`,
                body: responseBody,
                headers: responseHeaders
            });

        } catch (error) {
            console.error('Error making request:', error);

            if (axios.isAxiosError(error)) {
                // Handle axios errors
                const errorResponse = error.response;
                let errorBody = errorResponse?.data || { error: error.message };

                updateResponse({
                    status: errorResponse?.status || 500,
                    time: errorBody?.responseTime,
                    size: `${new TextEncoder().encode(JSON.stringify(errorBody)).length} B`,
                    body: errorBody?.error,
                    headers: Object.fromEntries(
                        Object.entries(errorResponse?.headers || {}).map(([key, value]) => [key, String(value)])
                    )
                });
            } else {
                // Handle other types of errors
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';

                // Check if error message contains JSON
                let errorBody;
                if (typeof errorMessage === 'string' && errorMessage.includes('{')) {
                    try {
                        const jsonStart = errorMessage.indexOf('{');
                        const jsonEnd = errorMessage.lastIndexOf('}') + 1;
                        const jsonStr = errorMessage.substring(jsonStart, jsonEnd);
                        errorBody = JSON.parse(jsonStr);
                    } catch (e) {
                        errorBody = { error: errorMessage };
                    }
                } else {
                    errorBody = { error: errorMessage };
                }

                updateResponse({
                    status: 500,
                    time: 0,
                    size: `${new TextEncoder().encode(JSON.stringify(errorBody)).length} B`,
                    body: errorBody,
                    headers: {}
                });
            }
        } finally {
            setIsLoading(false);

            setTimeout(() => {
                if (onRequestComplete) {
                    onRequestComplete();
                }
            }, 100); // Reduced from 1000ms to 100ms
        }
    };

    const getStatusColor = (status?: number) => {
        if (!status) return 'text-gray-500';
        if (status >= 200 && status < 300) return 'text-green-600';
        if (status >= 300 && status < 400) return 'text-blue-600';
        if (status >= 400 && status < 500) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-md lg:mt-0 mt-12 shadow p-2 sm:p-4">
            {/* Request Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                <div className="relative w-full sm:w-auto">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full sm:w-auto appearance-none bg-gray-100 border border-gray-300 rounded px-3 sm:px-4 py-2 pr-8 font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-800"
                    >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                    </div>
                </div>
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter request URL"
                    className="w-full flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-gray-800 hover:bg-gray-600 text-white font-medium py-2 px-4 sm:px-6 rounded focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-opacity-50"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                            </svg>
                            Sending
                        </span>
                    ) : 'Send'}
                </button>
            </div>

            {/* Tabs */}
            <div className="border border-gray-300 rounded mb-6">
                <div className="flex overflow-x-auto border-b border-gray-300">
                    <button
                        className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'queryParams' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab('queryParams')}
                    >
                        Query Params
                    </button>
                    <button
                        className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'headers' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab('headers')}
                    >
                        Headers
                    </button>
                    <button
                        className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${activeTab === 'body' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                        onClick={() => setActiveTab('body')}
                    >
                        Body
                    </button>
                </div>

                <div className="p-3 sm:p-4">
                    {activeTab === 'queryParams' && (
                        <div>
                            {queryParams.map((param, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={param.key}
                                        placeholder="Key"
                                        onChange={(e) => handleQueryParamChange(index, 'key', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                    />
                                    <input
                                        type="text"
                                        value={param.value}
                                        placeholder="Value"
                                        onChange={(e) => handleQueryParamChange(index, 'value', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                    />
                                    <button
                                        onClick={() => handleRemoveParam(index)}
                                        className="text-red-500 hover:text-red-700 px-3 py-2 rounded"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setQueryParams([...queryParams, { key: '', value: '' }])}
                                className="text-gray-800 hover:text-gray-700 font-medium text-sm"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    {activeTab === 'headers' && (
                        <div>
                            {headers.map((header, index) => (
                                <div key={index} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={header.key}
                                        placeholder="Key"
                                        onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                    />
                                    <input
                                        type="text"
                                        value={header.value}
                                        placeholder="Value"
                                        onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                                    />
                                    <button
                                        onClick={() => handleRemoveParam(index)}
                                        className="text-red-500 hover:text-red-700 px-3 py-2 rounded"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                                className="text-gray-800 hover:text-gray-700 font-medium text-sm"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    {activeTab === 'body' && (
                        <textarea
                            value={bodyContent}
                            onChange={(e) => setBodyContent(e.target.value)}
                            className="w-full h-32 font-mono text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-gray-800"
                            placeholder="Enter request body (JSON)"
                        />
                    )}
                </div>
            </div>

            {/* Response Section */}
            <div>
                <h2 className="font-bold text-lg mb-2">Response</h2>

                {response.status !== undefined && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                        <div className="flex items-center">
                            <span className="text-gray-600 mr-1">Status:</span>
                            <span className={`font-medium ${getStatusColor(response.status)}`}>
                                {response.status}
                            </span>
                        </div>

                        {response.time && (
                            <div className="flex items-center">
                                <span className="text-gray-600 mr-1">Time:</span>
                                <span className="font-medium">{response.time} ms</span>
                            </div>
                        )}

                        {response.size && (
                            <div className="flex items-center">
                                <span className="text-gray-600 mr-1">Size:</span>
                                <span className="font-medium">{response.size}</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="border border-gray-300 rounded">
                    <div className="flex overflow-x-auto border-b border-gray-300">
                        <button
                            className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${activeResponseTab === 'responseBody' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveResponseTab('responseBody')}
                        >
                            Response Body
                        </button>
                        <button
                            className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm whitespace-nowrap ${activeResponseTab === 'responseHeader' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-600 hover:text-gray-800'}`}
                            onClick={() => setActiveResponseTab('responseHeader')}
                        >
                            Response Header
                        </button>
                    </div>

                    <div className="bg-gray-50 overflow-hidden w-full">
                        {activeResponseTab === 'responseBody' && (
                            <pre className="text-xs sm:text-sm p-3 sm:p-4 font-mono overflow-auto max-h-[33vh] w-full whitespace-pre-wrap break-words">
                                {response.body ? JSON.stringify(response.body, null, 2) : ''}
                            </pre>
                        )}

                        {activeResponseTab === 'responseHeader' && response.headers && (
                            <div className="p-3 sm:p-4 overflow-auto max-h-[33vh]">
                                {Object.entries(response.headers).map(([key, value]) => (
                                    <div key={key} className="mb-1 break-words">
                                        <span className="font-medium text-gray-700">{key}:</span> {value}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiTestBar;