import 'dotenv/config'

import OpenAI from "openai";
import { MessageCreateParams, ThreadMessage, ThreadMessagesPage } from 'openai/resources/beta/threads/messages/messages';
const openai = new OpenAI();

export async function newMessageInThread(
    {threadId,message}:{
    threadId: string,
    message: MessageCreateParams
})
: Promise<ThreadMessage> {

    /* { role: "user", content: "How does AI work? Explain it in simple terms." } */
    const newMessage = await openai.beta.threads.messages.create(threadId,message);
    
    return newMessage;
}

export async function getMessagesInThread(
    {threadId}:{
    threadId: string
})
: Promise<ThreadMessagesPage> {
    const allMessages = await openai.beta.threads.messages.list(threadId);
    
    return allMessages;
}


export async function getMessageInThread(
    {threadId, messageId}:{
    threadId: string,
    messageId: string
})
: Promise<ThreadMessage> {
    const message = await openai.beta.threads.messages.retrieve(
        threadId, messageId
      );
    
    return message
}