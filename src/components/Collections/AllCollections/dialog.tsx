import { Dialog, Slide, styled } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

export const AllCollectionDialog = styled(Dialog)<{
    position: 'flex-start' | 'center' | 'flex-end';
}>(({ theme, position }) => ({
    '& .MuiDialog-container': {
        justifyContent: position,
    },
    '& .MuiPaper-root': {
        maxWidth: '494px',
    },
    '& .MuiDialogTitle-root': {
        padding: theme.spacing(2),
        paddingRight: theme.spacing(1),
    },
    '& .MuiDialogContent-root': {
        padding: theme.spacing(2),
    },
    [theme.breakpoints.down(559)]: {
        '& .MuiPaper-root': {
            width: '324px',
        },
        '& .MuiDialogContent-root': {
            padding: 6,
        },
    },
}));

AllCollectionDialog.propTypes = {
    children: PropTypes.node,
    onClose: PropTypes.func.isRequired,
};

export const Transition = (direction: 'left' | 'right' | 'up') =>
    React.forwardRef(
        (props: { children: React.ReactElement<any, any> }, ref) => {
            return <Slide direction={direction} ref={ref} {...props} />;
        }
    );
