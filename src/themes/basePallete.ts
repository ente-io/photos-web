import { EnteBasePaletteOptions } from '@mui/material/styles';

// Create a theme instance.
const basePalette: EnteBasePaletteOptions = {
    primary: {
        700: '#00B33C',
        500: '#1DB954',
        400: '#26CB5F',
        300: '#01DE4D',
    },
    warning: {
        800: '#F53434',
        700: '#EA3F3F',
        500: '#FF6565',
        400: '#FF6F6F',
    },
    caution: {
        500: '#FFC247',
    },
    blur: {
        base: 96,
        muted: 48,
        faint: 24,
    },

    white: { base: '#fff', muted: 'rgba(255, 255, 255, 0.48)' },
    black: '#000',
};

export default basePalette;
