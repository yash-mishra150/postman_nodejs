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
    const { method, url, headers, requestBody } = req.body;
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
        // Log the request and response in the database
        const log = new RequestLog_1.RequestLog();
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
    }
    catch (error) {
        // Calculate response time even for failed requests
        const responseTime = Date.now() - startTime; // This requires startTime to be defined above
        // Log the error in case of failure
        const log = new RequestLog_1.RequestLog();
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
exports.default = router;
