import React, { useMemo, useState } from 'react';
import CubeChallenge from './games/CubeChallenge';
import './ListOfGames.css';

interface GameDefinition {
    id: string;
    name: string;
    genre: string;
    description: string;
    playable: boolean;
    component: React.ComponentType;
}

const PlaceholderGame: React.FC<{ title: string }> = ({ title }) => (
    <div className="game-placeholder">
        <p>
            <strong>{title}</strong> is coming soon. Stay tuned for its official release!
        </p>
    </div>
);

const createPlaceholderGame = (title: string): React.ComponentType => () => <PlaceholderGame title={title} />;

const games: GameDefinition[] = [
    {
        id: 'cube-challenge',
        name: 'Cube Challenge',
        genre: '3D Puzzle',
        description: 'Turn every face of a full 3×3 cube, scramble it, and use official notation buttons to work toward a solve.',
        playable: true,
        component: CubeChallenge,
    },
    {
        id: 'zelda',
        name: 'The Legend of Zelda: Breath of the Wild',
        genre: 'Adventure',
        description: 'Explore Hyrule with Link in a sprawling open world filled with shrines, Koroks and epic boss battles.',
        playable: false,
        component: createPlaceholderGame('The Legend of Zelda: Breath of the Wild'),
    },
    {
        id: 'elden-ring',
        name: 'Elden Ring',
        genre: 'Action RPG',
        description: 'Face the Lands Between, collect Great Runes and forge your path to become the Elden Lord.',
        playable: false,
        component: createPlaceholderGame('Elden Ring'),
    },
    {
        id: 'minecraft',
        name: 'Minecraft',
        genre: 'Sandbox',
        description: 'Gather resources, build without limits and survive the night in this creative sandbox phenomenon.',
        playable: false,
        component: createPlaceholderGame('Minecraft'),
    },
];

const ListOfGames: React.FC = () => {
    const [selectedGameId, setSelectedGameId] = useState<string>(games[0].id);

    const selectedGame = useMemo(() => games.find((game) => game.id === selectedGameId) ?? games[0], [selectedGameId]);
    const SelectedGameComponent = selectedGame.component;

    return (
        <div className="game-library">
            <aside className="game-library__sidebar">
                <h2 className="game-library__heading">Game Library</h2>
                <p className="game-library__intro">Select a game to learn more or play a quick demo.</p>
                <ul className="game-library__list">
                    {games.map((game) => {
                        const isActive = game.id === selectedGameId;
                        return (
                            <li key={game.id} className="game-library__list-item">
                                <button
                                    type="button"
                                    onClick={() => setSelectedGameId(game.id)}
                                    className={`game-library__item ${isActive ? 'game-library__item--active' : ''}`}
                                    aria-pressed={isActive}
                                >
                                    <span className="game-library__item-name">{game.name}</span>
                                    <span className="game-library__item-genre">{game.genre}</span>
                                    {!game.playable && <span className="game-library__badge">Preview</span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </aside>

            <section className="game-library__content" aria-live="polite">
                <div className="game-library__details">
                    <h3 className="game-library__details-title">{selectedGame.name}</h3>
                    <p className="game-library__details-description">{selectedGame.description}</p>
                </div>
                <div className="game-library__demo">
                    <SelectedGameComponent />
                </div>
            </section>
        </div>
    );
};

export default ListOfGames;
