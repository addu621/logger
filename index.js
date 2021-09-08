const http = require("http");
const fs = require("fs");
const WebSocketServer = require('websocket').server;
const readline = require("readline");

const server = http.createServer(function (req, res) {
    if (req.url == "/log"){
        fs.readFile("index.html", function (err, data) {
            if (data) {
                res.write(data);
                res.end();
            }
            else {
                console.error(err.message);
                res.writeHead(404, {'content-type': 'text/html'});
                res.write('index.html not found.');
                res.end();
            }
        });
    }
}).listen(8080);

wsServer = new WebSocketServer({
    httpServer: server
});

let allClients = [];

wsServer.on('request', function(request) {
    allClients.push(request.accept(null, request.origin));
});

const LOGFILE = "allLogs";

wsServer.on('connect', connection => {
    lastUpdates(LOGFILE)
    .then(lines => {
        connection.send(JSON.stringify({ filename: LOGFILE, lines }));
    })
    .catch(err => {
       connection.send(JSON.stringify( err ));
    });
    
    connection.on('close', function(connection) {
        let index = allClients.indexOf(connection);
        allClients.splice(index, 1)
    });
});


const lastUpdates = (filename) => {
    return new Promise((resolve, reject) => {
        let lines = [];
        let r1 = readline.createInterface({
            input: fs.createReadStream(filename),
            output: process.stdout,
            terminal: false
        });

        r1.on('line', input => {
            lines.push(input)
        });
    
        r1.on('close', () => {
            lastUpdate = lines.length > 0 ? lines[lines.length-1] : '';
            resolve(lines.slice(-10));
        });
    })
}