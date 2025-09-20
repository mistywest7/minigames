import './App.css';
import AngledCarousel from './components/AngledCarousel.tsx';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.tsx';
import NotFound from './components/NotFound.tsx';
import { useEffect, useState } from 'react';
import ListOfGames from './components/ListOfGames.tsx';
import CubeChallenge from './components/games/CubeChallenge.tsx';

function App() {
    const [, setTelegramWebApp] = useState<unknown | null>(null);

    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            setTelegramWebApp(window.Telegram.WebApp);
            window.Telegram.WebApp.ready();
        }
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;

        script.onload = () => {
            if (window.Telegram && window.Telegram.WebApp) {
                setTelegramWebApp(window.Telegram.WebApp);
                window.Telegram.WebApp.ready();
            }
        };

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <>
            <Header />

            <Routes>
                <Route path="/" element={<ListOfGames />} />
                <Route path="/games/cube-challenge" element={<CubeChallenge />} />
                <Route path="/carousel" element={<AngledCarousel />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </>
    );
}

export default App;
