
import { newThread } from './threads';
import {  getMessagesInThread, newMessageInThread } from './messages';
import { getAssistant,  getRunStatus,  getRunSteps,  newRun } from './assistants';
import { ThreadMessage } from 'openai/resources/beta/threads/messages/messages';
import { CursorPage } from 'openai/pagination';
import { getHtmlFromUrlAsText, getNewsFromInternet } from './webscrapers';
import { OpenAIInfo, Topic } from './topics';
import { jsonrepair } from 'jsonrepair'
import { authStrapi } from './auth';



export async function newArticle({content}:{content: string}): Promise<CursorPage<ThreadMessage>> {
    
    const thread = await newThread();
    const threadId = thread.id;
    await newMessageInThread({threadId: thread.id, message: {
        role: 'user',
        content
    }});

    const assistant = await getAssistant({assistantId: process.env.OPENAI_ASSISTANTID!})

    const run = await newRun({
        threadId,
        assistantId: process.env.OPENAI_ASSISTANTID!,
        instructions: assistant.instructions!
    })
 
    const runId = run.id;
    
    await checkStatus({threadId, runId, status: 'completed'});
    console.log('First step checked.')
    const messages = await getMessagesInThread({threadId});
    return messages;
}




export async function checkStatus({threadId,runId,waitingTime, status}
    :
    {threadId: string, runId: string, waitingTime?: number, status: string}):Promise<boolean>{
    const runStatus = await getRunStatus({threadId, runId});
    
    console.log(`checking the status of this request. Actual State: ${runStatus.status} | Expected state: ${status} | result: ${runStatus.status === status}`)
    if (runStatus.status === status) {
        return true;
    } else {
        await new Promise(resolve => setTimeout(resolve, waitingTime || 20000));
        return checkStatus({threadId, runId,waitingTime, status});
    }
}

export async function checkStatusOnce({threadId,runId, status}
    :
    {threadId: string, runId: string, waitingTime?: number, status: string}):Promise<{state: boolean, status: string}>{
    const runStatus = await getRunStatus({threadId, runId});
    
    console.log(`checking the status of this request. Actual State: ${runStatus.status} | Expected state: ${status} | result: ${runStatus.status === status}`)
    if (runStatus.status === status) {
        return {state: true, status: runStatus.status};
    } else {
        return {state: false, status: runStatus.status};
    }
}


export async function newCompleteArticle({topic}:{topic: string}): Promise<{title: string, body: string}> {
    console.log('Starting to write an article')
    const thread = await newThread();
    const threadId = thread.id;


    /* PART 1 */
    await newMessageInThread({threadId: thread.id, message: {
        role: 'user',
        content: `Eres un periodista que recaba información de webs scrapeadas y luego escribe una noticia sobre ${topic}.
        Lo primero que vas a recibir son 5 mensajes, que son 5 textos escrapeados de internet. Una vez los recibas, se te pedirá en otro mensaje cómo debes formatear la noticia.`
    }});

    const run = await newRun({
        threadId,
        assistantId: process.env.OPENAI_ASSISTANTID!,
        instructions: "responde al usuario"
    })

    console.log('First step sent.')
    const runId = run.id;
    console.log('First step checked.')
    await checkStatus({threadId, runId, status: 'completed'});
    
    /* PART 2 */
    console.log('Starting step 2.')
    const articlesFromInternet = await getNewsFromInternet({search: topic});
    const articles = articlesFromInternet.results;
    for(let i = 0;i<5; i++){
        console.log('Writing article nº' + (i+1));
        console.log(articles[i]);
        const articleUrl = articles[i].url;
        const articleHtml = await getHtmlFromUrlAsText({url: articleUrl});

        await newMessageInThread({threadId: thread.id, message: {
            role: 'user',
            content: `artículo número ${i+1}:
            \n ${articleHtml}`
        }});
    
        const run2 = await newRun({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID!,
            instructions: "Este es otro texto scrapeado de internet. todavía no tienes que formatearlo."
        })
     
        const run2Id = run2.id;
        console.log('Sending article nº' + (i+1));
        await checkStatus({threadId, runId: run2Id,  status: 'completed'});
        console.log('Article nº' + (i+1) + " checked.");
    }

    /* PART 3*/
    console.log('Starting Step 3.')
    const run3 = await newRun({
        threadId,
        assistantId: process.env.OPENAI_ASSISTANTID!,
        instructions: "escribe una noticia con todos los textos que te han pasado. Debes usar la función send_article para responder, ya que la necesitamos publicar a través de una API."
    })
 
    const run3Id = run3.id;
    console.log('Sending step 3.')
    await checkStatus({threadId, runId: run3Id,  status: 'requires_action'});
    const runSteps = await getRunSteps({threadId,runId: run3Id});
    // @ts-expect-error error
    const argumentObj = runSteps.body.data[0].step_details.tool_calls[0].function.arguments;
    const articleObj = JSON.parse(argumentObj);

    return {
        title: articleObj.title,
        body: articleObj.body
    }
}



