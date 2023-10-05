import { FixedColors, ThemeColorsOptions } from '@mui/material';

const lockerAccentColor = {
    A700: '#03045eff',
    A500: '#0077b6ff',
    A400: '#00b4d8ff',
    A300: '#48cae4ff',
};

export const getFixesColors = (
    appName: string
): Pick<ThemeColorsOptions, keyof FixedColors> => {
    return {
        ...commonFixedColors,
        accent: lockerAccentColor,
    };
};

const commonFixedColors: Partial<Pick<ThemeColorsOptions, keyof FixedColors>> =
    {
        accent: lockerAccentColor,
        warning: {
            A500: '#FFC247',
        },
        danger: {
            A800: '#F53434',
            A700: '#EA3F3F',
            A500: '#FF6565',
            A400: '#FF6F6F',
        },
        blur: {
            base: 96,
            muted: 48,
            faint: 24,
        },

        white: { base: '#fff', muted: 'rgba(255, 255, 255, 0.48)' },
        black: { base: '#000', muted: 'rgba(0, 0, 0, 0.65)' },
    };
