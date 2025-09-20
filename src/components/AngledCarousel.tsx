'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import sigmavideoone from '../../public/video/v1.mp4';
import skibidivideoone from '../../public/video/v2.mp4';
import brrbrrvideoone from '../../public/video/v3.mp4';
import tungtungtungtungtungtungtungvideo from '../../public/video/v4.mp4';

interface CarouselItem {
    video: string;
    title?: string;
    text?: string;
}

interface AngledCarouselProps {
    items?: CarouselItem[];
    angle?: number;
    cardWidth?: number;
    cardHeight?: number;
    spacing?: number;
    descriptionLimit?: number;
    modalWidth?: number;
    modalHeight?: number;
    moreLabel?: string;
    closeLabel?: string;
}

const DEFAULT_ITEMS: CarouselItem[] = [
    { video: sigmavideoone, title: 'Sigma Video', text: 'This is the first carousel video.' },
    {
        video: skibidivideoone,
        title: 'Skibidi Video',
        text: 'Cube Challenge – Take your puzzle-solving skills to the next level with this advanced Rubik’s Cube game. Designed for seasoned cubers and daring beginners alike, it offers complex patterns, time challenges, and mind-bending twists that push your spatial reasoning and memory to the limit. Solve increasingly difficult scrambles, unlock new cube sizes and shapes, and test yourself against the clock—or challenge friends in head-to-head puzzle duels. With sleek animations, customizable cube designs, and an immersive 3D interface, this is more than just a cube… it’s a mental battleground.',
    },
    { video: brrbrrvideoone, title: 'Brr Brr Video', text: 'This is the third carousel video.' },
    { video: tungtungtungtungtungtungtungvideo, title: 'Tung Tung Tung', text: 'This is the fourth carousel video.' },
];

const toRad = (deg: number) => (deg * Math.PI) / 180;

const AngledCarousel: React.FC<AngledCarouselProps> = ({
    items = DEFAULT_ITEMS,
    angle = 20,
    cardWidth = 720,
    cardHeight = 520,
    spacing = 1.1,
    descriptionLimit = 200,
    modalWidth = 800,
    modalHeight = 500,
    moreLabel = 'more',
    closeLabel = 'Close',
}) => {
    const [currentIndex, setCurrentIndex] = useState<number>(Math.floor(items.length / 2));
    const [openIdx, setOpenIdx] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const rad = toRad(angle);
    const step = cardWidth * spacing;

    const handleWheel = useCallback(
        (event: WheelEvent) => {
            event.preventDefault();
            const delta = Math.sign(event.deltaY);
            setCurrentIndex((index) => {
                const nextIndex = index + delta;
                return Math.max(0, Math.min(nextIndex, items.length - 1));
            });
        },
        [items.length],
    );

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpenIdx(null);
            }
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    const truncate = useCallback(
        (text: string, limit: number) => (text.length > limit ? `${text.slice(0, Math.max(0, limit)).trimEnd()}…` : text),
        [],
    );

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden select-none flex justify-center items-center"
            style={{ height: cardHeight * 2 }}
        >
            {items.map((item, idx) => {
                const offset = idx - currentIndex;
                const isActive = offset === 0;
                const xPos = offset * step * Math.cos(rad);
                const yPos = offset * step * Math.sin(rad);
                const scale = isActive ? 1 : 0.85;
                const opacity = isActive ? 1 : 0.5;
                const zIndex = 100 - Math.abs(offset);

                const description = item.text ?? '';
                const isLong = description.length > descriptionLimit;

                return (
                    <motion.div
                        key={idx}
                        animate={{ x: xPos, y: yPos, scale, opacity, zIndex }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="absolute rounded-lg cursor-pointer flex"
                        onClick={() => setCurrentIndex(idx)}
                        style={{ width: cardWidth + 250, height: cardHeight }}
                    >
                        <video
                            src={item.video}
                            width={cardWidth - 125}
                            height={cardHeight - 16}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="flex-shrink-0 rounded-l-lg"
                        />

                        <div className="w-full p-3 pr-4 flex flex-col justify-center gap-3 rounded-r-lg">
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                                className="bg-white/90 backdrop-blur rounded-xl shadow-md px-4 py-3"
                            >
                                <h2 className="text-lg font-semibold tracking-wide">{item.title ?? 'Untitled'}</h2>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                transition={{ duration: 0.4, delay: 0.1 }}
                                className="bg-gray-50/90 backdrop-blur rounded-xl shadow-inner px-4 py-4"
                            >
                                <p className="text-gray-800 text-sm leading-relaxed">
                                    {isLong ? truncate(description, descriptionLimit) : description}
                                </p>

                                {isLong && (
                                    <div className="mt-3">
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                setOpenIdx(idx);
                                            }}
                                            className="text-sm font-medium underline underline-offset-4 hover:opacity-80 focus:outline-none"
                                        >
                                            {moreLabel}
                                        </button>
                                    </div>
                                )}
                            </motion.div>

                            <AnimatePresence>
                                {openIdx === idx && (
                                    <motion.div
                                        key="modal"
                                        className="fixed inset-0 z-[999] flex items-center justify-center"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                            aria-hidden="true"
                                            onClick={() => setOpenIdx(null)}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        />

                                        <motion.div
                                            role="dialog"
                                            aria-modal="true"
                                            aria-label={item.title ?? 'Details'}
                                            initial={{ opacity: 0, scale: 0.95, y: 16 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98, y: 8 }}
                                            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                                            className="relative bg-white rounded-2xl shadow-2xl p-6 mx-4"
                                            style={{ width: modalWidth, height: modalHeight }}
                                            onClick={(event) => event.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                aria-label="Close"
                                                className="absolute top-3 right-3 rounded-xl px-3 py-1 text-sm hover:bg-gray-100 focus:outline-none"
                                                onClick={() => setOpenIdx(null)}
                                            >
                                                {closeLabel}
                                            </button>

                                            <h3 className="text-xl font-semibold mb-3 pr-16">{item.title ?? 'Details'}</h3>
                                            <div className="h-[calc(100%-4.5rem)] overflow-auto pr-1">
                                                <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                                                    {description}
                                                </p>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AngledCarousel;