export async function startAnArticle({topic}:{topic: string}): Promise<OpenAIInfo> {
    console.log('Starting to write an article')
    const thread = await newThread();
    const threadId = thread.id;

    /* PART 1 */
    await newMessageInThread({threadId: thread.id, message: {
        role: 'user',
        content: `Eres un periodista que recaba información de webs scrapeadas y luego escribe una noticia sobre ${topic}.
        Lo primero que vas a recibir son 3 mensajes, que son 3 textos escrapeados de internet. Una vez los recibas, se te pedirá en otro mensaje cómo debes formatear la noticia. No escribas la noticia hasta el 4 mensaje, donde se te especificará cómo hacerlo.`
    }});

    const run = await newRun({
        threadId,
        assistantId: process.env.OPENAI_ASSISTANTID!,
        instructions: "responde al usuario"
    })

    return {
        threadId: thread.id,
        runId: run.id,
        stage: 1
    }
}



export async function scrapingWebsiteNews({topic}:{topic: Topic}){

    const threadId = topic.OpenAIInfo!.threadId;
    console.log('topic.OpenAIInfo.threadId',topic.OpenAIInfo!.threadId)
    const articlesFromInternet = await getNewsFromInternet({search: topic.title!});

    const stage = topic.OpenAIInfo!.stage;
    
    const articles = articlesFromInternet.results;
        console.log('Writing article nº' + (stage));
        console.log(articles[stage]);
        const articleUrl = articles[stage].url;
        const articleHtml = await getHtmlFromUrlAsText({url: articleUrl});
        const trimmedArticleHtml = trimStringToMaxLength(articleHtml);
        await newMessageInThread({threadId, message: {
            role: 'user',
            content: `artículo número ${stage}:
            \n ${trimmedArticleHtml}`
        }});
    
        const run = await newRun({
            threadId,
            assistantId: process.env.OPENAI_ASSISTANTID!,
            instructions: "Este es otro texto scrapeado de internet. todavía no tienes que formatearlo."
        })
     
        const runId = run.id;
        console.log('Sending article nº' + (stage));
        console.log('Article nº' + (stage) + " checked.");
        if(stage === 4){
            return {
                stage: 4
            }
        }else{
            console.log('Returning properly')
            return {
                runId,
                threadId,
                stage: stage + 1
            }
        }

}

export async function writingArticle({topic}:{topic: Topic}){

    const threadId = topic.OpenAIInfo!.threadId;

    /* PART 3*/
    console.log('Starting Step 3.')
    const run = await newRun({
        threadId,
        assistantId: process.env.OPENAI_ASSISTANTID!,
        instructions: `Write an article in spanish with all the info I passed to you. It's very important you use your provided functions to answer. I ONLY WANT JSON AS RESPONSE! USE FUNCTIONS FOR THAT.`
    })
 
    const runId = run.id;

    console.log('Returning properly')
    return {
        runId,
        threadId,
        stage: 5
    }
}

export async function returnArticleFromOpenAI({topic}: {topic: Topic}): Promise<{topicInfo: {threadId: string, runId: string, stage: number},article?: {title: string, body: string, subtitle: string, imageDescription: string}}>{
    console.log('returning article')
    const threadId = topic.OpenAIInfo!.threadId;
    const runId = topic.OpenAIInfo!.runId;
    try {
        const runSteps = await getRunSteps({threadId,runId: runId});
        // @ts-expect-error error
        const argumentObj = runSteps.body.data[0].step_details.tool_calls[0].function.arguments;
        console.log('argumentObj',argumentObj)
        console.log('typeof argumentObj', typeof argumentObj)
        const fixedArgumentObj = jsonrepair(argumentObj)
        
        console.log('fixedArgumentObj',fixedArgumentObj)
        const articleObj = JSON.parse(fixedArgumentObj);
        console.log('articleObj',articleObj)

        return {topicInfo: {
            threadId,
            runId,
            stage: 6
        },article: articleObj}
    } catch (error) {
        console.log('error In last step', error)
        return {topicInfo: {
            threadId,
            runId,
            stage: 6
        }}
    }
    
}

export const publishArticle = async ({article}: {article:{
    title: string,
    body: string,
    subtitle: string,
    topicId: string

}})=>{ //Pretty descriptive.
    try {
      const publishedAt = new Date();
      const jwt = await authStrapi()
      const options = {
        method: 'POST',
        url: 'https://blog-back.herokuapp.com/api/posts',
        params: {populate: '*'},
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

      const response = await fetch(options.url,options);

      const {data} = await response.json();
      const articlePosted = {
        id: data.id,
        ...data.attributes
      }
      console.log('articlePosted',articlePosted);
      return articlePosted;

    } catch (error) {
      console.log('error',error.response.data);
    }
  }

function trimStringToMaxLength(inputString, maxLength = 32700):string {
    if (inputString.length > maxLength) {
        // If the input string exceeds maxLength, trim it to the maxLength
        return inputString.substring(0, maxLength);
    } else {
        // If the input string is within the limit, return it unchanged
        return inputString;
    }
}