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
exports.publishArticle = exports.returnArticleFromOpenAI = exports.writingArticle = exports.scrapingWebsiteNews = exports.startAnArticle = exports.newCompleteArticle = exports.checkStatusOnce = exports.checkStatus = exports.newArticle = void 0;
const threads_1 = require("./threads");
const messages_1 = require("./messages");
const assistants_1 = require("./assistants");
const webscrapers_1 = require("./webscrapers");
const jsonrepair_1 = require("jsonrepair");
const auth_1 = require("./auth");
function newArticle({ content }) {
    return __awaiter(this, void 0, void 0, function* () {
        const thread = yield (0, threads_1.newThread)();
        const threadId = thread.id;
        yield (0, messages_1.newMessageInThread)({ threadId: thread.id, message: {
                role: 'user',
                content
            } });
        const assistant = yield (0, assistants_1.getAssistant)({ assistantId: process.env.OPENAI_ASSISTANTID });
        const run = yield (0, assistants_1.newRun)({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID,
            instructions: assistant.instructions
        });
        const runId = run.id;
        yield checkStatus({ threadId, runId, status: 'completed' });
        console.log('First step checked.');
        const messages = yield (0, messages_1.getMessagesInThread)({ threadId });
        return messages;
    });
}
exports.newArticle = newArticle;
function checkStatus({ threadId, runId, waitingTime, status }) {
    return __awaiter(this, void 0, void 0, function* () {
        const runStatus = yield (0, assistants_1.getRunStatus)({ threadId, runId });
        console.log(`checking the status of this request. Actual State: ${runStatus.status} | Expected state: ${status} | result: ${runStatus.status === status}`);
        if (runStatus.status === status) {
            return true;
        }
        else {
            yield new Promise(resolve => setTimeout(resolve, waitingTime || 20000));
            return checkStatus({ threadId, runId, waitingTime, status });
        }
    });
}
exports.checkStatus = checkStatus;
function checkStatusOnce({ threadId, runId, status }) {
    return __awaiter(this, void 0, void 0, function* () {
        const runStatus = yield (0, assistants_1.getRunStatus)({ threadId, runId });
        console.log(`checking the status of this request. Actual State: ${runStatus.status} | Expected state: ${status} | result: ${runStatus.status === status}`);
        if (runStatus.status === status) {
            return { state: true, status: runStatus.status };
        }
        else {
            return { state: false, status: runStatus.status };
        }
    });
}
exports.checkStatusOnce = checkStatusOnce;
function newCompleteArticle({ topic }) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting to write an article');
        const thread = yield (0, threads_1.newThread)();
        const threadId = thread.id;
        /* PART 1 */
        yield (0, messages_1.newMessageInThread)({ threadId: thread.id, message: {
                role: 'user',
                content: `Eres un periodista que recaba información de webs scrapeadas y luego escribe una noticia sobre ${topic}.
        Lo primero que vas a recibir son 5 mensajes, que son 5 textos escrapeados de internet. Una vez los recibas, se te pedirá en otro mensaje cómo debes formatear la noticia.`
            } });
        const run = yield (0, assistants_1.newRun)({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID,
            instructions: "responde al usuario"
        });
        console.log('First step sent.');
        const runId = run.id;
        console.log('First step checked.');
        yield checkStatus({ threadId, runId, status: 'completed' });
        /* PART 2 */
        console.log('Starting step 2.');
        const articlesFromInternet = yield (0, webscrapers_1.getNewsFromInternet)({ search: topic });
        const articles = articlesFromInternet.results;
        for (let i = 0; i < 5; i++) {
            console.log('Writing article nº' + (i + 1));
            console.log(articles[i]);
            const articleUrl = articles[i].url;
            const articleHtml = yield (0, webscrapers_1.getHtmlFromUrlAsText)({ url: articleUrl });
            yield (0, messages_1.newMessageInThread)({ threadId: thread.id, message: {
                    role: 'user',
                    content: `artículo número ${i + 1}:
            \n ${articleHtml}`
                } });
            const run2 = yield (0, assistants_1.newRun)({
                threadId,
                assistantId: process.env.OPENAI_ASSISTANTID,
                instructions: "Este es otro texto scrapeado de internet. todavía no tienes que formatearlo."
            });
            const run2Id = run2.id;
            console.log('Sending article nº' + (i + 1));
            yield checkStatus({ threadId, runId: run2Id, status: 'completed' });
            console.log('Article nº' + (i + 1) + " checked.");
        }
        /* PART 3*/
        console.log('Starting Step 3.');
        const run3 = yield (0, assistants_1.newRun)({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID,
            instructions: "escribe una noticia con todos los textos que te han pasado. Debes usar la función send_article para responder, ya que la necesitamos publicar a través de una API."
        });
        const run3Id = run3.id;
        console.log('Sending step 3.');
        yield checkStatus({ threadId, runId: run3Id, status: 'requires_action' });
        const runSteps = yield (0, assistants_1.getRunSteps)({ threadId, runId: run3Id });
        // @ts-expect-error error
        const argumentObj = runSteps.body.data[0].step_details.tool_calls[0].function.arguments;
        const articleObj = JSON.parse(argumentObj);
        return {
            title: articleObj.title,
            body: articleObj.body
        };
    });
}
exports.newCompleteArticle = newCompleteArticle;
function startAnArticle({ topic }) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting to write an article');
        const thread = yield (0, threads_1.newThread)();
        const threadId = thread.id;
        /* PART 1 */
        yield (0, messages_1.newMessageInThread)({ threadId: thread.id, message: {
                role: 'user',
                content: `Eres un periodista que recaba información de webs scrapeadas y luego escribe una noticia sobre ${topic}.
        Lo primero que vas a recibir son 3 mensajes, que son 3 textos escrapeados de internet. Una vez los recibas, se te pedirá en otro mensaje cómo debes formatear la noticia. No escribas la noticia hasta el 4 mensaje, donde se te especificará cómo hacerlo.`
            } });
        const run = yield (0, assistants_1.newRun)({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID,
            instructions: "responde al usuario"
        });
        return {
            threadId: thread.id,
            runId: run.id,
            stage: 1
        };
    });
}
exports.startAnArticle = startAnArticle;
function scrapingWebsiteNews({ topic }) {
    return __awaiter(this, void 0, void 0, function* () {
        const threadId = topic.OpenAIInfo.threadId;
        console.log('topic.OpenAIInfo.threadId', topic.OpenAIInfo.threadId);
        const articlesFromInternet = yield (0, webscrapers_1.getNewsFromInternet)({ search: topic.title });
        const stage = topic.OpenAIInfo.stage;
        const articles = articlesFromInternet.results;
        console.log('Writing article nº' + (stage));
        console.log(articles[stage]);
        const articleUrl = articles[stage].url;
        const articleHtml = yield (0, webscrapers_1.getHtmlFromUrlAsText)({ url: articleUrl });
        const trimmedArticleHtml = trimStringToMaxLength(articleHtml);
        yield (0, messages_1.newMessageInThread)({ threadId, message: {
                role: 'user',
                content: `artículo número ${stage}:
            \n ${trimmedArticleHtml}`
            } });
        const run = yield (0, assistants_1.newRun)({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID,
            instructions: "Este es otro texto scrapeado de internet. todavía no tienes que formatearlo."
        });
        const runId = run.id;
        console.log('Sending article nº' + (stage));
        console.log('Article nº' + (stage) + " checked.");
        if (stage === 4) {
            return {
                stage: 4
            };
        }
        else {
            console.log('Returning properly');
            return {
                runId,
                threadId,
                stage: stage + 1
            };
        }
    });
}
exports.scrapingWebsiteNews = scrapingWebsiteNews;
function writingArticle({ topic }) {
    return __awaiter(this, void 0, void 0, function* () {
        const threadId = topic.OpenAIInfo.threadId;
        /* PART 3*/
        console.log('Starting Step 3.');
        const run = yield (0, assistants_1.newRun)({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID,
            instructions: `Write an article in spanish with all the info I passed to you. It's very important you use your provided functions to answer. I ONLY WANT JSON AS RESPONSE! USE FUNCTIONS FOR THAT.`
        });
        const runId = run.id;
        console.log('Returning properly');
        return {
            runId,
            threadId,
            stage: 5
        };
    });
}
exports.writingArticle = writingArticle;
function returnArticleFromOpenAI({ topic }) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('returning article');
        const threadId = topic.OpenAIInfo.threadId;
        const runId = topic.OpenAIInfo.runId;
        try {
            const runSteps = yield (0, assistants_1.getRunSteps)({ threadId, runId: runId });
            // @ts-expect-error error
            const argumentObj = runSteps.body.data[0].step_details.tool_calls[0].function.arguments;
            console.log('argumentObj', argumentObj);
            console.log('typeof argumentObj', typeof argumentObj);
            const fixedArgumentObj = (0, jsonrepair_1.jsonrepair)(argumentObj);
            console.log('fixedArgumentObj', fixedArgumentObj);
            const articleObj = JSON.parse(fixedArgumentObj);
            console.log('articleObj', articleObj);
            return { topicInfo: {
                    threadId,
                    runId,
                    stage: 6
                }, article: articleObj };
        }
        catch (error) {
            console.log('error In last step', error);
            return { topicInfo: {
                    threadId,
                    runId,
                    stage: 6
                } };
        }
    });
}
exports.returnArticleFromOpenAI = returnArticleFromOpenAI;
const publishArticle = ({ article }) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const publishedAt = new Date();
        const jwt = yield (0, auth_1.authStrapi)();
        const options = {
            method: 'POST',
            url: 'https://blog-back.herokuapp.com/api/posts',
            params: { populate: '*' },
            headers: {
                'content-type': 'application/json',
                Authorization: `Bearer ${jwt}`
            },
            body: JSON.stringify({
                data: {
                    title: article.title,
                    body: article.body,
                    subtitle: article.subtitle,
                    summary: article.subtitle,
                    slug: article.title,
                    category: 'General',
                    countryCode: '34',
                    sources: undefined,
                    tone: 'neutral',
                    created: new Date(),
                    priority: 1,
                    topic: {
                        connect: [article.topicId]
                    },
                    publishedAt
                }
            })
        };
        const response = yield fetch(options.url, options);
        const { data } = yield response.json();
        const articlePosted = Object.assign({ id: data.id }, data.attributes);
        console.log('articlePosted', articlePosted);
        return articlePosted;
    }
    catch (error) {
        console.log('error', error.response.data);
    }
});
exports.publishArticle = publishArticle;
function trimStringToMaxLength(inputString, maxLength = 32700) {
    if (inputString.length > maxLength) {
        // If the input string exceeds maxLength, trim it to the maxLength
        return inputString.substring(0, maxLength);
    }
    else {
        // If the input string is within the limit, return it unchanged
        return inputString;
    }
}
