import express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import { AddressInfo } from 'net';

const app = express();
const port = 3001;

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

interface ExtWebSocket extends WebSocket {
    terminate();
    ping(arg0: null, arg1: boolean, arg2: boolean);
    isAlive: boolean;
}

wss.on('connection', (ws: WebSocket) => {    
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', (message: string) => {
        //log the received message and send it back to the client
        console.log('received: %s', message);

        const broadcastRegex = /^broadcast\:/;

        if (broadcastRegex.test(message)) {
            message = message.replace(broadcastRegex, '');

            //send back the message to the other clients
            wss.clients
                .forEach(client => {
                    if (client != ws) {
                        client.send(`Hello, broadcast message -> ${message}`);
                    }    
                });
            
        } else {
            ws.send(`Hello, you sent -> ${message}`);
        }
    });

    ws.send('Hi there');
})

setInterval(() => {
    wss.clients.forEach((ws: ExtWebSocket) => {
        
        if (!ws.isAlive) return ws.terminate();
        
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);

server.listen(process.env.port || port, () =>{
    const { port } = server.address() as AddressInfo
    console.log(`Server started on port ${port} :)`);
})
