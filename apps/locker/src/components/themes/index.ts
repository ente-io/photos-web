import { createTheme } from '@mui/material';
import { getColors } from './colors';
import { getComponents } from './components';
import { getPallette } from './palette';
import { typography } from './typography';

export const getTheme = (themeColor: string) => {
    const colors = getColors(themeColor);
    const palette = getPallette(themeColor, colors);
    const components = getComponents(colors, typography);
    const theme = createTheme({
        colors,
        palette,
        typography,
        components,
        shape: {
            borderRadius: 8,
        },
    });
    return theme;
};
