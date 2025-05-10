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

    const { method, url, headers, requestBody } = req.body;
    
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

        // Log the request and response in the database
        const log = new RequestLog();
        log.method = method;
        log.url = url;
        log.headers = headers;
        log.requestBody = requestBody;
        log.responseBody = response.data;
        log.statusCode = response.status;
        log.responseTime = responseTime; // Add the measured response time

        await em.persistAndFlush(log);

        // Send back the response to the client
        res.status(response.status).json({
            message: 'Request successful and logged!',
            response: response.data,
        });
    } catch (error: any) {
        // Calculate response time even for failed requests
        const responseTime = Date.now() - startTime; // This requires startTime to be defined above

        // Log the error in case of failure
        const log = new RequestLog();
        log.method = method;
        log.url = url;
        log.headers = headers;
        log.requestBody = requestBody;
        log.responseBody = error.response?.data || error.message;
        log.statusCode = error.response?.status || 500;
        log.responseTime = responseTime; // Add the measured response time

        await em.persistAndFlush(log);

        // Send error response
        res.status(500).json({
            message: 'Request failed and logged!',
            error: error.response?.data || error.message,
        });
    }
});

export default router;
