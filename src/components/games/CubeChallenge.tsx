import React, { useCallback, useMemo, useRef, useState } from 'react';
import './CubeChallenge.css';

type Rotation = {
    x: number;
    y: number;
};

const ROTATION_STEP = 15;
const DRAG_SENSITIVITY = 0.4;

const scrambleRotation = (): Rotation => {
    const randomAngle = () => Math.round((Math.random() * 360 - 180) / ROTATION_STEP) * ROTATION_STEP;
    return {
        x: randomAngle(),
        y: randomAngle(),
    };
};

const CubeChallenge: React.FC = () => {
    const [rotation, setRotation] = useState<Rotation>(() => ({ x: -30, y: 35 }));
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

    const scramble = useCallback(() => {
        setRotation(scrambleRotation());
    }, []);

    const reset = useCallback(() => {
        setRotation({ x: -30, y: 35 });
    }, []);

    return (
        <section className="cube-game">
            <header className="cube-game__header">
                <h3 className="cube-game__title">Cube Challenge</h3>
                <p className="cube-game__subtitle">Rotate the cube by dragging, or use your keyboard for precise moves.</p>
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
                        <CubeFace className="cube-game__face cube-game__face--front" color="#0f62fe" label="Front" />
                        <CubeFace className="cube-game__face cube-game__face--back" color="#ff7eb6" label="Back" />
                        <CubeFace className="cube-game__face cube-game__face--left" color="#42be65" label="Left" />
                        <CubeFace className="cube-game__face cube-game__face--right" color="#fa4d56" label="Right" />
                        <CubeFace className="cube-game__face cube-game__face--top" color="#f1c21b" label="Top" />
                        <CubeFace className="cube-game__face cube-game__face--bottom" color="#a56eff" label="Bottom" />
                    </div>
                </div>
            </div>

            <footer className="cube-game__footer">
                <div className="cube-game__buttons">
                    <button type="button" className="cube-game__button" onClick={reset}>
                        Reset
                    </button>
                    <button type="button" className="cube-game__button cube-game__button--primary" onClick={scramble}>
                        Scramble
                    </button>
                </div>
                <p className="cube-game__help">
                    Keyboard shortcuts: use arrow keys to rotate, <kbd>Home</kbd> to reset and <kbd>End</kbd> to scramble.
                </p>
            </footer>
        </section>
    );
};

interface CubeFaceProps {
    className: string;
    color: string;
    label: string;
}

const CubeFace: React.FC<CubeFaceProps> = ({ className, color, label }) => {
    const stickers = useMemo(() => Array.from({ length: 9 }), []);

    return (
        <div className={className} data-label={label}>
            {stickers.map((_, index) => (
                <span key={index} className="cube-game__sticker" style={{ backgroundColor: color }} />
            ))}
        </div>
    );
};

export default CubeChallenge;
