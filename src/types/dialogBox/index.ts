import { EnteButtonProps } from 'components/EnteButton';

export interface DialogBoxAttributes {
    icon?: React.ReactNode;
    title?: string;
    staticBackdrop?: boolean;
    nonClosable?: boolean;
    content?: any;
    close?: {
        text?: string;
        variant?: EnteButtonProps['variant'];
        action?: () => void;
    };
    proceed?: {
        text: string;
        action: () => void;
        variant: EnteButtonProps['variant'];
        disabled?: boolean;
    };
}

export type SetDialogBoxAttributes = React.Dispatch<
    React.SetStateAction<DialogBoxAttributes>
>;
