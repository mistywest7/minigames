import './App.css'
import {Route, Routes} from 'react-router-dom';
import NotFound from "./components/NotFound.tsx";
import {useEffect, useState} from "react";
import Homepage from "./components/Homepage.tsx";


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

            <Routes>
                <Route path="*" element={<NotFound/>}/>
                <Route path="/" element={<Homepage/>}/>


            </Routes>


            {/*// <Carousel />*/}
        </>
    )
}

export default App

