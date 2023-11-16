import { useEffect, useState } from 'react';

const colourPool = [
    '#87CEFA', // Light Blue
    '#90EE90', // Light Green
    '#F08080', // Light Coral
    '#FFFFE0', // Light Yellow
    '#FFB6C1', // Light Pink
    '#E0FFFF', // Light Cyan
    '#FAFAD2', // Light Goldenrod
    '#87CEFA', // Light Sky Blue
    '#D3D3D3', // Light Gray
    '#B0C4DE', // Light Steel Blue
    '#FFA07A', // Light Salmon
    '#20B2AA', // Light Sea Green
    '#778899', // Light Slate Gray
    '#AFEEEE', // Light Turquoise
    '#7A58C1', // Light Violet
    '#FFA500', // Light Orange
    '#A0522D', // Light Brown
    '#9370DB', // Light Purple
    '#008080', // Light Teal
    '#808000', // Light Olive
];

export default function PairingMode() {
    // Function to generate cryptographically secure data
    const generateSecureData = (length: number): Uint8Array => {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        // Modulo operation to ensure each byte is a single hex digit
        for (let i = 0; i < length; i++) {
            array[i] = array[i] % 16;
        }
        return array;
    };

    const convertDataToHex = (data: Uint8Array): string => {
        let hex = '';
        for (let i = 0; i < data.length; i++) {
            hex += data[i].toString(16).padStart(2, '0');
        }
        return hex;
    };

    const [digits, setDigits] = useState<string[]>([]);

    useEffect(() => {
        const data = generateSecureData(4);
        setDigits(convertDataToHex(data).split(''));
    }, []);

    return (
        <>
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                <div
                    style={{
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                    <img width={150} src="/images/ente.svg" />
                    <h1
                        style={{
                            fontWeight: 'normal',
                        }}>
                        Enter this code on <b>ente</b> to pair this TV
                    </h1>
                    <table
                        style={{
                            fontSize: '4rem',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            display: 'flex',
                        }}>
                        {digits.map((digit, i) => (
                            <tr
                                key={i}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '0.5rem',
                                    // alternating background
                                    backgroundColor:
                                        i % 2 === 0 ? '#2e2e2e' : '#5e5e5e',
                                }}>
                                <span
                                    style={{
                                        color: colourPool[
                                            i % colourPool.length
                                        ],
                                    }}>
                                    {digit}
                                </span>
                                <span
                                    style={{
                                        fontSize: '1rem',
                                    }}>
                                    {i + 1}
                                </span>
                            </tr>
                        ))}
                    </table>
                    <p
                        style={{
                            fontSize: '1.2rem',
                        }}>
                        Visit{' '}
                        <span
                            style={{
                                color: '#87CEFA',
                                fontWeight: 'bold',
                            }}>
                            ente.io/cast
                        </span>{' '}
                        for help
                    </p>
                </div>
            </div>
        </>
    );
}