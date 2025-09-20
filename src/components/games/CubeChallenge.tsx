import React, { useCallback, useMemo, useRef, useState } from 'react';
import './CubeChallenge.css';


type Coordinate = -1 | 0 | 1;
type Axis = 'x' | 'y' | 'z';
type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
type BaseMove = FaceKey;
type Move = `${BaseMove}${'' | "'" | '2'}`;

interface Rotation {
    x: number;
    y: number;
}

type Vector3 = Record<Axis, Coordinate>;

interface CubeSticker {
    id: string;
    color: string;
    position: Vector3;
    normal: Vector3;
}

const ROTATION_STEP = 15;
const DRAG_SENSITIVITY = 0.4;
const SCRAMBLE_LENGTH = 25;

const FACE_COLORS: Record<FaceKey, string> = {
    U: '#ffffff',
    D: '#ffd500',
    F: '#009e60',
    B: '#0051ba',
    R: '#c41e3a',
    L: '#ff5800',
};

interface FaceConfig {
    normal: Vector3;
    fixedAxis: Axis;
    fixedValue: Coordinate;
    rowAxis: Axis;
    rowCoords: readonly Coordinate[];
    colAxis: Axis;
    colCoords: readonly Coordinate[];
    color: string;
}

const FACE_CONFIGS: Record<FaceKey, FaceConfig> = {
    U: {
        normal: { x: 0, y: 1, z: 0 },
        fixedAxis: 'y',
        fixedValue: 1,
        rowAxis: 'z',
        rowCoords: [-1, 0, 1],
        colAxis: 'x',
        colCoords: [-1, 0, 1],
        color: FACE_COLORS.U,
    },
    D: {
        normal: { x: 0, y: -1, z: 0 },
        fixedAxis: 'y',
        fixedValue: -1,
        rowAxis: 'z',
        rowCoords: [1, 0, -1],
        colAxis: 'x',
        colCoords: [1, 0, -1],
        color: FACE_COLORS.D,
    },
    F: {
        normal: { x: 0, y: 0, z: 1 },
        fixedAxis: 'z',
        fixedValue: 1,
        rowAxis: 'y',
        rowCoords: [1, 0, -1],
        colAxis: 'x',
        colCoords: [-1, 0, 1],
        color: FACE_COLORS.F,
    },
    B: {
        normal: { x: 0, y: 0, z: -1 },
        fixedAxis: 'z',
        fixedValue: -1,
        rowAxis: 'y',
        rowCoords: [1, 0, -1],
        colAxis: 'x',
        colCoords: [1, 0, -1],
        color: FACE_COLORS.B,
    },
    R: {
        normal: { x: 1, y: 0, z: 0 },
        fixedAxis: 'x',
        fixedValue: 1,
        rowAxis: 'y',
        rowCoords: [1, 0, -1],
        colAxis: 'z',
        colCoords: [1, 0, -1],
        color: FACE_COLORS.R,
    },
    L: {
        normal: { x: -1, y: 0, z: 0 },
        fixedAxis: 'x',
        fixedValue: -1,
        rowAxis: 'y',
        rowCoords: [1, 0, -1],
        colAxis: 'z',
        colCoords: [-1, 0, 1],
        color: FACE_COLORS.L,
    },
};

interface MoveSpec {
    axis: Axis;
    layer: Coordinate;
    clockwiseDirection: 1 | -1;
}

const MOVE_SPECS: Record<BaseMove, MoveSpec> = {
    U: { axis: 'y', layer: 1, clockwiseDirection: -1 },
    D: { axis: 'y', layer: -1, clockwiseDirection: 1 },
    F: { axis: 'z', layer: 1, clockwiseDirection: -1 },
    B: { axis: 'z', layer: -1, clockwiseDirection: 1 },
    R: { axis: 'x', layer: 1, clockwiseDirection: -1 },
    L: { axis: 'x', layer: -1, clockwiseDirection: 1 },
};

const MOVE_GROUPS: Array<{ face: BaseMove; moves: Move[] }> = [
    { face: 'U', moves: ['U', "U'", 'U2'] },
    { face: 'D', moves: ['D', "D'", 'D2'] },
    { face: 'F', moves: ['F', "F'", 'F2'] },
    { face: 'B', moves: ['B', "B'", 'B2'] },
    { face: 'R', moves: ['R', "R'", 'R2'] },
    { face: 'L', moves: ['L', "L'", 'L2'] },
];

const normalizeCoordinate = (value: number): Coordinate => {
    if (value > 0) {
        return 1;
    }
    if (value < 0) {
        return -1;
    }
    return 0;
};

