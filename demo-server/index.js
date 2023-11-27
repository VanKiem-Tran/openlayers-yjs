const express = require('express');
var cors = require('cors');

const socketio = require('socket.io');

const app = express();

app.use(
	cors({
		origin: '*',
	})
);

const server = app.listen(1337, () => {
	console.log('Server running!');
});

const io = socketio(server, {
	cors: {
		origin: '*',
	},
});
let room = null;

io.on('connection', (socket) => {
	socket.on('join', (data) => {
		room = data.name;
		socket.join(data.name);
	});
	socket.on('send-geometry', (data) => {
		io.to(room).emit('geometry', data);
	});
});
