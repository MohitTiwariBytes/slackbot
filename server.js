const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
const port = 3000;
const signingSecret = 'cf0474ca4cb7f3f5149af7abfe82da07'; // Replace with your Slack signing secret

// Middleware to capture raw body for request verification
app.use((req, res, next) => {
    req.rawBody = '';
    req.on('data', chunk => {
        req.rawBody += chunk.toString();
    });
    req.on('end', next);
});

app.use(bodyParser.urlencoded({ extended: true }));

// Function to verify Slack requests
function verifyRequest(req) {
    const slackSignature = req.headers['x-slack-signature'];
    const requestBody = req.rawBody;
    const timestamp = req.headers['x-slack-request-timestamp'];

    const sigBasestring = `v0:${timestamp}:${requestBody}`;
    const mySignature = `v0=${crypto.createHmac('sha256', signingSecret).update(sigBasestring, 'utf8').digest('hex')}`;

    return crypto.timingSafeEqual(Buffer.from(mySignature, 'utf8'), Buffer.from(slackSignature, 'utf8'));
}

app.post('/projectidea', (req, res) => {
    if (!verifyRequest(req)) {
        return res.status(400).send('Verification failed');
    }

    const { text, user_name } = req.body;
    const responseMessage = `Hello, ${user_name}! You said: "${text}"`;

    // Respond quickly
    res.json({
        response_type: 'in_channel', // public to the channel
        text: responseMessage
    });

    // Further processing can happen here
    console.log(`Received a message from ${user_name}: ${text}`);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
