import { PaletteOptions } from '@mui/material/styles';

// Create a theme instance.
const darkThemePalette: PaletteOptions = {
    mode: 'dark',
    primary: {
        main: '#fff',
        contrastText: '#000',
    },
    secondary: {
        main: 'rgba(255, 255, 255, 0.12)',
        contrastText: '#fff',
    },
    accent: {
        main: '#1DB954',
        dark: '#00B33C',
        light: '#26CB5F',
    },
    fill: {
        main: 'rgba(255, 255, 255, 0.16)',
        dark: 'rgba(255, 255, 255, 0.12)',
        light: 'rgba(255, 255, 255)',
    },
    backdrop: {
        main: 'rgba(0, 0, 0, 0.65)',
        light: 'rgba(0, 0, 0,0.2)',
    },

    blur: {
        base: '96px',
        muted: '48px',
        faint: '24px',
    },
    fixed: {
        white: '#fff',
        black: '#000',
        strokeMutedWhite: 'rgba(255, 255, 255, 0.48)',
    },
    text: {
        primary: '#fff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        disabled: 'rgba(255, 255, 255, 0.5)',
    },

    danger: {
        main: '#EA3f3f',
    },
    stroke: {
        primary: '#ffffff',
        secondary: 'rgba(255,255,255,0.24)',
        disabled: 'rgba(255,255,255,0.16)',
    },
    background: {
        default: '#000000',
        paper: '#1b1b1b',
        overPaper: '#252525',
    },
    grey: {
        A100: '#ccc',
        A200: 'rgba(255, 255, 255, 0.24)',
        A400: '#434343',
        500: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(255, 255, 255, 0.16)',
};

export default darkThemePalette;
