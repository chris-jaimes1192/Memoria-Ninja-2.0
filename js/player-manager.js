export const BoardManager = {
    renderBoard() {
        const board = document.getElementById('board');
        board.innerHTML = "";
        for(let i=0; i<12; i++) {
            const card = document.createElement('div');
            card.className = 'card';
            board.appendChild(card);
        }
    }
};