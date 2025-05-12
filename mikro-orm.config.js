"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const postgresql_1 = require("@mikro-orm/postgresql");
const RequestLog_1 = require("./entities/RequestLog");
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.default = (0, postgresql_1.defineConfig)({
    // Use only the connection string for cloud-hosted PostgreSQL
    clientUrl: process.env.DB_URL,
    pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 15000, // 15 seconds timeout
        createTimeoutMillis: 15000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 60000, // Connection timeout after 1 minute idle
        reapIntervalMillis: 1000, // Check for idle connections every 1 second
        createRetryIntervalMillis: 200, // Retry creating connection after 200ms
    },
    // Set generous timeout
    // Removed connectionTimeout as it is not a valid property
    // Comment out individual connection parameters 
    // host: process.env.DB_HOST,
    // port: +process.env.DB_PORT!, 
    // user: process.env.DB_USER,
    // password: process.env.DB_PASS,
    // dbName: process.env.DB_NAME,
    // SSL configuration is often needed for cloud DB providers
    driverOptions: {
        connection: {
            ssl: {
                rejectUnauthorized: false
            }
        }
    },
    entities: [RequestLog_1.RequestLog],
    migrations: {
        path: path.join(__dirname, './migrations'),
        tableName: 'mikro_orm_migrations',
    },
    seeder: {
        path: path.join(__dirname, './seeders'),
    },
    debug: true,
});
