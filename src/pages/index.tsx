import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import constants from 'utils/strings/constants';
import Container, { CenteredContainer } from 'components/Container';
import { LS_KEYS, getData } from 'utils/storage/localStorage';
import { Button, Carousel } from 'react-bootstrap';
import { DeadCenter } from 'pages/gallery';
import englishConstants from 'utils/strings/englishConstants';
import styled from 'styled-components';
import { isFirstLogin } from 'utils/storage';

const HighlightedText = styled.span`
    color: #2dc262;
    font-weight: 900;
    font-size: 20px;
    margin-bottom: 20px;
`;

const BigButton = (props) => (
    <Button
        {...props}
        style={{
            padding: '15px 100px',
            marginTop: '20px',
            fontWeight: 900,
            color: '#ddd',
        }}
        block
    >
        {props.children}
    </Button>
);
export default function landing() {
    const router = useRouter();
    useEffect(() => {
        router.prefetch('/verify');
        const user = getData(LS_KEYS.USER);
        if (user?.email) {
            router.push('/verify');
        }
        router.prefetch('/login');
        if (!isFirstLogin()) {
            router.push('/login');
        }
    }, []);

    return (
        <Container>
            <CenteredContainer style={{ fontSize: '20px' }}>
                <div>{constants.LANDING_PAGE_PREFIX_MESSAGE()}</div>
                <Carousel style={{ width: '400px' }} controls={false}>
                    <Carousel.Item>
                        <DeadCenter>
                            <img
                                src="/protected.png"
                                alt="protected"
                                style={{
                                    width: '175px',
                                    height: '207px',
                                    marginBottom: '30px',
                                }}
                            />
                            <HighlightedText>
                                {englishConstants.PROTECTED}
                            </HighlightedText>
                            <span>{englishConstants.PROTECTED_MESSAGE()}</span>
                        </DeadCenter>
                    </Carousel.Item>
                    <Carousel.Item>
                        <DeadCenter>
                            <img
                                src="/synced.png"
                                alt="synced"
                                style={{
                                    width: '224px',
                                    height: '207px',
                                    marginBottom: '30px',
                                }}
                            />
                            <HighlightedText>
                                {englishConstants.SYNCED}
                            </HighlightedText>
                            <span>{englishConstants.SYNCED_MESSAGE()}</span>
                        </DeadCenter>
                    </Carousel.Item>
                    <Carousel.Item>
                        <DeadCenter>
                            <img
                                src="/preserved.png"
                                alt="preserved"
                                style={{
                                    width: '260px',
                                    height: '207px',
                                    marginBottom: '30px',
                                }}
                            />
                            <HighlightedText>
                                {englishConstants.PRESERVED}
                            </HighlightedText>
                            <span>{englishConstants.PRESERVED_MESSAGE()}</span>
                        </DeadCenter>
                    </Carousel.Item>
                </Carousel>

                <BigButton
                    variant="outline-success"
                    onClick={() => router.push('signup')}
                >
                    {constants.SIGN_UP}
                </BigButton>
                <BigButton
                    variant="outline-none"
                    onClick={() => router.push('login')}
                >
                    {constants.SIGN_IN}
                </BigButton>
            </CenteredContainer>
        </Container>
    );
}
