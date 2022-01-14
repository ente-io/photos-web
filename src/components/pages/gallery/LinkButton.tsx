import React from 'react';
import { Variant } from 'react-bootstrap/esm/types';

export enum VARIANT_COLOR {
    SUCCESS = '#51cd7c',
    DANGER = '#c93f3f',
    SECONDARY = '#858585',
    WARNING = '#d7BB63',
    DEFAULT = '#d1d1d1',
}
export type LinkButtonProps = React.PropsWithChildren<{
    onClick: () => void;
    variant?: Variant;
    style?: React.CSSProperties;
}>;

export default function LinkButton(props: LinkButtonProps) {
    return (
        <h5
            style={{
                color: VARIANT_COLOR[props.variant],
                cursor: 'pointer',
                marginBottom: 0,
                ...props.style,
            }}
            onClick={props?.onClick ?? (() => null)}>
            {props.children}
        </h5>
    );
}
