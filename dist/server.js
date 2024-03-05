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
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const articles_1 = require("./utils/articles");
const topics_1 = require("./utils/topics");
const webscrapers_1 = require("./utils/webscrapers");
const images_1 = require("./utils/images");
const app = (0, express_1.default)();
const port = 3000;
app.get('/start-an-article', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const topic = yield (0, topics_1.getTopic)();
    console.log("topic", topic);
    const articleInfo = yield (0, articles_1.startAnArticle)({ topic: topic.title });
    console.log(articleInfo);
    yield (0, topics_1.updateTopic)({
        topicId: topic.id,
        config: {
            data: {
                status: 'in-progress',
                OpenAIInfo: articleInfo
            }
        }
    });
    res.json(articleInfo);
}));
app.get('/writing-new-article', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const topic = yield (0, topics_1.getTopic)({ config: {
            filter: 'filters[isArticleCreated][$eq]=false&filters[politicalTones][$eq]=false&filters[status][$eq]=in-progress'
        } });
    const threadId = topic.OpenAIInfo.threadId;
    const runId = topic.OpenAIInfo.runId;
    const { status: inititalStatus } = yield (0, articles_1.checkStatusOnce)({ threadId, runId, status: 'completed' });
    if (inititalStatus === 'failed') {
        console.log('ALERTA FAILED!');
        yield (0, topics_1.updateTopic)({
            topicId: topic.id,
            config: {
                data: {
                    status: 'not-started',
                }
            }
        });
        res.json({
            threadId,
            runId
        });
    }
    if (topic.OpenAIInfo.stage < 4) {
        console.log('still scraping phase');
        const { state } = yield (0, articles_1.checkStatusOnce)({ threadId, runId, status: 'completed' });
        if (!state) {
            console.log('state', state);
            res.json('still scraping website');
        }
        const scrapedNewsInfo = yield (0, articles_1.scrapingWebsiteNews)({ topic });
        yield (0, topics_1.updateTopic)({
            topicId: topic.id,
            config: {
                data: {
                    OpenAIInfo: scrapedNewsInfo
                }
            }
        });
        res.json(scrapedNewsInfo);
    }
    else if (topic.OpenAIInfo.stage === 4) {
        try {
            console.log('writing phase');
            const { state } = yield (0, articles_1.checkStatusOnce)({ threadId, runId, status: 'completed' });
            if (!state) {
                console.log('state', state);
                res.json('still scraping website');
            }
            const createdArticleInfo = yield (0, articles_1.writingArticle)({ topic });
            yield (0, topics_1.updateTopic)({
                topicId: topic.id,
                config: {
                    data: {
                        OpenAIInfo: createdArticleInfo
                    }
                }
            });
            res.json(createdArticleInfo);
        }
        catch (error) {
            console.log('looks like an error for me!', error);
        }
    }
    else if (topic.OpenAIInfo.stage === 5) {
        console.log('retrieving phase');
        const { status } = yield (0, articles_1.checkStatusOnce)({ threadId, runId, status: 'requires_action' });
        if (status === 'completed') {
            console.log('Article has been pushed back to stage 4 due to not activating correct function');
            yield (0, topics_1.updateTopic)({
                topicId: topic.id,
                config: {
                    data: {
                        OpenAIInfo: Object.assign(Object.assign({}, topic.OpenAIInfo), { stage: 4 })
                    }
                }
            });
            res.json('wrong');
            return false;
        }
        if (status === 'in_progress') {
            res.json('still in progress');
            return false;
        }
        try {
            const { article, topicInfo } = yield (0, articles_1.returnArticleFromOpenAI)({ topic });
            const { title, body, subtitle } = article;
            yield (0, topics_1.updateTopic)({
                topicId: topic.id,
                config: {
                    data: {
                        status: 'created',
                        OpenAIInfo: topicInfo
                    }
                }
            });
            (0, articles_1.publishArticle)({ article: {
                    title,
                    body,
                    subtitle,
                    topicId: topic.id
                } });
        }
        catch (error) {
            yield (0, topics_1.updateTopic)({
                topicId: topic.id,
                config: {
                    data: {
                        status: 'not-started',
                    }
                }
            });
            console.log('error after previous step', error);
        }
        res.json('article published');
    }
}));
/* app.get('/write-an-article', async (req, res) => {
    const topic = await getTopic()
    console.log(topic.title)
    const messages = await newCompleteArticle({topic: topic.title!})
    res.json(messages)
}); */
app.get('/get-search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const topic = yield (0, topics_1.getTopic)();
    console.log(topic.title);
    const news = yield (0, webscrapers_1.getNewsFromInternet)({ search: topic.title });
    res.json(news);
}));
app.get('/get-image', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const image = yield (0, images_1.createImageFromDescription)({ description: 'a happy dog' });
    res.json(image);
}));
app.get('/scrape-website', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const topic = yield (0, topics_1.getTopic)();
    const news = yield (0, webscrapers_1.getNewsFromInternet)({ search: topic.title });
    const article = news.results[4];
    const articleUrl = article.url;
    console.log(articleUrl);
    const html = yield (0, webscrapers_1.getHtmlFromUrlAsText)({ url: articleUrl });
    res.send(html);
}));
app.get('/create-topics', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const topics = yield (0, topics_1.createTopicsFromEFE)({ url: 'https://efe.com/portada-espana/' });
    res.json(topics);
}));
app.get('/get-topic', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const topic = yield (0, topics_1.getTopic)();
    res.json(topic);
}));
app.get('/get-hello', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json('hi');
}));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
