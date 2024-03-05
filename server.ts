import 'dotenv/config'

import express from 'express';
import {  checkStatusOnce, publishArticle, returnArticleFromOpenAI, scrapingWebsiteNews, startAnArticle, writingArticle } from './utils/articles';
import { createTopicsFromEFE, getTopic, updateTopic } from './utils/topics';
import { getHtmlFromUrlAsText, getNewsFromInternet } from './utils/webscrapers';
import { createImageFromDescription } from './utils/images';
const app = express();
const port = 3000;


app.get('/start-an-article', async (req,res) => {
    const topic = await getTopic()
    console.log("topic",topic);
    const articleInfo = await startAnArticle({topic: topic.title!})
    console.log(articleInfo);
    await updateTopic({
        topicId: topic.id!,
        config:{
            data:{
                status: 'in-progress',
                OpenAIInfo: articleInfo
            }
        }
    })
    res.json(articleInfo)
});

app.get('/writing-new-article', async (req,res) => {
    const topic = await getTopic({config: {
        filter: 'filters[isArticleCreated][$eq]=false&filters[politicalTones][$eq]=false&filters[status][$eq]=in-progress'
    }})

    const threadId = topic.OpenAIInfo!.threadId
    const runId = topic.OpenAIInfo!.runId
    const {status: inititalStatus} = await checkStatusOnce({threadId, runId, status: 'completed'});

    if(inititalStatus === 'failed'){
        console.log('ALERTA FAILED!')
        await updateTopic({
            topicId: topic.id!,
            config:{
                data:{
                    status: 'not-started',
                }
            }
        })
        res.json({
            threadId,
            runId
        })
    } 
    if(topic.OpenAIInfo!.stage < 4){

        console.log('still scraping phase')
        const {state} = await checkStatusOnce({threadId, runId, status: 'completed'});
        if(!state){
            console.log('state',state)
            res.json('still scraping website')
        }
        const scrapedNewsInfo = await scrapingWebsiteNews({topic});
        await updateTopic({
            topicId: topic.id!,
            config:{
                data:{
                    OpenAIInfo: scrapedNewsInfo
                }
            }
        })
        res.json(scrapedNewsInfo)
        
    }else if(topic.OpenAIInfo!.stage === 4){
        try {
            console.log('writing phase')
        const {state}= await checkStatusOnce({threadId, runId, status: 'completed'});
        if(!state){
            console.log('state',state)
            res.json('still scraping website')
        }
        const createdArticleInfo = await writingArticle({topic})
        await updateTopic({
            topicId: topic.id!,
            config:{
                data:{
                    OpenAIInfo: createdArticleInfo
                }
            }
        })       
        res.json(createdArticleInfo)
        } catch (error) {
            console.log('looks like an error for me!',error)
        }
         
    } else if(topic.OpenAIInfo!.stage === 5){
        console.log('retrieving phase')
        const {status} = await checkStatusOnce({threadId, runId, status: 'requires_action'})
        if(status === 'completed'){
            console.log('Article has been pushed back to stage 4 due to not activating correct function')
            await updateTopic({
                topicId: topic.id!,
                config:{
                    data:{
                        OpenAIInfo: {
                            ...topic.OpenAIInfo!,
                            stage: 4
                        }
                    }
                }
            })    
            res.json('wrong')
            return false;
        }
        if(status === 'in_progress'){
            res.json('still in progress')
            return false;
        }
        try {
            const {article,topicInfo} = await returnArticleFromOpenAI({topic});

            const {title, body, subtitle} = article!;

            await updateTopic({
                topicId: topic.id!,
                config:{
                    data:{
                        status: 'created',
                        OpenAIInfo: topicInfo
                    }
                }
                
            })        

            publishArticle({article: {
                title,
                body,
                subtitle,
                topicId: topic.id!
            }});
        } catch (error) {
            await updateTopic({
                topicId: topic.id!,
                config:{
                    data:{
                        status: 'not-started',
                    }
                }
            })     
            console.log('error after previous step', error)
        }
        

        res.json('article published')
    }
    
});


/* app.get('/write-an-article', async (req, res) => {
    const topic = await getTopic()
    console.log(topic.title)
    const messages = await newCompleteArticle({topic: topic.title!})
    res.json(messages)
}); */

app.get('/get-search', async (req,res)=>{
    const topic = await getTopic()
    console.log(topic.title)
    const news = await getNewsFromInternet({search:topic.title!});
    res.json(news);
})

app.get('/get-image', async (req,res)=>{
    const image = await createImageFromDescription({description: 'a happy dog'});
    res.json(image);
})


app.get('/scrape-website', async (req,res)=>{
    const topic = await getTopic()
    const news = await getNewsFromInternet({search:topic.title!});
    const article = news.results[4];
    const articleUrl = article.url;
    console.log(articleUrl)
    const html  = await getHtmlFromUrlAsText({url: articleUrl});
    res.send(html)
})

app.get('/create-topics', async (req, res) => {
    const topics = await createTopicsFromEFE({url: 'https://efe.com/portada-espana/'})
    res.json(topics)
});

app.get('/get-topic', async (req, res) => {
    const topic = await getTopic()
    res.json(topic)
});


app.get('/get-hello',async (req,res)=>{
    res.json('hi')
})

app.get('/',async (req,res)=>{
    res.json('oh hello there!')
})


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})  