const fs = require('fs');
const express = require('express')

const app = express()
const port = +process.argv[2] || 3000


const DECK_PATH = './cards.json';
let cardsData = fs.readFileSync(DECK_PATH, 'utf-8');
const cards = cardsData.split("},{").map(c => "{" + c.replace(/[{}\[\]]/g, "") + "}");
cardsData = null;
const MAX_CARDS = cards.length;

const redisClient = new require('ioredis').createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.on('ready', () => {
    app.listen(port, function () {
        console.log(`Example app listening at http://0.0.0.0:${port}`)
    });
});

async function getMissingCard(key) {
    let c = await redisClient.incr(key);
    let cardIndex = MAX_CARDS - c;
    if (cardIndex < 0) {
        return `{"id": "ALL CARDS"}`;
    } else {
        return cards[cardIndex];
    }
}

app.get('/card_add', async (req, res) => {
    const key = 'user_id:' + req.query.id;
    const missingCard = await getMissingCard(key);
    res.set('Content-Type', 'application/json')
        .send(missingCard);
});

app.get('/ready', (req, res) => {
    res.json({ ready: true })
});