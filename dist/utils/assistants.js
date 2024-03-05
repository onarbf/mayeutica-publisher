"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssistant = exports.getRunSteps = exports.getRunStatus = exports.cancelRun = exports.newRun = void 0;
require("dotenv/config");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
function newRun({ threadId, assistantId, instructions }) {
    return __awaiter(this, void 0, void 0, function* () {
        const run = yield openai.beta.threads.runs.create(threadId, {
            assistant_id: assistantId,
            instructions
        });
        return run;
    });
}
exports.newRun = newRun;
function cancelRun({ threadId, runId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const run = yield openai.beta.threads.runs.cancel(threadId, runId);
        return run;
    });
}
exports.cancelRun = cancelRun;
function getRunStatus({ threadId, runId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const run = yield openai.beta.threads.runs.retrieve(threadId, runId);
        return run;
    });
}
exports.getRunStatus = getRunStatus;
function getRunSteps({ threadId, runId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const runSteps = yield openai.beta.threads.runs.steps.list(threadId, runId);
        return runSteps;
    });
}
exports.getRunSteps = getRunSteps;
function getAssistant({ assistantId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const assistant = yield openai.beta.assistants.retrieve(assistantId);
        return assistant;
    });
}
exports.getAssistant = getAssistant;
