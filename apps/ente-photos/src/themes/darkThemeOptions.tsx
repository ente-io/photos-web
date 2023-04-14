import {
    createTheme,
    PaletteColor,
    PaletteColorOptions,
} from '@mui/material/styles';

declare module '@mui/material/styles' {
    interface TypeBackground {
        overPaper?: string;
    }

    interface ColorStrength {
        base: string;
        muted: string;
        faint: string;
        fainter: string;
    }
    interface ColorStrengthOptions {
        base?: string;
        muted?: string;
        faint?: string;
        fainter?: string;
    }

    interface FixedColor {
        white: string;
        black: string;
        strokeMutedWhite: string;
    }

    interface Palette {
        accent: PaletteColor;
        fill: PaletteColor;
        backdrop: PaletteColor;
        blur: ColorStrength;
        danger: PaletteColor;
        caution: PaletteColor;
        stroke: ColorStrength;
        fixed: FixedColor;
    }
    interface PaletteOptions {
        accent?: PaletteColorOptions;
        danger?: PaletteColorOptions;
        caution?: PaletteColorOptions;
        fill?: PaletteColorOptions;
        backdrop?: PaletteColorOptions;
        blur?: ColorStrengthOptions;
        stroke?: ColorStrengthOptions;
        fixed?: Partial<FixedColor>;
    }

    interface TypographyVariants {
        title: React.CSSProperties;
        subtitle: React.CSSProperties;
        mini: React.CSSProperties;
    }

    interface TypographyVariantsOptions {
        title?: React.CSSProperties;
        subtitle?: React.CSSProperties;
        mini?: React.CSSProperties;
    }
}

declare module '@mui/material/Button' {
    export interface ButtonPropsColorOverrides {
        accent: true;
        danger: true;
    }
}
declare module '@mui/material/Checkbox' {
    export interface CheckboxPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        title: true;
        subtitle: true;
    }
}

declare module '@mui/material/Switch' {
    interface SwitchPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/SvgIcon' {
    interface SvgIconPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/Alert' {
    export interface AlertPropsColorOverrides {
        accent: true;
    }
}

declare module '@mui/material/CircularProgress' {
    export interface CircularProgressPropsColorOverrides {
        accent: true;
    }
}

// Create a theme instance.
const darkThemeOptions = createTheme({
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    fontFamily: ['Inter', 'sans-serif'].join(','),
                    letterSpacing: '-0.011em',
                },
                strong: { fontWeight: 900 },
            },
        },

        MuiDrawer: {
            styleOverrides: {
                root: {
                    '.MuiBackdrop-root': {
                        backgroundColor: 'rgba(0,0,0,0.65)',
                    },
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                root: {
                    '.MuiBackdrop-root': {
                        backgroundColor: 'rgba(0,0,0,0.65)',
                    },
                    '& .MuiDialog-paper': {
                        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.25)',
                    },
                    '& .MuiDialogTitle-root': {
                        padding: '16px',
                    },
                    '& .MuiDialogContent-root': {
                        padding: '16px',
                        overflowY: 'overlay',
                    },
                    '& .MuiDialogActions-root': {
                        padding: '16px',
                    },
                    '.MuiDialogTitle-root + .MuiDialogContent-root': {
                        paddingTop: '16px',
                    },
                },
            },
            defaultProps: {
                fullWidth: true,
                maxWidth: 'sm',
            },
        },
        MuiPaper: {
            styleOverrides: { root: { backgroundImage: 'none' } },
        },
        MuiLink: {
            defaultProps: {
                color: '#1db954',
                underline: 'none',
            },
            styleOverrides: {
                root: {
                    '&:hover': {
                        underline: 'always',
                        color: '#1db954',
                    },
                },
            },
        },

        MuiButton: {
            defaultProps: {
                variant: 'contained',
            },
            styleOverrides: {
                root: {
                    padding: '14px 16px',
                    borderRadius: '4px',
                },
                startIcon: {
                    marginRight: '12px',
                    '&& >svg': {
                        fontSize: '20px',
                    },
                },
                endIcon: {
                    marginLeft: '12px',
                    '&& >svg': {
                        fontSize: '20px',
                    },
                },
                sizeLarge: {
                    width: '100%',
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                formControl: {
                    borderRadius: '8px',
                    '::before': {
                        borderBottom: 'none !important',
                    },
                },
            },
        },
        MuiFilledInput: {
            styleOverrides: {
                input: {
                    '&:autofill': {
                        boxShadow: '#c7fd4f',
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled',
                margin: 'dense',
            },
            styleOverrides: {
                root: {
                    '& .MuiInputAdornment-root': {
                        marginRight: '8px',
                    },
                },
            },
        },
        MuiSvgIcon: {
            styleOverrides: {
                root: ({ ownerState }) => {
                    return { ...setColor(ownerState) };
                },
            },
        },

        MuiIconButton: {
            styleOverrides: {
                root: ({ ownerState }) => {
                    return { ...setColor(ownerState), padding: '12px' };
                },
            },
        },
        MuiSnackbar: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                },
            },
        },
    },

    palette: {
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
            main: 'rgba(255, 255, 255, 0.75)',
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
        caution: {
            main: '#FFC247',
        },
        stroke: {
            base: '#ffffff',
            muted: 'rgba(255,255,255,0.24)',
            faint: 'rgba(255,255,255,0.16)',
            fainter: 'rgba(255,255,255,0.08)',
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
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
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
    },
});

export default darkThemeOptions;
function setColor(ownerState) {
    switch (ownerState.color) {
        case 'primary':
            return {
                color: '#ffffff',
            };
        case 'secondary':
            return {
                color: 'rgba(255,255,255,0.24)',
            };
        case 'disabled':
            return {
                color: 'rgba(255, 255, 255, 0.16)',
            };
    }
}
