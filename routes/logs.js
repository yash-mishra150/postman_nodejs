"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const RequestLog_1 = require("../entities/RequestLog");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// POST /log — Save a new log
router.post('/log', [
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
    const { method, url, headers, requestBody, responseBody, statusCode, } = req.body;
    const log = new RequestLog_1.RequestLog();
    Object.assign(log, {
        method,
        url,
        headers,
        requestBody,
        responseBody,
        statusCode,
    });
    await em.persistAndFlush(log);
    res.status(201).json({ message: 'Log saved', log });
});
// GET /log — Paginated log listing
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
// GET /log/:id — Get a specific log by ID
router.get('/log/:id', [
    (0, express_validator_1.param)('id')
        .isInt().withMessage('ID must be a string')
        .notEmpty().withMessage('ID is required')
    // Add UUID validation if your IDs are UUIDs
    // .isUUID().withMessage('ID must be a valid UUID')
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
exports.default = router;
