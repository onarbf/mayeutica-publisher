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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTopic = exports.getTopic = exports.createTopicsFromEFE = void 0;
require("dotenv/config");
const cheerio = __importStar(require("cheerio"));
const dates_1 = require("./dates");
const auth_1 = require("./auth");
function createTopicsFromEFE({ url }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch('https://efe.com/portada-espana/', { method: "get" });
            const receivedData = yield response.text();
            const $ = cheerio.load(receivedData);
            const listItems = $(".inside-article");
            const topics = [];
            listItems.each((idx, el) => {
                const title = $(el).find(".entry-title").text() || undefined;
                const date = new Date($(el).find(".posted-on time").attr('datetime'));
                console.log(date);
                const topic = {
                    title: title || undefined,
                    category: 'General',
                    date,
                    isArticleCreated: false,
                    url: 'https://efe.com/portada-espana/'
                };
                if (!(0, dates_1.thisDateIsOlderThanToday)(topic.date)) {
                    topics.push(topic);
                }
            });
            console.log('topics generated', topics);
            return topics;
        }
        catch (error) {
            console.log('error', error);
            if (typeof error === 'object' && error !== null && 'response' in error) {
                const responseError = error;
                if (responseError.response.status === 504 || responseError.response.status === 429) { //This error relaunch this function if the error we receive is something related to the times we visited the website.
                    console.log('trying to generate topics from url again');
                    yield createTopicsFromEFE({ url });
                }
                else {
                    return false;
                }
            }
        }
    });
}
exports.createTopicsFromEFE = createTopicsFromEFE;
function getTopic({ config } = { config: {} }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const populate = config.populate || 'populate=*';
            const filter = config.filter || 'filters[isArticleCreated][$eq]=false&filters[politicalTones][$eq]=false';
            const options = {
                method: 'GET',
                url: `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/topics?`
                    + `${populate}`
                    + `&${filter}`,
                headers: {
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_KEY}`,
                }
            };
            const response = yield fetch(options.url, options);
            const { data: topics } = yield response.json();
            const topic = Object.assign({ id: topics[0].id }, topics[0].attributes);
            return topic;
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Request failed:', error.message);
            }
            else {
                console.error('An unknown error occurred');
            }
            throw error;
        }
    });
}
exports.getTopic = getTopic;
function updateTopic({ topicId, config }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jwt = yield (0, auth_1.authStrapi)();
            const response = yield fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/topics/${topicId}?populate=*`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    data: config.data
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const apiResponse = yield response.json();
            const topic = Object.assign({ id: apiResponse.data.id }, apiResponse.data.attributess);
            console.log('Topic Updated');
            return topic;
        }
        catch (error) {
            if (error.response) {
                console.log('error updating topic', error.response.data);
            }
            else {
                console.log('error updating topic', error.response);
            }
            throw error;
        }
    });
}
exports.updateTopic = updateTopic;
