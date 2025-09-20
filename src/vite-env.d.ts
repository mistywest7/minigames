/// <reference types="vite/client" />

declare global {
    interface TelegramWebApp {
        ready: () => void;
    }

    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

export {};
