import { PAGES } from 'constants/pages';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function Home() {
    const router = useRouter();
    useEffect(() => {
        router.push(PAGES.LOGIN);
    }, []);

    return <></>;
}
