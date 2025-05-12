import { Router } from 'express';
import axios from 'axios';
import { RequestLog } from '../entities/RequestLog';
import { EntityManager } from '@mikro-orm/core';

const router = Router();

import { body, validationResult } from 'express-validator';

router.post('/request', [
    body('url').isURL().withMessage('Must be a valid URL'),
    body('method').isIn(['GET', 'POST', 'PUT', 'DELETE']).withMessage('Invalid HTTP method'),
    body('headers').optional().isObject().withMessage('Headers must be an object'),
    body('requestBody').optional().isObject().withMessage('Request body must be an object'),
], async (req: any, res: any) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((error: any) => ({
            field: error.path,
            message: error.msg,
            location: error.location,
        }));

        return res.status(400).json({ errors: formattedErrors });
    }
    const em = req.app.get('em') as EntityManager;

    const { method, url, headers, requestBody, clientId } = req.body;
    
    // Move the timer initialization outside the try-catch block
    const startTime = Date.now();

    try {
        // Make the actual HTTP request using axios
        const response = await axios({
            method,
            url,
            headers,
            data: requestBody,
        });
        
        // Calculate response time
        const responseTime = Date.now() - startTime;

        // Find existing log by clientId or create new one
        let log: RequestLog | null = null;
        
        // If clientId provided, try to find the existing log
        if (clientId) {
            const id = parseInt(clientId, 10);
            if (!isNaN(id)) {
                log = await em.findOne(RequestLog, { id });
            }
        }
        
        if (log) {
            // Update existing log
            log.method = method;
            log.url = url;
            log.headers = headers;
            log.requestBody = requestBody;
            log.responseBody = response.data;
            log.statusCode = response.status;
            log.responseTime = responseTime;
            log.timestamp = new Date(); // Update timestamp
            
            await em.flush();
            
            // Send back the response to the client
            res.status(response.status).json({
                message: 'Request successful and log updated!',
                response: response.data,
                clientId: log.id.toString(), // Return the ID for future updates
                log
            });
        } else {
            // Create new log (when no clientId is provided or it doesn't match any record)
            log = new RequestLog();
            log.method = method;
            log.url = url;
            log.headers = headers;
            log.requestBody = requestBody;
            log.responseBody = response.data;
            log.statusCode = response.status;
            log.responseTime = responseTime;

            await em.persistAndFlush(log);

            // Send back the response to the client
            res.status(response.status).json({
                message: 'Request successful and new log created!',
                response: response.data,
                clientId: log.id.toString(), // Return the ID for future updates
                log
            });
        }
    } catch (error: any) {
        // Calculate response time even for failed requests
        console.log('Error:', error.message);
        console.log('Error response:', error.response?.data);
        const responseTime = Date.now() - startTime;

        // Find existing log by clientId or create new one for error cases too
        let log: RequestLog | null = null;
        
        // If clientId provided, try to find the existing log
        if (clientId) {
            const id = parseInt(clientId, 10);
            if (!isNaN(id)) {
                log = await em.findOne(RequestLog, { id });
            }
        }
        
        if (log) {
            // Update existing log with error details
            log.method = method;
            log.url = url;
            log.headers = headers;
            log.requestBody = requestBody;
            log.responseBody = error.response?.data || { error: error.message };
            log.statusCode = error.response?.status || 500;
            log.responseTime = responseTime;
            log.timestamp = new Date(); // Update timestamp
            
            await em.flush();
            
            // Send error response
            res.status(error.response?.status || 500).json({
                message: 'Request failed and log updated!',
                responseTime,
                error: error.response?.data,
                clientId: log.id.toString(),
                log
            });
        } else {
            // Create new log for error (when no clientId is provided or it doesn't match any record)
            log = new RequestLog();
            log.method = method;
            log.url = url;
            log.headers = headers;
            log.requestBody = requestBody;
            log.responseBody = error.response?.data || { error: error.message };
            log.statusCode = error.response?.status || 500;
            log.responseTime = responseTime;

            await em.persistAndFlush(log);

            // Send error response
            res.status(error.response?.status || 500).json({
                message: 'Request failed and new log created!',
                responseTime,
                error: error.response?.data,
                clientId: log.id.toString(),
                log
            });
        }
    }
});

export default router;
