// src/ListOfGames.tsx
import React from 'react';
import { Link } from 'react-router-dom';

interface Game {
    id: number;
    name: string;
    genre: string;
    path?: string;
}

const games: Game[] = [
    { id: 1, name: 'The Legend of Zelda: Breath of the Wild', genre: 'Adventure' },
    { id: 2, name: 'Elden Ring', genre: 'Action RPG' },
    { id: 3, name: 'Minecraft', genre: 'Sandbox' },
    // NEW: our refactored game
    { id: 4, name: "Rubik's Cube 3D", genre: 'Puzzle', path: '/games/rubiks' },
];

const GameList: React.FC = () => {
    return (
        <div className="min-h-screen p-8 flex items-center justify-center">
            <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 max-w-5xl w-full">
                {games.map((game) => {
                    const Content = (
                        <>
                            <strong className="block text-xl font-semibold text-white">
                                {game.name}
                            </strong>
                            <span
                                className="mt-3 inline-block text-sm px-3 py-1 rounded-full
                bg-blue-300/20 backdrop-blur-sm
                border border-blue-200/30
                text-blue-100"
                            >
                {game.genre}
              </span>
                        </>
                    );

                    return (
                        <li
                            key={game.id}
                            className="relative rounded-2xl p-6
                bg-blue-300/20 backdrop-blur-sm
                border border-blue-200/30
                shadow-lg hover:shadow-xl
                transition hover:scale-[1.02]"
                        >
                            {game.path ? (
                                <Link to={game.path} className="block focus:outline-none">
                                    {Content}
                                </Link>
                            ) : (
                                Content
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default GameList;