const rotateVector = (vector: Vector3, axis: Axis, direction: 1 | -1): Vector3 => {
    const { x, y, z } = vector;
    switch (axis) {
        case 'x':
            return {
                x,
                y: direction === 1 ? normalizeCoordinate(-z) : normalizeCoordinate(z),
                z: direction === 1 ? normalizeCoordinate(y) : normalizeCoordinate(-y),
            };
        case 'y':
            return {
                x: direction === 1 ? normalizeCoordinate(z) : normalizeCoordinate(-z),
                y,
                z: direction === 1 ? normalizeCoordinate(-x) : normalizeCoordinate(x),
            };
        case 'z':
        default:
            return {
                x: direction === 1 ? normalizeCoordinate(-y) : normalizeCoordinate(y),
                y: direction === 1 ? normalizeCoordinate(x) : normalizeCoordinate(-x),
                z,
            };
    }
};

const rotateLayer = (stickers: CubeSticker[], axis: Axis, layer: Coordinate, direction: 1 | -1): CubeSticker[] =>
    stickers.map((sticker) => {
        if (sticker.position[axis] !== layer) {
            return sticker;
        }

        return {
            ...sticker,
            position: rotateVector(sticker.position, axis, direction),
            normal: rotateVector(sticker.normal, axis, direction),
        };
    });

const invertDirection = (direction: 1 | -1): 1 | -1 => (direction === 1 ? -1 : 1);

const applySingleMove = (stickers: CubeSticker[], move: Move): CubeSticker[] => {
    const base = move[0] as BaseMove;
    const spec = MOVE_SPECS[base];
    const isPrime = move.includes("'");
    const isDouble = move.includes('2');
    const direction = isPrime ? invertDirection(spec.clockwiseDirection) : spec.clockwiseDirection;

    let current = stickers;
    const turns = isDouble ? 2 : 1;
    for (let turn = 0; turn < turns; turn += 1) {
        current = rotateLayer(current, spec.axis, spec.layer, direction);
    }
    return current;
};

const applyMoves = (stickers: CubeSticker[], moves: Move[]): CubeSticker[] =>
    moves.reduce<CubeSticker[]>((current, move) => applySingleMove(current, move), stickers);

const generateScramble = (length: number): Move[] => {
    const scramble: Move[] = [];
    let lastAxis: Axis | null = null;
    let lastBase: BaseMove | null = null;
    const modifiers: Array<'' | "'" | '2'> = ['', "'", '2'];
    const faces: BaseMove[] = ['U', 'D', 'F', 'B', 'R', 'L'];

    for (let index = 0; index < length; index += 1) {
        let base: BaseMove;
        do {
            base = faces[Math.floor(Math.random() * faces.length)];
        } while (base === lastBase || MOVE_SPECS[base].axis === lastAxis);

        const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
        scramble.push(`${base}${modifier}` as Move);
        lastBase = base;
        lastAxis = MOVE_SPECS[base].axis;
    }

    return scramble;
};

const createInitialCubeState = (): CubeSticker[] => {
    const stickers: CubeSticker[] = [];

    (Object.keys(FACE_CONFIGS) as FaceKey[]).forEach((face) => {
        const config = FACE_CONFIGS[face];
        for (let row = 0; row < 3; row += 1) {
            for (let col = 0; col < 3; col += 1) {
                const position: Vector3 = { x: 0, y: 0, z: 0 };
                position[config.fixedAxis] = config.fixedValue;
                position[config.rowAxis] = config.rowCoords[row];
                position[config.colAxis] = config.colCoords[col];

                stickers.push({
                    id: `${face}-${row}-${col}`,
                    color: config.color,
                    position,
                    normal: { ...config.normal },
                });
            }
        }
    });

    return stickers;
};

const getFaceStickers = (stickers: CubeSticker[], face: FaceKey): string[] => {
    const config = FACE_CONFIGS[face];
    const colors: string[] = Array.from({ length: 9 }, () => config.color);

    stickers.forEach((sticker) => {
        if (
            sticker.normal.x === config.normal.x &&
            sticker.normal.y === config.normal.y &&
            sticker.normal.z === config.normal.z
        ) {
            const rowIndex = config.rowCoords.indexOf(sticker.position[config.rowAxis]);
            const colIndex = config.colCoords.indexOf(sticker.position[config.colAxis]);
            if (rowIndex >= 0 && colIndex >= 0) {
                colors[rowIndex * 3 + colIndex] = sticker.color;
            }
        }
    });

    return colors;
};

const formatMoveLabel = (move: Move): string => move.replace("'", '′');

const scrambleRotation = (): Rotation => ({
    x: Math.random() * 180 - 90,
    y: Math.random() * 360 - 180,
});

interface CubeFaceProps {
    className: string;
    colors: string[];
    label: string;
}

const CubeFace: React.FC<CubeFaceProps> = ({ className, colors, label }) => (
    <div className={className} data-label={label}>
        {colors.map((color, index) => (
            <span key={index} className="cube-game__sticker" style={{ backgroundColor: color }} />
        ))}
    </div>
);

