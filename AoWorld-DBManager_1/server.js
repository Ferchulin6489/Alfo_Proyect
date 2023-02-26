const Net = require('net');

module.exports = {

    start(port, receiver) {
        const server = new Net.Server();

        server.listen(port, function() {
            console.log(`DBManager listening at port ${port}`);
        });
        

        server.on('connection', function(socket) {
            console.log('Game server connected to DBManager');
        
            socket.on('data', function(chunk) {
                receiver.process(chunk, socket);
            });
        
            socket.on('end', function() {
                console.log('Game server disconnected.');
            });
        
            socket.on('error', function(err) {
                console.log(`Error: ${err}`);
            });
        });
    }
}