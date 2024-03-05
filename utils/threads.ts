import 'dotenv/config'

import OpenAI from "openai";
import { Thread } from 'openai/resources/beta/threads/threads';

const openai = new OpenAI();

export async function newThread(): Promise<Thread> {
  const thread = await openai.beta.threads.create();
  return thread
}

export async function getThread({threadId}: {threadId: string}): Promise<Thread> {
  const thread = await openai.beta.threads.retrieve(threadId);

  return thread
}