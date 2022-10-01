const socket = io()

const room_name_input = document.getElementById('input_room_name')
const create_room_button = document.getElementById('button_create')
const join_room_button = document.getElementById('button_join')

const board = document.getElementById('board')
const turn = document.getElementById('turn')

let my_turn = false
let num = 1

const tds = []

for (let i = 0; i < 3; i++) {
	const tr = document.createElement('tr')
	tds.push([])

	for (let j = 0; j < 3; j++) {
		const td = document.createElement('td')
		td.addEventListener('click', () => {
			if (!my_turn || td.innerText) return

			socket.emit('tictactoe', { x: j, y: i, num })
		})

		tds[i].push(td)
		tr.appendChild(td)
	}

	board.appendChild(tr)
}

create_room_button.addEventListener('click', () => room(room_name_input.value, 'create'))
join_room_button.addEventListener('click', () => room(room_name_input.value, 'join'))

function room(room_name, type) {
	if (!room_name) return

	socket.emit('room', {
		type,
		room_name
	})
}

function mark(x, y, num) {
	tds[y][x].innerText = num === 1 ? 'O' : 'X'
	tds[y][x].className = 'marked'
}

function waitGame() {
	document.querySelector('.room').style.display = 'none'
	document.querySelector('.wait').style.display = 'flex'
}

function startGame() {
	document.querySelector('.wait').style.display = 'none'
	document.querySelector('.game').style.display = 'flex'

	if (my_turn) turn.innerText = 'Your turn!'
	else turn.innerText = `Opponent's turn`
}

function win(win_num, gg = false) {
	socket.removeAllListeners('tictactoe')

	if (win_num === -1) turn.innerText = 'Tie!'
	else if (!gg) turn.innerText = win_num === num ? 'You win!' : 'You lost..'
	else turn.innerText = 'You win! (Opponent left)'

	const main_button = document.createElement('button')
	main_button.addEventListener('click', () => location.reload())
	main_button.innerText = 'Go to main page'
	document.querySelector('.game').appendChild(main_button)
}

socket.on('room', (data) => {
	if (data.type === 'error') alert(data.message)
	else if (data.type === 'created' || data.type === 'joined') {
		waitGame()

		if (data.type === 'created') my_turn = true
		else if (data.type === 'joined') num = 2
	} else if (data.type === 'start') startGame()
})
socket.on('tictactoe', (data) => {
	console.log(data.winner)
	if (data.winner) return win(data.winner)
	else if (data.gg) return win(num, true)

	mark(data.x, data.y, data.num)
	my_turn = !(data.num === num)

	if (my_turn) turn.innerText = 'Your turn!'
	else turn.innerText = `Opponent's turn`
})
