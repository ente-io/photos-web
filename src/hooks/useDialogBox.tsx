import { useMemo, useState } from 'react';
import { DialogBoxAttributesV2 } from 'types/dialogBox';

export default function useDialogBox() {
    const [dialogBoxAttributes, setDialogBoxAttributes] =
        useState<DialogBoxAttributesV2>();

    const showDialogBox = useMemo(
        () => (dialogBoxAttributes: DialogBoxAttributesV2) =>
            new Promise<number>((resolve) =>
                setDialogBoxAttributes(
                    constructPromisifiedDialogBoxAttributes(
                        dialogBoxAttributes,
                        resolve
                    )
                )
            ),
        []
    );

    return {
        showDialogBox,
        dialogBoxView: !!dialogBoxAttributes,
        closeDialogBox: () => setDialogBoxAttributes(undefined),
        dialogBoxAttributes,
    };
}

function constructPromisifiedDialogBoxAttributes(
    dialogBoxAttributes: DialogBoxAttributesV2,
    resolve: (value: number | PromiseLike<number>) => void
): DialogBoxAttributesV2 {
    return {
        ...dialogBoxAttributes,
        buttons: dialogBoxAttributes.buttons.map((button, index) => ({
            ...button,
            onClick: async () => {
                await button.onClick?.();
                resolve(index);
            },
        })),
    };
}
