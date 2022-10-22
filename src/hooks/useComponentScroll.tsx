import { useRef, useState, useEffect } from 'react';

export enum SCROLL_DIRECTION {
    LEFT = -1,
    RIGHT = +1,
}

export default function useComponentScroll({
    dependencies,
}: {
    dependencies: any[];
}) {
    const componentRef = useRef<HTMLDivElement>(null);

    const [scrollObj, setScrollObj] = useState<{
        scrollLeft?: number;
        scrollWidth?: number;
        clientWidth?: number;
    }>({});

    const updateScrollObj = () => {
        if (!componentRef.current) {
            return;
        }
        const { scrollLeft, scrollWidth, clientWidth } = componentRef.current;
        setScrollObj({ scrollLeft, scrollWidth, clientWidth });
    };

    useEffect(() => {
        if (!componentRef.current) {
            return;
        }
        const refVariable = componentRef.current;
        // Add event listener
        refVariable?.addEventListener('scroll', updateScrollObj);

        // Call handler right away so state gets updated with initial window size
        updateScrollObj();
        // Remove event listener on cleanup
        return () =>
            refVariable?.removeEventListener('resize', updateScrollObj);
    }, []);

    useEffect(() => {
        updateScrollObj();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...dependencies]);

    const scrollComponent = (direction: SCROLL_DIRECTION) => () => {
        componentRef.current.scrollBy(250 * direction, 0);
    };

    const hasScrollBar = scrollObj.scrollWidth > scrollObj.clientWidth;
    const onFarLeft = scrollObj.scrollLeft === 0;
    const onFarRight =
        scrollObj.scrollLeft + scrollObj.clientWidth === scrollObj.scrollWidth;

    return {
        hasScrollBar,
        onFarLeft,
        onFarRight,
        scrollComponent,
        componentRef: componentRef,
    };
}
