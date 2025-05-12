"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RequestLog_1 = require("../entities/RequestLog");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// POST /log — Save a new log or update existing based on clientId
router.post('/log', [
    (0, express_validator_1.body)('clientId')
        .isString().withMessage('Client ID must be a string')
        .notEmpty().withMessage('Client ID is required'),
    (0, express_validator_1.body)('method')
        .isString().withMessage('Method must be a string')
        .isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).withMessage('Invalid HTTP method'),
    (0, express_validator_1.body)('url')
        .isURL().withMessage('Invalid URL format'),
    (0, express_validator_1.body)('headers')
        .optional().isObject().withMessage('Headers must be an object'),
    (0, express_validator_1.body)('requestBody')
        .optional().isObject().withMessage('Request body must be an object'),
    (0, express_validator_1.body)('responseBody')
        .optional().isObject().withMessage('Response body must be an object'),
    (0, express_validator_1.body)('statusCode')
        .isInt({ min: 100, max: 599 }).withMessage('Invalid status code'),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
        return;
    }
    const em = req.app.get('em');
    const { clientId, method, url, headers, requestBody, responseBody, statusCode, } = req.body;
    try {
        // Store clientId in a custom field or use id if specified
        const id = clientId ? parseInt(clientId, 10) : undefined;
        // Try to find existing log with the same id if valid
        let log = null;
        if (id && !isNaN(id)) {
            log = await em.findOne(RequestLog_1.RequestLog, { id });
        }
        if (log) {
            // Update existing log
            Object.assign(log, {
                method,
                url,
                headers,
                requestBody,
                responseBody,
                statusCode,
                timestamp: new Date() // Update timestamp
            });
            await em.flush();
            res.status(200).json({ message: 'Log updated', log });
        }
        else {
            // Create new log
            log = new RequestLog_1.RequestLog();
            Object.assign(log, {
                method,
                url,
                headers,
                requestBody,
                responseBody,
                statusCode,
            });
            await em.persistAndFlush(log);
            res.status(201).json({
                message: 'Log saved',
                log,
                // Return the ID that should be used for future updates
                clientId: log.id.toString()
            });
        }
    }
    catch (error) {
        res.status(500).json({
            message: 'Error saving log',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// GET /log — Paginated log listing with optional clientId (which is really the id) filtering
router.get('/log', [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt(),
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
                location: err.location,
            })),
        });
        return;
    }
    const em = req.app.get('em');
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    // Filter by id if clientId provided (clientId is actually the id)
    const [logs, total] = await em.findAndCount(RequestLog_1.RequestLog, {}, {
        limit,
        offset: (page - 1) * limit,
        orderBy: { timestamp: 'desc' },
    });
    res.json({
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    });
});
// GET /log/:id — Get a specific log by ID (keep this for backward compatibility)
router.get('/log/:id', [
    (0, express_validator_1.param)('id')
        .isInt().withMessage('ID must be a string')
        .notEmpty().withMessage('ID is required')
], async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
                location: err.location,
            })),
        });
        return;
    }
    const em = req.app.get('em');
    const { id } = req.params;
    try {
        const log = await em.findOne(RequestLog_1.RequestLog, { id: Number(id) });
        if (!log) {
            res.status(404).json({ message: 'Log not found' });
            return;
        }
        res.json({
            log,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching log',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// DELETE /log/all — Delete all logs from the database
router.delete('/log/all', async (req, res) => {
    try {
        const em = req.app.get('em');
        // Get the total count before deletion
        const totalCount = await em.count(RequestLog_1.RequestLog);
        // Delete all logs
        await em.nativeDelete(RequestLog_1.RequestLog, {});
        res.status(200).json({
            message: 'All logs deleted successfully',
            deletedCount: totalCount
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error deleting logs',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
