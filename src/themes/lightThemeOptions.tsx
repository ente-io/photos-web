import { PaletteOptions } from '@mui/material/styles';

const lightThemePalette: PaletteOptions = {
    mode: 'light',
    primary: {
        main: '#000',
        contrastText: '#fff',
    },
    secondary: {
        main: 'rgba(0, 0, 0, 0.04)',
        contrastText: '#000',
    },
    accent: {
        main: '#1DB954',
        dark: '#00B33C',
        light: '#26CB5F',
    },
    fill: {
        main: 'rgba(0, 0, 0, 0.12)',
        dark: 'rgba(0, 0, 0, 0.04)',
        light: 'rgba(0, 0, 0)',
    },
    backdrop: {
        main: 'rgba(255, 255, 255, 0.75)',
        light: 'rgba(255, 255, 255, 0.3)',
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
        primary: '#000',
        secondary: 'rgba(0, 0, 0, 0.6)',
        disabled: 'rgba(0, 0, 0, 0.5)',
    },

    danger: {
        main: '#EA3f3f',
    },
    stroke: {
        primary: '#000000',
        secondary: 'rgba(0,0,0,0.24)',
        disabled: 'rgba(0,0,0,0.12)',
    },
    background: {
        default: '#ffffff',
        paper: '#ffffff',
        overPaper: ' rgba(153,153,153,0.04)',
    },
    grey: {
        A100: '#ccc',
        A200: 'rgba(255, 255, 255, 0.24)',
        A400: '#434343',
        500: 'rgba(255, 255, 255, 0.5)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
};

export default lightThemePalette;
