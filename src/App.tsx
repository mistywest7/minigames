import './App.css'
import AngledCarousel from './components/AngledCarousel.tsx';
import {Route, Routes} from 'react-router-dom';
import Header from "./components/Header.tsx";
import NotFound from "./components/NotFound.tsx";
import {useEffect, useState} from "react";


function App() {

    const [tg, setTg] = useState(null);

    useEffect(() => {
        if (window.Telegram && window.Telegram.WebApp) {
            setTg(window.Telegram.WebApp);
            window.Telegram.WebApp.ready();
        }
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;

        script.onload = () => {
            if (window.Telegram && window.Telegram.WebApp) {
                setTg(window.Telegram.WebApp);
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
            <Header/>

            <Routes>
                <Route path="*" element={<NotFound/>}/>
                <Route path="/" element={<AngledCarousel/>}/>


            </Routes>


            {/*// <Carousel />*/}
        </>
    )
}

export default App

