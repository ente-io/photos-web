import { Ref, useImperativeHandle, useRef, useState } from 'react';
import { CustomError } from 'utils/error';

export interface ImperativeDialog<S, T> {
    show: (attributes?: S) => Promise<T>;
}

export function useImperativeDialog<S, T>(ref: Ref<ImperativeDialog<S, T>>) {
    const [isOpen, setIsOpen] = useState(false);
    const [attributes, setAttributes] = useState<S>(null);
    const onOptionClick = useRef<(value: T) => void>();
    const onCloseClick = useRef<() => void>();

    useImperativeHandle(
        ref,
        () => ({
            show: (attributes: S) => {
                return new Promise((resolve, reject) => {
                    onOptionClick.current = resolve;
                    onCloseClick.current = () =>
                        reject(Error(CustomError.REQUEST_CANCELLED));
                    setAttributes(attributes);
                    setIsOpen(true);
                });
            },
        }),
        []
    );

    const onClickHandler = (value: T) => () => {
        onOptionClick.current?.(value);
        setIsOpen(false);
    };

    const onClose = () => {
        onCloseClick.current?.();
        setIsOpen(false);
    };

    return { isOpen, onClose, onClickHandler, attributes };
}
