"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLog = void 0;
const core_1 = require("@mikro-orm/core");
let RequestLog = class RequestLog {
    constructor() {
        this.timestamp = new Date();
    }
};
exports.RequestLog = RequestLog;
__decorate([
    (0, core_1.PrimaryKey)(),
    __metadata("design:type", Number)
], RequestLog.prototype, "id", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], RequestLog.prototype, "method", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", String)
], RequestLog.prototype, "url", void 0);
__decorate([
    (0, core_1.Property)({ type: 'json' }),
    __metadata("design:type", Object)
], RequestLog.prototype, "headers", void 0);
__decorate([
    (0, core_1.Property)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], RequestLog.prototype, "requestBody", void 0);
__decorate([
    (0, core_1.Property)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], RequestLog.prototype, "responseBody", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Number)
], RequestLog.prototype, "statusCode", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Date)
], RequestLog.prototype, "timestamp", void 0);
__decorate([
    (0, core_1.Property)(),
    __metadata("design:type", Number)
], RequestLog.prototype, "responseTime", void 0);
__decorate([
    (0, core_1.Property)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RequestLog.prototype, "error", void 0);
exports.RequestLog = RequestLog = __decorate([
    (0, core_1.Entity)()
], RequestLog);
