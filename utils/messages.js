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
exports.getMessageInThread = exports.getMessagesInThread = exports.newMessageInThread = void 0;
require("dotenv/config");
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default();
function newMessageInThread({ threadId, message }) {
    return __awaiter(this, void 0, void 0, function* () {
        /* { role: "user", content: "How does AI work? Explain it in simple terms." } */
        const newMessage = yield openai.beta.threads.messages.create(threadId, message);
        return newMessage;
    });
}
exports.newMessageInThread = newMessageInThread;
function getMessagesInThread({ threadId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const allMessages = yield openai.beta.threads.messages.list(threadId);
        return allMessages;
    });
}
exports.getMessagesInThread = getMessagesInThread;
function getMessageInThread({ threadId, messageId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = yield openai.beta.threads.messages.retrieve(threadId, messageId);
        return message;
    });
}
exports.getMessageInThread = getMessageInThread;
