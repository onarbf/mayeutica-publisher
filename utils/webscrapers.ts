import 'dotenv/config'
import { htmlToText } from 'html-to-text';

export async function getNewsFromInternet({search}:{search: string}) {
    const url = `${process.env.BRAVE_API_ENDPOINT!}?country=ES&q=${search}`;

    const response = await fetch(url, {
        method: 'get',
        headers: {
            "Accept": "application/json",
            "X-Subscription-Token": process.env.BRAVE_API_KEY!
        }
    });

    // Check if the response is ok (status in the range 200-299)
    if (!response.ok) {
        const text = await response.text();
        console.error('Non-OK HTTP status:', response.status, text);
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    try {
        const data = await response.json();
        return data;
    } catch (e) {
        console.error('Error parsing JSON:', e);
        throw e;
    }
}

export async function getHtmlFromUrlAsText({url}:{url: string}): Promise<string>{
    try {
        const response = await fetch(url);
        let html = await response.text();
        html = html.replace(/<a[^>]*>(.*?)<\/a>/gi, '');
        return htmlToText(html, {
            wordwrap: 130,
            ignoreHref: true 
        });
    } catch (error) {
        console.error('Error fetching or converting HTML:', error);
        return '';
    }
}