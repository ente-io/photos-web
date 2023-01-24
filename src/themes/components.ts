import { Components } from '@mui/material/styles/components';

export const components: Components = {
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
                    backgroundColor: 'rgba(255,255,255,0.75)',
                },
            },
        },
    },
    MuiDialog: {
        styleOverrides: {
            root: {
                '.MuiBackdrop-root': {
                    backgroundColor: 'rgba(255,255,255,0.75)',
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
                padding: '12px 16px',
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
                switch (ownerState.color) {
                    case 'primary':
                        return {
                            color: '#000000',
                        };
                    case 'secondary':
                        return {
                            color: 'rgba(0,0,0,0.24)',
                        };
                    case 'disabled':
                        return {
                            color: 'rgba(0, 0, 0, 0.12)',
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
                            color: '#000000',
                        };
                    case 'secondary':
                        return {
                            color: 'rgba(0,0,0,0.24)',
                        };
                }
                if (ownerState.disabled) {
                    return {
                        color: 'rgba(0, 0, 0, 0.12)',
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
};
