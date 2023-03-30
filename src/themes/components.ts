import { ThemeColorsOptions } from '@mui/material';
import { Components } from '@mui/material/styles/components';
import { TypographyOptions } from '@mui/material/styles/createTypography';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getComponents = (
    colors: ThemeColorsOptions,
    typography: TypographyOptions
): Components => ({
    MuiCssBaseline: {
        styleOverrides: {
            body: {
                fontFamily: typography.fontFamily,
                letterSpacing: '-0.011em',
            },
            strong: { fontWeight: 900 },
        },
    },

    MuiTypography: {
        defaultProps: {
            variant: 'body',
        },
    },

    MuiDrawer: {
        styleOverrides: {
            root: {
                '.MuiBackdrop-root': {
                    backgroundColor: colors.backdrop.faint,
                },
            },
        },
    },
    MuiDialog: {
        styleOverrides: {
            root: {
                '.MuiBackdrop-root': {
                    backgroundColor: colors.backdrop.faint,
                },
                '& .MuiDialog-paper': {
                    boxShadow: '0px 0px 10px 0px rgba(153,153,153,0.04)',
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
            color: colors.accent.A500,
            underline: 'none',
        },
        styleOverrides: {
            root: {
                '&:hover': {
                    underline: 'always',
                    color: colors.accent.A500,
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
                padding: '12px 16px',
                borderRadius: '4px',
                textTransform: 'none',
                fontWeight: 'bold',
                fontSize: typography.body.fontSize,
                lineHeight: typography.body.lineHeight,
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
                switch (ownerState.color) {
                    case 'primary':
                        return {
                            color: colors.stroke.base,
                        };
                    case 'secondary':
                        return {
                            color: colors.stroke.muted,
                        };
                }
                if (ownerState.disabled) {
                    return {
                        color: colors.stroke.faint,
                    };
                }
            },
        },
    },

    MuiIconButton: {
        styleOverrides: {
            root: ({ ownerState }) => {
                switch (ownerState.color) {
                    case 'primary':
                        return {
                            color: colors.stroke.base,
                        };
                    case 'secondary':
                        return {
                            color: colors.stroke.muted,
                        };
                }
                if (ownerState.disabled) {
                    return {
                        color: colors.stroke.faint,
                    };
                }
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
});