import 'dotenv/config'

import OpenAI from "openai";
import { CursorPage } from 'openai/pagination';
import { Assistant } from 'openai/resources/beta/assistants/assistants';
import { Run } from 'openai/resources/beta/threads/runs/runs';
import { RunStep } from 'openai/resources/beta/threads/runs/steps';
const openai = new OpenAI();



export async function newRun({threadId,assistantId,instructions}:{
    threadId: string,
    assistantId: string,
    instructions: string
}): Promise<Run> {
    const run = await openai.beta.threads.runs.create(
        threadId,
        { 
          assistant_id: assistantId,
          instructions
        }
      );

      return run;
  }
  export async function cancelRun({threadId,runId}:{
    threadId: string,
    runId: string
}): Promise<Run> {
    const run = await openai.beta.threads.runs.cancel(
        threadId,
        runId
      );

      return run;
  }

  export async function getRunStatus({threadId,runId}:{
    threadId: string,
    runId: string
}): Promise<Run> {
    const run = await openai.beta.threads.runs.retrieve(
        threadId,
        runId
      );
    
    return run
  }

  export async function getRunSteps({threadId,runId}:{
    threadId: string,
    runId: string
}): Promise<CursorPage<RunStep>> {
    const runSteps = await openai.beta.threads.runs.steps.list(
      threadId,
      runId
    );
      
      return runSteps
  }


  
  export async function getAssistant({assistantId}:{
    assistantId: string
}): Promise<Assistant> {
    const assistant = await openai.beta.assistants.retrieve(
      assistantId
    );

      return assistant;
  }
