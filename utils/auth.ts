export const authStrapi = async () => {
    console.log('trying jwt');

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/api/auth/local`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            identifier: process.env.STRAPI_IDENTIFIER,
            password: process.env.STRAPI_PASSWORD,
        }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const jwt = data.jwt;

    console.log('jwt done', jwt);
    return jwt;
}