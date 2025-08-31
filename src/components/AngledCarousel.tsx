'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {X} from 'lucide-react'

import sigmavideoone from "../../public/video/v1.mp4"
import skibidivideoone from "../../public/video/v2.mp4"
import brrbrrvideoone from "../../public/video/v3.mp4"
import tungtungtungtungtungtungtungvideo from "../../public/video/v4.mp4"

// угол передаётся в градусах, но нужен в радианах
const toRad = (deg) => (deg * Math.PI) / 180

const AngledCarousel = ({
  items = [
    { video: sigmavideoone, title: 'Sigma Video', text: 'This is the first carousel video.' },
    {
      video: skibidivideoone,
      title: 'Skibidi Video',
      text:
        'Cube Challenge – Take your puzzle-solving skills to the next level with this advanced Rubik’s Cube game. Designed for seasoned cubers and daring beginners alike, it offers complex patterns, time challenges, and mind-bending twists that push your spatial reasoning and memory to the limit. Solve increasingly difficult scrambles, unlock new cube sizes and shapes, and test yourself against the clock—or challenge friends in head-to-head puzzle duels. With sleek animations, customizable cube designs, and an immersive 3D interface, this is more than just a cube… it’s a mental battleground.',
    },
    { video: brrbrrvideoone, title: 'Brr Brr Video', text: 'This is the third carousel video.' },
    { video: tungtungtungtungtungtungtungvideo, title: 'Tung Tung Tung', text: 'This is the fourth carousel video.' },
  ],
  angle = 20,
  cardWidth = 720, // безопасный дефолт без window.* (SSR friendly)
  cardHeight = 520,
  spacing = 1.1,
  descriptionLimit = 69, // n — порог длины описания, после которого показываем кнопку "more"
  modalWidth = 800,
  modalHeight = 500,
  moreLabel = 'more',
  closeLabel = 'Close',
}) => {
  const [currentIndex, setCurrentIndex] = useState(Math.floor(items.length / 2))
  const [openIdx, setOpenIdx] = useState(null) // индекс карточки, для которой открыт модал
  const containerRef = useRef(null)

  const rad = toRad(angle)
  const step = cardWidth * spacing

  const handleWheel = useCallback(
    (e) => {
      // блокируем дефолтный скролл, чтобы прокрутка управляла только каруселью
      e.preventDefault()
      const delta = Math.sign(e.deltaY)
      setCurrentIndex((index) => {
        const nextIndex = index + delta
        return Math.max(0, Math.min(nextIndex, items.length - 1))
      })
    },
    [items.length]
  )

  // Закрытие модалки по ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenIdx(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const truncate = (s, n) => (s.length > n ? s.slice(0, Math.max(0, n)).trimEnd() + '…' : s)

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none flex justify-center items-center"
      style={{ height: cardHeight * 2 }}
    >
      {items.map((item, idx) => {
        const offset = idx - currentIndex
        const isActive = offset === 0
        const xPos = offset * step * Math.cos(rad)
        const yPos = offset * step * Math.sin(rad)
        const scale = isActive ? 1 : 0.85
        const opacity = isActive ? 1 : 0.5
        const zIndex = 100 - Math.abs(offset)

        const isLong = (item.text || '').length > descriptionLimit

        return (
          <motion.div
            key={idx}
            animate={{ x: xPos, y: yPos, scale, opacity, zIndex }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute rounded-lg cursor-pointer flex"
            onClick={() => setCurrentIndex(idx)}
            style={{ width: cardWidth + 250, height: cardHeight }} // место справа под текст
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
            />

            {/* Правая колонка */}
            <div className="w-full p-3 pr-4 flex flex-col justify-center gap-3 rounded-r-lg">
              {/* Верхний бокс (заголовок) */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 backdrop-blur rounded-xl shadow-md px-4 py-3"
              >
                <h2 className="text-lg font-semibold tracking-wide">{item.title ?? 'Untitled'}</h2>
              </motion.div>

              {/* Нижний бокс (описание) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-gray-50/90 backdrop-blur rounded-xl shadow-inner px-4 py-4"
              >
                <p className="text-gray-800 text-sm leading-relaxed">
                  {isLong ? truncate(item.text, descriptionLimit) : item.text}
                </p>

                {isLong && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenIdx(idx)
                      }}
                      className="text-sm font-medium hover:opacity-80 focus:outline-none  bg-white border-none"
                    >
                      {moreLabel}
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Модальное окно для полного описания */}
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    key="modal"
                    className="fixed inset-0 z-[999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Бекдроп */}
                    <motion.div
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                      aria-hidden="true"
                      onClick={() => setOpenIdx(null)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />

                    {/* Диалог */}
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
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        aria-label="Close"
                        className="absolute top-3 right-3 rounded-xl px-3 py-1 text-sm hover:bg-gray-100 focus:outline-none"
                        onClick={() => setOpenIdx(null)}
                      >
                        <X />
                      </button>


                        <h3 className="text-xl font-semibold mb-3 pr-16">{item.title ?? 'Details'}</h3>
                        <div className="h-[calc(100%-4.5rem)] overflow-auto pr-1">
                          <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">
                            {item.text}</p>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export default AngledCarousel
