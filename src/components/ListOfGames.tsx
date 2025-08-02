import React from 'react';

interface Game {
    id: number;
    name: string;
    genre: string;
}

const games: Game[] = [
    {id: 1, name: 'The Legend of Zelda: Breath of the Wild', genre: 'Adventure'},
    {id: 2, name: 'Elden Ring', genre: 'Action RPG'},
    {id: 3, name: 'Minecraft', genre: 'Sandbox'},
];

const GameList: React.FC = () => {
    return (
        <div>
            <ul className={"container"}>
                {games.map((game) => (
                    <li key={game.id} className={"box"}>
                        <strong>{game.name}</strong> - {game.genre}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GameList;