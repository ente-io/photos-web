import { Ref, useImperativeHandle, useRef, useState } from 'react';

export interface ImperativeDialog<S, T> {
    show: (attributes?: S) => Promise<T>;
}

export function useImperativeDialog<S, T>(ref: Ref<ImperativeDialog<S, T>>) {
    const [isOpen, setIsOpen] = useState(false);
    const [attributes, setAttributes] = useState<S>(null);
    const onClick = useRef<(value: T) => void>();

    useImperativeHandle(
        ref,
        () => ({
            show: (attributes: S) => {
                return new Promise((resolve) => {
                    onClick.current = resolve;
                    setAttributes(attributes);
                    setIsOpen(true);
                });
            },
        }),
        []
    );

    const onClickHandler = (value: T) => () => {
        onClick.current?.(value);
        setIsOpen(false);
    };

    const onClose = () => {
        onClick.current?.(null);
        setIsOpen(false);
    };

    return { isOpen, onClose, onClickHandler, attributes };
}
