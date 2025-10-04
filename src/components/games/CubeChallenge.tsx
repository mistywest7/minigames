import React, { useCallback, useMemo, useRef, useState } from 'react';
import './CubeChallenge.css';

type Coordinate = -1 | 0 | 1;
type Axis = 'x' | 'y' | 'z';
type FaceKey = 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
type BaseMove = FaceKey;
type Move = `${BaseMove}${'' | "'" | '2'}`;

type DragIntent = 'cw' | 'ccw' | 'double' | null;

interface PointerDragState {
    pointerId: number;
    originX: number;
    originY: number;
    activeMove: Move | null;
}

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
const MOVE_DRAG_THRESHOLD = 28;

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

const FACE_MOVES: Record<FaceKey, [Move, Move, Move]> = {
    U: ['U', "U'", 'U2'],
    D: ['D', "D'", 'D2'],
    F: ['F', "F'", 'F2'],
    B: ['B', "B'", 'B2'],
    R: ['R', "R'", 'R2'],
    L: ['L', "L'", 'L2'],
};

const FACE_RENDER_CONFIG = [
    { face: 'F' as FaceKey, className: 'cube-game__face cube-game__face--front', label: 'Front' },
    { face: 'B' as FaceKey, className: 'cube-game__face cube-game__face--back', label: 'Back' },
    { face: 'L' as FaceKey, className: 'cube-game__face cube-game__face--left', label: 'Left' },
    { face: 'R' as FaceKey, className: 'cube-game__face cube-game__face--right', label: 'Right' },
    { face: 'U' as FaceKey, className: 'cube-game__face cube-game__face--top', label: 'Top' },
    { face: 'D' as FaceKey, className: 'cube-game__face cube-game__face--bottom', label: 'Bottom' },
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

const scrambleRotation = (): Rotation => ({
    x: Math.random() * 180 - 90,
    y: Math.random() * 360 - 180,
});

interface CubeFaceProps {
    face: FaceKey;
    className: string;
    colors: string[];
    label: string;
    onPointerDown: (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => void;
    onKeyDown: (face: FaceKey, event: React.KeyboardEvent<HTMLDivElement>) => void;
}

const CubeFace: React.FC<CubeFaceProps> = ({
    face,
    className,
    colors,
    label,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onKeyDown,
}) => (
    <div
        className={className}
        data-label={label}
        data-face={face}
        role="button"
        tabIndex={0}
        aria-label={`${label} face`}
        onPointerDown={(event) => onPointerDown(face, event)}
        onPointerMove={(event) => onPointerMove(face, event)}
        onPointerUp={(event) => onPointerUp(face, event)}
        onPointerCancel={(event) => onPointerCancel(face, event)}
        onKeyDown={(event) => onKeyDown(face, event)}
    >
        {colors.map((color, index) => (
            <span key={index} className="cube-game__sticker" style={{ backgroundColor: color }} />
        ))}
    </div>
);

const CubeChallenge: React.FC = () => {
    const [rotation, setRotation] = useState<Rotation>(() => ({ x: -30, y: 35 }));
    const [cubeState, setCubeState] = useState<CubeSticker[]>(() => createInitialCubeState());
    const stageDragOrigin = useRef<{ x: number; y: number } | null>(null);
    const faceDragState = useRef<(PointerDragState & { face: FaceKey }) | null>(null);
    const [activeFaceDrag, setActiveFaceDrag] = useState<{ face: FaceKey; intent: DragIntent } | null>(null);

    const handleStagePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest('[data-face]')) {
            return;
        }

        stageDragOrigin.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    const handleStagePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (!stageDragOrigin.current) {
            return;
        }

        const deltaX = event.clientX - stageDragOrigin.current.x;
        const deltaY = event.clientY - stageDragOrigin.current.y;
        stageDragOrigin.current = { x: event.clientX, y: event.clientY };

        setRotation((prev) => ({
            x: prev.x + deltaY * DRAG_SENSITIVITY,
            y: prev.y + deltaX * DRAG_SENSITIVITY,
        }));
    }, []);

    const handleStagePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        stageDragOrigin.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
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
            F: getFaceStickers(cubeState, 'F'),
            B: getFaceStickers(cubeState, 'B'),
            L: getFaceStickers(cubeState, 'L'),
            R: getFaceStickers(cubeState, 'R'),
            U: getFaceStickers(cubeState, 'U'),
            D: getFaceStickers(cubeState, 'D'),
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

    const finishFaceDrag = useCallback(
        (face: FaceKey, target: HTMLDivElement, pointerId: number, commit: boolean) => {
            const state = faceDragState.current;
            if (!state || state.pointerId !== pointerId || state.face !== face) {
                return;
            }

            if (commit && state.activeMove) {
                handleMove(state.activeMove);
            }

            faceDragState.current = null;
            setActiveFaceDrag(null);

            if (target.hasPointerCapture(pointerId)) {
                target.releasePointerCapture(pointerId);
            }
        },
        [handleMove],
    );

    const handleFacePointerDown = useCallback((face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        faceDragState.current = {
            face,
            pointerId: event.pointerId,
            originX: event.clientX,
            originY: event.clientY,
            activeMove: null,
        };
        setActiveFaceDrag({ face, intent: null });
        event.currentTarget.setPointerCapture(event.pointerId);
    }, []);

    const handleFacePointerMove = useCallback(
        (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => {
            const state = faceDragState.current;
            if (!state || state.pointerId !== event.pointerId || state.face !== face) {
                return;
            }

            const deltaX = event.clientX - state.originX;
            const deltaY = event.clientY - state.originY;

            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);
            let intent: DragIntent = null;

            if (absX >= MOVE_DRAG_THRESHOLD || absY >= MOVE_DRAG_THRESHOLD) {
                if (absX > absY) {
                    intent = deltaX > 0 ? 'cw' : 'ccw';
                } else {
                    intent = 'double';
                }
            }

            let nextMove: Move | null = null;
            if (intent === 'cw') {
                nextMove = FACE_MOVES[face][0];
            } else if (intent === 'ccw') {
                nextMove = FACE_MOVES[face][1];
            } else if (intent === 'double') {
                nextMove = FACE_MOVES[face][2];
            }

            state.activeMove = nextMove;
            setActiveFaceDrag((prev) => {
                if (prev && prev.face === face && prev.intent === intent) {
                    return prev;
                }
                return { face, intent };
            });
        },
        [],
    );

    const handleFacePointerUp = useCallback(
        (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => {
            event.stopPropagation();
            finishFaceDrag(face, event.currentTarget, event.pointerId, true);
        },
        [finishFaceDrag],
    );

    const handleFacePointerCancel = useCallback(
        (face: FaceKey, event: React.PointerEvent<HTMLDivElement>) => {
            finishFaceDrag(face, event.currentTarget, event.pointerId, false);
        },
        [finishFaceDrag],
    );

    const handleFaceKeyDown = useCallback(
        (face: FaceKey, event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleMove(FACE_MOVES[face][0]);
            } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                handleMove(FACE_MOVES[face][1]);
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                handleMove(FACE_MOVES[face][2]);
            }
        },
        [handleMove],
    );

    return (
        <section className="cube-game">
            <header className="cube-game__header">
                <h3 className="cube-game__title">Cube Challenge</h3>

                <p className="cube-game__subtitle">
                    Spin the cube to inspect every side and drag directly on any face to twist it. Restore every color to solve the puzzle.
                </p>
            </header>

            <div
                className="cube-game__stage"
                role="application"
                aria-label="Interactive 3D cube"
                tabIndex={0}
                onPointerDown={handleStagePointerDown}
                onPointerMove={handleStagePointerMove}
                onPointerUp={handleStagePointerUp}
                onPointerCancel={handleStagePointerUp}
                onKeyDown={handleKeyDown}
            >
                <div className="cube-game__stage-actions">
                    <button
                        type="button"
                        className="cube-game__stage-button"
                        onClick={reset}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        Reset
                    </button>
                    <button
                        type="button"
                        className="cube-game__stage-button cube-game__stage-button--primary"
                        onClick={scramble}
                        onPointerDown={(event) => event.stopPropagation()}
                    >
                        Scramble
                    </button>
                </div>
                <div className="cube-game__scene">
                    <div className="cube-game__cube" style={rotationStyle}>
                        {FACE_RENDER_CONFIG.map(({ face, className, label }) => {
                            const isActive = activeFaceDrag?.face === face;
                            const intent = isActive ? activeFaceDrag?.intent ?? null : null;
                            const faceClassName = [
                                className,
                                'cube-game__face--interactive',
                                isActive ? 'cube-game__face--dragging' : null,
                                intent ? `cube-game__face--intent-${intent}` : null,
                            ]
                                .filter((value): value is string => Boolean(value))
                                .join(' ');

                            return (
                                <CubeFace
                                    key={face}
                                    face={face}
                                    className={faceClassName}
                                    colors={faceColors[face]}
                                    label={label}
                                    onPointerDown={handleFacePointerDown}
                                    onPointerMove={handleFacePointerMove}
                                    onPointerUp={handleFacePointerUp}
                                    onPointerCancel={handleFacePointerCancel}
                                    onKeyDown={handleFaceKeyDown}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CubeChallenge;
