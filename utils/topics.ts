import 'dotenv/config'
import * as cheerio from 'cheerio';
import { thisDateIsOlderThanToday } from './dates';
import { authStrapi } from './auth';

export interface OpenAIInfo{
  threadId: string,
  runId: string,
  stage: number
}


export interface Topic{
  id?: string
  title?: string
  url?: string
  date?: Date
  isArticleCreated?: boolean
  articleCreatedAt?: string
  category?: string
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  politicalTones?: boolean
  status?: string
  OpenAIInfo?: OpenAIInfo
}

export async function createTopicsFromEFE({url}:{url: string}){
        try {
          
          const response = await fetch('https://efe.com/portada-espana/',{method: "get"});
          const receivedData = await response.text();
          const $ = cheerio.load(receivedData);
          const listItems = $(".inside-article");
      
          const topics: Topic[] = [];
          listItems.each((idx, el) => {
            const title = $(el).find(".entry-title").text() || undefined;
            const date= new Date($(el).find(".posted-on time").attr('datetime')!)
            console.log(date);
            const topic: Topic = {
                title: title || undefined,
                category: 'General',
                date,
                isArticleCreated: false,
                url: 'https://efe.com/portada-espana/'
            };
        
            if (!thisDateIsOlderThanToday(topic.date!)) {
                topics.push(topic);
            }
        });
          console.log('topics generated', topics)
          return topics;
          
        } catch (error) {
          console.log('error', error) 
          if (typeof error === 'object' && error !== null && 'response' in error) {
            const responseError = error as { response: { status: number } };
            if(responseError.response.status === 504 || responseError.response.status === 429){ //This error relaunch this function if the error we receive is something related to the times we visited the website.
                console.log('trying to generate topics from url again'); 
                await createTopicsFromEFE({url});
            }else{
                return false
            }
        }
}
}


export async function getTopic({config}: {config: {populate?: string, filter?: string} }= {config: {}}): Promise<Topic>{
    try {
      const populate = config.populate || 'populate=*';
      const filter = config.filter || 'filters[isArticleCreated][$eq]=false&filters[politicalTones][$eq]=false';

      const options = {
        method: 'GET',
        url:  `${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/topics?`
        + `${populate}`  
        + `&${filter}`,
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_KEY}`,
        }
      };

      const response = await fetch(options.url,options);

      const {data: topics} = await response.json();
      const topic = {
        id: topics[0].id,
        ...topics[0].attributes
      }

      return topic;
    } catch (error) {
    if (error instanceof Error) {
        console.error('Request failed:', error.message);
        
    } else {
        
        console.error('An unknown error occurred');
    }
    
    throw error;
    }
    
  }
  export async function updateTopic({topicId,config}:{topicId: string,config: any}): Promise<Topic>{ //This func is only prepared to update the published status of the topic.
    
    try {
        
        const jwt = await authStrapi()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/topics/${topicId}?populate=*`, {
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
        
        const apiResponse = await response.json();
        
        const topic = {
          id: apiResponse.data.id,
          ...apiResponse.data.attributess
        };
        console.log('Topic Updated');
        return topic

      } catch (error: any) {
        if(error.response){
          console.log('error updating topic', error.response.data)  
        }else{
          console.log('error updating topic', error.response)
        }
          
        throw error
      }
      
    }