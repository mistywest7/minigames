import { NavLink } from 'react-router-dom';

const Header = () => {
    return (
        <header className="app-header">
            <h1 className="app-header__title">Mini Games Hub</h1>
            <nav className="app-header__nav" aria-label="Primary navigation">
                <NavLink to="/" end className={({ isActive }) => `app-header__link ${isActive ? 'app-header__link--active' : ''}`}>
                    Library
                </NavLink>
                <NavLink
                    to="/games/cube-challenge"
                    className={({ isActive }) => `app-header__link ${isActive ? 'app-header__link--active' : ''}`}
                >
                    Cube Challenge
                </NavLink>
                <NavLink
                    to="/carousel"
                    className={({ isActive }) => `app-header__link ${isActive ? 'app-header__link--active' : ''}`}
                >
                    Featured
                </NavLink>
            </nav>
        </header>
    );
};

export default Header;
