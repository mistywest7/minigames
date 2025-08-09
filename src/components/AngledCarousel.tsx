import {useRef, useState, useEffect, useCallback} from 'react';
import {motion} from 'framer-motion';
import sigmavideoone from "../../public/video/v1.mp4"
import skibidivideoone from "../../public/video/v2.mp4"
import brrbrrvideoone from "../../public/video/v3.mp4"
import tungtungtungtungtungtungtungvideo from "../../public/video/v4.mp4"

// угол передаётся в градусах, но нужен в радианах
const toRad = (deg) => (deg * Math.PI) / 180;

const AngledCarousel = ({
                            items = [
                                { video: sigmavideoone, title: "Sigma Video", text: "This is the first carousel video." },
                                { video: skibidivideoone, title: "Skibidi Video", text: "Cube Challenge – Take your puzzle-solving skills to the next level with this advanced Rubik’s Cube game. Designed for seasoned cubers and daring beginners alike, it offers complex patterns, time challenges, and mind-bending twists that push your spatial reasoning and memory to the limit. Solve increasingly difficult scrambles, unlock new cube sizes and shapes, and test yourself against the clock—or challenge friends in head-to-head puzzle duels. With sleek animations, customizable cube designs, and an immersive 3D interface, this is more than just a cube… it’s a mental battleground." },
                                { video: brrbrrvideoone, title: "Brr Brr Video", text: "This is the third carousel video." },
                                { video: tungtungtungtungtungtungtungvideo, title: "Tung Tung Tung", text: "This is the fourth carousel video." }
                            ],
                            angle = 20,
                            cardWidth = window.innerWidth * 0.55, // немного меньше, чтобы больше помещалось
                            cardHeight = 520, // ниже, чтобы влезало по высоте
                            spacing = 1.1,
                        }) => {
    const [currentIndex, setCurrentIndex] = useState(Math.floor(items.length / 2));
    const containerRef = useRef(null);

    const rad = toRad(angle);
    const step = cardWidth * spacing;

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = Math.sign(e.deltaY);
        setCurrentIndex((index) => {
            const nextIndex = index + delta;
            return Math.max(0, Math.min(nextIndex, items.length - 1));
        });
    }, [items.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        container.addEventListener('wheel', handleWheel, {passive: false});
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden select-none flex justify-center items-center"
            style={{height: cardHeight * 2}}
        >
            {items.map((item, idx) => {
                const offset = idx - currentIndex;
                const isActive = offset === 0;
                const xPos = offset * step * Math.cos(rad);
                const yPos = offset * step * Math.sin(rad);
                const scale = isActive ? 1 : 0.85;
                const opacity = isActive ? 1 : 0.5;
                const zIndex = 100 - Math.abs(offset);

                return (
                    <motion.div
                        key={idx}
                        animate={{x: xPos, y: yPos, scale, opacity, zIndex}}
                        transition={{type: 'spring', stiffness: 300, damping: 30}}
                        className="absolute rounded-lg cursor-pointer flex"
                        onClick={() => setCurrentIndex(idx)}
                        style={{width: cardWidth + 250, height: cardHeight}} // 240px для текста справа
                    >
                        {/* Видео */}
                        <video
                            src={item.video}
                            width={cardWidth - 125}
                            height={cardHeight - 16}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="flex-shrink-0 rounded-l-lg"
                        ></video>

                        {/* Правая колонка */}
                        <div className="w-full p-3 pr-4 flex flex-col justify-center gap-3 rounded-r-lg">
                            {/* Верхний бокс (заголовок) */}
                            <motion.div
                                initial={{opacity: 0, y: -10}}
                                animate={isActive ? {opacity: 1, y: 0} : {opacity: 0, y: -10}}
                                transition={{duration: 0.4}}
                                className="bg-white/90 backdrop-blur rounded-xl shadow-md px-4 py-3"
                            >
                                <h2 className="text-lg font-semibold tracking-wide">???</h2>
                            </motion.div>

                            {/* Нижний бокс (описание) */}
                            <motion.div
                                initial={{opacity: 0, y: 10}}
                                animate={isActive ? {opacity: 1, y: 0} : {opacity: 0, y: 10}}
                                transition={{duration: 0.4, delay: 0.1}}
                                className="bg-gray-50/90 backdrop-blur rounded-xl shadow-inner px-4 py-4"

                            >
                                <p className="text-gray-800 text-sm leading-relaxed">
                                    {item.text}
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default AngledCarousel;
