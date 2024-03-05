import 'dotenv/config'

import OpenAI from "openai";
const openai = new OpenAI();

export async function createImageFromDescription({description}:{description: string}){
    const image = await openai.images.generate({ model: "dall-e-3", prompt: description });
    console.log(image.data);
    return image.data;
}
