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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHtmlFromUrlAsText = exports.getNewsFromInternet = void 0;
require("dotenv/config");
const html_to_text_1 = require("html-to-text");
function getNewsFromInternet({ search }) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${process.env.BRAVE_API_ENDPOINT}?country=ES&q=${search}`;
        const response = yield fetch(url, {
            method: 'get',
            headers: {
                "Accept": "application/json",
                "X-Subscription-Token": process.env.BRAVE_API_KEY
            }
        });
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
            const text = yield response.text();
            console.error('Non-OK HTTP status:', response.status, text);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        try {
            const data = yield response.json();
            return data;
        }
        catch (e) {
            console.error('Error parsing JSON:', e);
            throw e;
        }
    });
}
exports.getNewsFromInternet = getNewsFromInternet;
function getHtmlFromUrlAsText({ url }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield fetch(url);
            let html = yield response.text();
            html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '');
            return (0, html_to_text_1.htmlToText)(html, {
                wordwrap: 130,
                ignoreHref: true
            });
        }
        catch (error) {
            console.error('Error fetching or converting HTML:', error);
            return '';
        }
    });
}
exports.getHtmlFromUrlAsText = getHtmlFromUrlAsText;
