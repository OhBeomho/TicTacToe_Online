const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)

const socket_io = require('socket.io')
const io = new socket_io.Server(server)

const path = require('path')

app.use(express.static(path.join(__dirname, 'src')))

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'src', 'index.html')))
app.get('/game', (_req, res) => res.sendFile(path.join(__dirname, 'src', 'tictactoe.html')))

const room_list = []

io.on('connection', (socket) => {
	let room

	socket.on('room', (data) => {
		const { type, room_name } = data

		if (type === 'create') {
			if (room_list.find((e) => e.room_name === room_name)) {
				socket.emit('room', {
					type: 'error',
					message: 'The room already exists.'
				})

				return
			}

			const new_room = (room = {
				room_name,
				clients: [socket],
				board: [
					[0, 0, 0],
					[0, 0, 0],
					[0, 0, 0]
				]
			})
			room_list.push(new_room)
			socket.join(room_name)

			socket.emit('room', { type: 'created', room_name })
		} else if (type === 'join') {
			const target_room = room_list.find((e) => e.room_name === room_name)

			if (!target_room) {
				socket.emit('room', {
					type: 'error',
					message: 'The room does not exists.'
				})

				return
			} else if (target_room.clients.length === 2) {
				socket.emit('room', {
					type: 'error',
					message: 'The room is already full.'
				})
			}

			socket.join(room_name)

			room = target_room
			room.clients.push(socket)

			socket.emit('room', { type: 'joined', room_name })
			if (room.clients.length === 2) io.to(room_name).emit('room', { type: 'start' })
		}
	})
	socket.on('tictactoe', (data) => {
		room.board[data.y][data.x] = data.num
		io.to(room.room_name).emit('tictactoe', data)

		const win_data = check(room.board)
		if (win_data[0] === data.num || win_data[0] === -1) {
			io.to(room.room_name).emit('tictactoe', { winner: win_data[0], highlight: win_data[1] })
			room_list.splice(room_list.indexOf(room), 1)
			room.clients.forEach((e) => e.leave(room.room_name))
			return
		}
	})
	socket.on('disconnect', () => {
		if (room) {
			socket.to(room.room_name).emit('tictactoe', { gg: 'Bye' })
			room_list.splice(room_list.indexOf(room), 1)
		}
	})

	const check = (board) => {
		for (let i = 0; i < board.length; i++) {
			if (board[i].every((e) => e === board[i][0]) && board[i][0])
				return [board[i][0], [i * 3, i * 3 + 1, i * 3 + 2]]
			else if (board[0][i] === board[1][i] && board[1][i] === board[2][i] && board[0][i])
				return [board[0][i], [i, 3 + i, 6 + i]]
		}

		if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[0][0]) return [board[0][0], [0, 4, 8]]
		else if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[0][2])
			return [board[0][2], [2, 4, 6]]

		for (let i = 0; i < board.length; i++) {
			if (board[i].find((e) => e === 0) !== undefined) return 0
		}

		return [-1, null]
	}
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log('SERVER STARTED. PORT: ' + PORT))