const CubeChallenge: React.FC = () => {
    const [rotation, setRotation] = useState<Rotation>(() => ({ x: -30, y: 35 }));
    const [cubeState, setCubeState] = useState<CubeSticker[]>(() => createInitialCubeState());
    const dragOrigin = useRef<{ x: number; y: number } | null>(null);

    const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        dragOrigin.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    const handlePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!dragOrigin.current) {
            return;
        }

        const deltaX = event.clientX - dragOrigin.current.x;
        const deltaY = event.clientY - dragOrigin.current.y;
        dragOrigin.current = { x: event.clientX, y: event.clientY };

        setRotation((prev) => ({
            x: prev.x + deltaY * DRAG_SENSITIVITY,
            y: prev.y + deltaX * DRAG_SENSITIVITY,
        }));
    }, []);

    const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        dragOrigin.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
    }, []);

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        const key = event.key;
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
            return;
        }

        event.preventDefault();

        setRotation((prev) => {
            switch (key) {
                case 'ArrowUp':
                    return { x: prev.x - ROTATION_STEP, y: prev.y };
                case 'ArrowDown':
                    return { x: prev.x + ROTATION_STEP, y: prev.y };
                case 'ArrowLeft':
                    return { x: prev.x, y: prev.y - ROTATION_STEP };
                case 'ArrowRight':
                    return { x: prev.x, y: prev.y + ROTATION_STEP };
                case 'Home':
                    return { x: -30, y: 35 };
                case 'End':
                    return scrambleRotation();
                default:
                    return prev;
            }
        });
    }, []);

    const rotationStyle = useMemo(
        () => ({
            transform: `translate3d(-50%, -50%, 0) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }),
        [rotation.x, rotation.y],
    );

    const faceColors = useMemo(
        () => ({
            front: getFaceStickers(cubeState, 'F'),
            back: getFaceStickers(cubeState, 'B'),
            left: getFaceStickers(cubeState, 'L'),
            right: getFaceStickers(cubeState, 'R'),
            top: getFaceStickers(cubeState, 'U'),
            bottom: getFaceStickers(cubeState, 'D'),
        }),
        [cubeState],
    );

    const handleMove = useCallback((move: Move) => {
        setCubeState((prev) => applyMoves(prev, [move]));
    }, []);

    const scramble = useCallback(() => {
        const sequence = generateScramble(SCRAMBLE_LENGTH);
        setCubeState((prev) => applyMoves(prev, sequence));
    }, []);

    const reset = useCallback(() => {
        setCubeState(createInitialCubeState());

    }, []);

    return (
        <section className="cube-game">
            <header className="cube-game__header">
                <h3 className="cube-game__title">Cube Challenge</h3>

                <p className="cube-game__subtitle">
                    Solve a full 3×3 cube with authentic face turns. Drag to inspect and use the notation buttons to manipulate each
                    layer.
                </p>

            </header>

            <div
                className="cube-game__stage"
                role="application"
                aria-label="Interactive 3D cube"
                tabIndex={0}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={handleKeyDown}
            >
                <div className="cube-game__scene">
                    <div className="cube-game__cube" style={rotationStyle}>

                        <CubeFace className="cube-game__face cube-game__face--front" colors={faceColors.front} label="Front" />
                        <CubeFace className="cube-game__face cube-game__face--back" colors={faceColors.back} label="Back" />
                        <CubeFace className="cube-game__face cube-game__face--left" colors={faceColors.left} label="Left" />
                        <CubeFace className="cube-game__face cube-game__face--right" colors={faceColors.right} label="Right" />
                        <CubeFace className="cube-game__face cube-game__face--top" colors={faceColors.top} label="Top" />
                        <CubeFace className="cube-game__face cube-game__face--bottom" colors={faceColors.bottom} label="Bottom" />

                    </div>
                </div>
            </div>

            <footer className="cube-game__footer">
                <div className="cube-game__controls">
                    <div className="cube-game__move-groups">
                        {MOVE_GROUPS.map((group) => (
                            <div key={group.face} className="cube-game__move-group">
                                <span className="cube-game__move-title">{group.face} face</span>
                                <div className="cube-game__move-buttons">
                                    {group.moves.map((move) => (
                                        <button
                                            key={move}
                                            type="button"
                                            className="cube-game__move-button"
                                            onClick={() => handleMove(move)}
                                            aria-label={`Apply ${move} move`}
                                        >
                                            {formatMoveLabel(move)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="cube-game__buttons">
                        <button type="button" className="cube-game__button" onClick={reset}>
                            Reset
                        </button>
                        <button type="button" className="cube-game__button cube-game__button--primary" onClick={scramble}>
                            Scramble
                        </button>
                    </div>
                </div>
                <p className="cube-game__help">
                    Use the notation buttons to rotate faces (U = Up, D = Down, etc.). Drag or use the arrow keys to inspect the cube.
                    <kbd>Home</kbd> resets the view and <kbd>End</kbd> randomizes it.
                </p>
            </footer>
        </section>
    );
};



export default CubeChallenge;
