"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const core_1 = require("@mikro-orm/core");
const mikro_orm_config_1 = __importDefault(require("./mikro-orm.config"));
const logs_1 = __importDefault(require("./routes/logs"));
const requests_1 = __importDefault(require("./routes/requests"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const start = async () => {
    const orm = await core_1.MikroORM.init(mikro_orm_config_1.default);
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.set('em', orm.em.fork());
    app.use('/api', logs_1.default);
    app.use('/api', requests_1.default);
    const generator = orm.getSchemaGenerator();
    await generator.updateSchema();
    app.listen(3001, () => {
        console.log('Server running on http://localhost:3001');
    });
};
start();
