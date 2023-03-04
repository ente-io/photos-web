// import { ButtonProps } from '@mui/material';
import { DialogBoxAttributes, SetDialogBoxAttributes } from 'types/dialogBox';

// type MessageTypes = 'none' | 'info' | 'error' | 'question' | 'warning';

// interface MessageBoxButton {
//     label: string;
//     color: ButtonProps['color'];
//     onClick: () => void;
// }

// // On Windows, "question" displays the same icon as "info",
// // unless you set an icon using the "icon" option.
// // On macOS, both "warning" and "error" display the same warning icon.

// export interface MessageBoxOptions {
//     message: string;
//     type: MessageTypes;
//     buttons: [MessageBoxButton, MessageBoxButton, MessageBoxButton];
//     defaultId?: number;
//     title?: string;
//     detail?: string;
//     icon?: string;
//     textWidth?: number; // MacOS only - Custom width of the text in the message box
//     cancelID?: number;
//     noLink?: boolean;
// }

class MessageBox {
    private setDialogBoxAttributes: SetDialogBoxAttributes;
    private onClickHandler: (index: number) => void;

    constructor(setMessageAttributes: SetDialogBoxAttributes) {
        this.setDialogBoxAttributes = setMessageAttributes;
    }

    public show(attributes: DialogBoxAttributes): Promise<number> {
        this.openDialog(attributes);
        return new Promise((resolve) => {
            this.onClickHandler = (index: number) => {
                resolve(index);
            };
        });
    }

    private openDialog(attributes: DialogBoxAttributes) {
        const proxiedAttributes = this.constructDialogBoxAttributes(attributes);
        this.setDialogBoxAttributes(proxiedAttributes);
    }

    private constructDialogBoxAttributes(
        attributes: DialogBoxAttributes
    ): DialogBoxAttributes {
        return {
            ...attributes,
            close: {
                ...attributes.close,
                action: () => {
                    attributes.close?.action?.();
                    this.onClickHandler(0);
                },
            },
            proceed: {
                ...attributes.proceed,
                action: () => {
                    attributes.proceed?.action?.();
                    this.onClickHandler(1);
                },
            },
            secondary: {
                ...attributes.secondary,
                action: () => {
                    attributes.secondary?.action?.();
                    this.onClickHandler(2);
                },
            },
        };
    }
}

export default MessageBox;
