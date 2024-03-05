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
exports.authStrapi = void 0;
const authStrapi = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('trying jwt');
    const response = yield fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/auth/local`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            identifier: process.env.STRAPI_IDENTIFIER,
            password: process.env.STRAPI_PASSWORD,
        }),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = yield response.json();
    const jwt = data.jwt;
    console.log('jwt done', jwt);
    return jwt;
});
exports.authStrapi = authStrapi;
