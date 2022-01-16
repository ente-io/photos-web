import React, { useContext, useEffect, useState } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import Button from 'react-bootstrap/Button';
import styled from 'styled-components';
import { AppContext } from './_app';
import Login from 'components/Login';
import { useRouter } from 'next/router';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import EnteSpinner from 'components/EnteSpinner';
import SignUp from 'components/SignUp';
import constants from 'utils/strings/constants';
import localForage from 'utils/storage/localForage';
import IncognitoWarning from 'components/IncognitoWarning';
import { logError } from 'utils/sentry';
import { PAGES } from 'constants/pages';

const Container = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: #000;

    @media (max-width: 1024px) {
        flex-direction: column;
    }
`;

const SlideContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;

    @media (max-width: 1024px) {
        flex-grow: 0;
    }
`;

const DesktopBox = styled.div`
    flex: 1;
    height: 100%;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #242424;

    @media (max-width: 1024px) {
        display: none;
    }
`;

const MobileBox = styled.div`
    display: none;

    @media (max-width: 1024px) {
        display: flex;
        flex-direction: column;
        padding: 40px 10px;
    }
`;

const SideBox = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 320px;
`;

const TextContainer = styled.div`
    padding: 20px;
    max-width: 300px;
    margin: 0 auto;
`;

const UpperText = styled(TextContainer)`
    font-size: 24px;
    max-width: 100%;
    margin-bottom: 20px;
`;

const FeatureText = styled.div`
    color: #51cd7c;
    font-weight: bold;
    padding-top: 20px;
    font-size: 24px;
`;

const Img = styled.img`
    height: 250px;
    object-fit: contain;

    @media (max-width: 400px) {
        height: 180px;
    }
`;

export default function LandingPage() {
    const router = useRouter();
    const appContext = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(true);
    const [blockUsage, setBlockUsage] = useState(false);
    useEffect(() => {
        const main = async () => {
            const user = getData(LS_KEYS.USER);
            if (user?.email) {
                await router.push(PAGES.VERIFY);
            }
            try {
                await localForage.ready();
            } catch (e) {
                logError(e, 'usage in incognito mode tried');
                setBlockUsage(true);
            }
            setLoading(false);
        };
        main();
        appContext.showNavBar(false);
    }, []);

    const signUp = () => setShowLogin(false);
    const login = () => setShowLogin(true);

    return (
        <Container>
            {loading ? (
                <EnteSpinner />
            ) : (
                <>
                    <SlideContainer>
                        <UpperText>{constants.HERO_HEADER()}</UpperText>
                        <Carousel controls={false}>
                            <Carousel.Item>
                                <Img src="/images/slide-1.png" />
                                <FeatureText>
                                    {constants.HERO_SLIDE_1_TITLE}
                                </FeatureText>
                                <TextContainer>
                                    {constants.HERO_SLIDE_1}
                                </TextContainer>
                            </Carousel.Item>
                            <Carousel.Item>
                                <Img src="/images/slide-2.png" />
                                <FeatureText>
                                    {constants.HERO_SLIDE_2_TITLE}
                                </FeatureText>
                                <TextContainer>
                                    {constants.HERO_SLIDE_2}
                                </TextContainer>
                            </Carousel.Item>
                            <Carousel.Item>
                                <Img src="/images/slide-3.png" />
                                <FeatureText>
                                    {constants.HERO_SLIDE_3_TITLE}
                                </FeatureText>
                                <TextContainer>
                                    {constants.HERO_SLIDE_3}
                                </TextContainer>
                            </Carousel.Item>
                        </Carousel>
                    </SlideContainer>
                    <MobileBox>
                        <Button
                            variant="outline-success"
                            size="lg"
                            style={{ padding: '10px 50px' }}
                            onClick={() => router.push(PAGES.SIGNUP)}>
                            {constants.SIGN_UP}
                        </Button>
                        <br />
                        <Button
                            variant="link"
                            size="lg"
                            style={{ color: '#fff', padding: '10px 50px' }}
                            onClick={() => router.push(PAGES.LOGIN)}>
                            {constants.LOGIN}
                        </Button>
                    </MobileBox>
                    <DesktopBox>
                        <SideBox>
                            {showLogin ? (
                                <Login signUp={signUp} />
                            ) : (
                                <SignUp login={login} />
                            )}
                        </SideBox>
                    </DesktopBox>
                    {blockUsage && <IncognitoWarning />}
                </>
            )}
        </Container>
    );
}
