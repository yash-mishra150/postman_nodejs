"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const RequestLog_1 = require("../entities/RequestLog");
const router = (0, express_1.Router)();
const express_validator_1 = require("express-validator");
router.post('/request', [
    (0, express_validator_1.body)('url').isURL().withMessage('Must be a valid URL'),
    (0, express_validator_1.body)('method').isIn(['GET', 'POST', 'PUT', 'DELETE']).withMessage('Invalid HTTP method'),
    (0, express_validator_1.body)('headers').optional().isObject().withMessage('Headers must be an object'),
    (0, express_validator_1.body)('requestBody').optional().isObject().withMessage('Request body must be an object'),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
            location: error.location,
        }));
        return res.status(400).json({ errors: formattedErrors });
    }
    const em = req.app.get('em');
    const { method, url, headers, requestBody, clientId } = req.body;
    // Move the timer initialization outside the try-catch block
    const startTime = Date.now();
    try {
        // Make the actual HTTP request using axios
        const response = await (0, axios_1.default)({
            method,
            url,
            headers,
            data: requestBody,
        });
        // Calculate response time
        const responseTime = Date.now() - startTime;
        // Find existing log by clientId or create new one
        let log = null;
        // If clientId provided, try to find the existing log
        if (clientId) {
            const id = parseInt(clientId, 10);
            if (!isNaN(id)) {
                log = await em.findOne(RequestLog_1.RequestLog, { id });
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
        }
        else {
            // Create new log (when no clientId is provided or it doesn't match any record)
            log = new RequestLog_1.RequestLog();
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
    }
    catch (error) {
        // Calculate response time even for failed requests
        console.log('Error:', error.message);
        console.log('Error response:', error.response?.data);
        const responseTime = Date.now() - startTime;
        // Find existing log by clientId or create new one for error cases too
        let log = null;
        // If clientId provided, try to find the existing log
        if (clientId) {
            const id = parseInt(clientId, 10);
            if (!isNaN(id)) {
                log = await em.findOne(RequestLog_1.RequestLog, { id });
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
        }
        else {
            // Create new log for error (when no clientId is provided or it doesn't match any record)
            log = new RequestLog_1.RequestLog();
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
exports.default = router;
