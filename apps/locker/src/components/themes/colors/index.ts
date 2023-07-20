import { ThemeColorsOptions } from '@mui/material';
import darkThemeColors from './dark';
// import lightThemeColors from './light';
import { getFixesColors } from './fixed';

export const getColors = (
    // themeColor: string,
    appName: string
): ThemeColorsOptions => {
    return { ...getFixesColors(appName), ...darkThemeColors };
};
