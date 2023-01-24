import { TypographyOptions } from '@mui/material/styles/createTypography';

export const typography: TypographyOptions = {
    body1: {
        fontSize: '16px',
        lineHeight: '20px',
    },
    body2: {
        fontSize: '14px',
        lineHeight: '17px',
    },
    mini: {
        fontSize: '10px',
        lineHeight: '12px',
    },
    button: {
        fontSize: '16px',
        lineHeight: '20px',
        fontWeight: 'bold',
        textTransform: 'none',
    },
    title: {
        fontSize: '32px',
        lineHeight: '40px',
        fontWeight: 'bold',
        display: 'block',
    },
    subtitle: {
        fontSize: '24px',
        fontWeight: 'bold',
        lineHeight: '36px',
        display: 'block',
    },
    caption: {
        display: 'block',
        fontSize: '12px',
        lineHeight: '15px',
    },
    h1: {
        fontSize: '48px',
        lineHeight: '58px',
    },
    h2: {
        fontSize: '36px',
        lineHeight: '44px',
    },
    h3: {
        fontSize: '24px',
        lineHeight: '29px',
    },
    h4: {
        fontSize: '18px',
        lineHeight: '22px',
    },

    fontFamily: ['Inter', 'sans-serif'].join(','),
};
