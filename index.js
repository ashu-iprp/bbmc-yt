const fetch = require("node-fetch");
const express = require('express')
const app = express();
const port = process.env.PORT || 3000;
const herokuApp = process.env.HEROKU_APP || null;
const youtubeFetchTimeout = 900000;

const youtubeApiKey = AIzaSyD7Uz5rchQA1_5HdGqLiFPwwgR1tDQ1Fd0;
const youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video';
const discordApiKey = 1004811901508800542;
const discordApiUrl = `https://discord.com/api/webhooks/1003319557294936065/mb0CY3vjgB734dx3vkUZmwusAHZvpz03U0VAFe-zrCMi67f5XH9GsfZ_SWp0sUVGJ5I3`;

const youtubeChannels = [
    {
        channelId: 'UCt54WBGAbWHFBfBBQWVdxFQ',
        channelUrl: 'https://studio.youtube.com/channel/UCt54WBGAbWHFBfBBQWVdxFQ'
    },
];

let activeLiveStreams = new Set();

async function fetchLiveStreamStatus() {
    try {
        // for(const youtubeChannel of youtubeChannels) {
            const youtubeChannel = youtubeChannels[0];
            console.log('Polling for ', JSON.stringify(youtubeChannel));
            const url = `${youtubeApiUrl}&channelId=${youtubeChannel.channelId}&key=${youtubeApiKey}`;
            const response = await fetch(url);
            const myJson = await response.json();
            
            console.log('YouTube Response', JSON.stringify(myJson));
            if(myJson && myJson.pageInfo && myJson.pageInfo.totalResults > 0) {
                console.log('Found active stream for ', youtubeChannel.channelId);
                myJson.items.forEach(element => {
                    if(!activeLiveStreams.has(element.id.videoId)) {
                        console.log(element);
                        activeLiveStreams.add(element.id.videoId);
    
                        const discordObj = {
                            username: 'Dumpster LIVE',
                            avatar_url: 'https://yt3.ggpht.com/a/AGF-l7__zvPRgglwpeA85-NPjkxRlhi46IG3wKdwKg=s288-c-k-c0xffffffff-no-rj-mo',
                            content: `@everyone**${element.snippet.title}**. Channel: ${youtubeChannel.channelUrl}`
                        }
                        postToDiscord(discordObj);
                    } else {
                        console.log(`Already alerted for this livestream ${element.id.videoId}. Skipping.`);
                    }
                });
            }
        // }
    } catch (error) {
        console.error(error);
    }
}

async function postToDiscord(json) {
    const resp = fetch(discordApiUrl, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        redirect: 'follow',
        referrer: 'no-referrer',
        body: JSON.stringify(json)
    }).catch(error => console.log('Discord POST failed.', JSON.stringify(json), error));

    const content = await resp.json();
    console.log('Discord response', content); 
}

async function herokuKeepAlive() {
    try {
        const response = await fetch(herokuApp);
        console.log('Heroku Keep-Alive Success')
    } catch(error) {
        console.error(error);
    }
}

app.get('/', (req, res) => res.send('Shhh! Im busy monitoring Youtube Channels.'));
app.listen(port, () => {
    console.log(`App listening on port ${port}!`)
    setInterval(fetchLiveStreamStatus, youtubeFetchTimeout);
    if(herokuApp) {
        setInterval(herokuKeepAlive, 600000); // Heroku will sleep the app if it's not accessed, so access itself to keep-alive
    }
})


