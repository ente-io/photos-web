import React from 'react';

export enum VARIANT_COLOR {
    PRIMARY = 'blue',
    SUCCESS = '#51cd7c',
    DANGER = '#c93f3f',
    SECONDARY = '#858585',
    WARNING = '#d7BB63',
    DEFAULT = '#d1d1d1',
}
export type LinkButtonProps = React.PropsWithChildren<{
    onClick: () => void;
    color?: VARIANT_COLOR;
    style?: React.CSSProperties;
}>;

export default function LinkButton(props: LinkButtonProps) {
    return (
        <h5
            style={{
                color: props.color ?? VARIANT_COLOR.DEFAULT,
                cursor: 'pointer',
                marginBottom: 0,
                ...props.style,
            }}
            onClick={props?.onClick ?? (() => null)}>
            {props.children}
        </h5>
    );
}
