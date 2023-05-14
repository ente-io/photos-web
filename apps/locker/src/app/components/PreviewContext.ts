import { SetStateAction, createContext, Dispatch } from 'react';

export const PreviewContext = createContext<{
    pageNumber: number;
    setPageNumber: Dispatch<SetStateAction<number>>;
    url: string;
    setUrl: Dispatch<SetStateAction<string>>;
}>({
    pageNumber: 1,
    setPageNumber: (value: SetStateAction<number>) => {},
    url: '',
    setUrl: (value: SetStateAction<string>) => {},
});
