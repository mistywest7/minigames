import {useRef, useState, useEffect, useCallback} from 'react';
import {motion} from 'framer-motion';
import sigmavideoone from "../../public/video/v1.mp4"
import skibidivideoone from "../../public/video/v2.mp4"
import brrbrrvideoone from "../../public/video/v3.mp4"
import tungtungtungtungtungtungtungvideo from "../../public/video/v4.mp4"

// угол передаётся в градусах, но нужен в радианах
const toRad = (deg) => (deg * Math.PI) / 180;

const AngledCarousel = ({
                            items = [sigmavideoone, skibidivideoone, brrbrrvideoone, tungtungtungtungtungtungtungvideo],
                            angle = 20, // градусы, поменяй под себя
                             cardWidth = window.innerWidth,
                            cardHeight = 600,
                            spacing = 1.1, // множитель ширины карточки
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
                // КАРУСЕЛЬ ПОД УГЛОМ!
                const xPos = offset * step * Math.cos(rad);
                const yPos = offset * step * Math.sin(rad);
                const scale = offset === 0 ? 1 : 0.85;
                const opacity = offset === 0 ? 1 : 0.5;
                const zIndex = 100 - Math.abs(offset);

                return (
                    <motion.div
                        key={idx}
                        animate={{x: xPos, y: yPos, scale, opacity, zIndex}}
                        transition={{type: 'spring', stiffness: 300, damping: 30}}
                        className="absolute rounded-lg shadow-lg cursor-pointer w-full"
                        onClick={() => setCurrentIndex(idx)}
                        style={{width: cardWidth, height: cardHeight}}
                    >
                        <video
                            src={item}
                            width={cardWidth - 16}
                            height={cardHeight - 16}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="flex items-center justify-center w-full h-full text-lg font-semibold">
                        </video>

                    </motion.div>
                );
            })}
        </div>
    );
};

export default AngledCarousel;











