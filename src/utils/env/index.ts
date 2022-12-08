import { PRODUCTION_ENDPOINTS } from 'constants/endpoint';
import { ENDPOINT } from 'types/endpoint';
import { getEndpointEnvOverrideKey } from 'utils/endpoint';

export function addDefaultENVFallbacks() {
    const defaultENVEntries = getDefaultENVEntries();
    for (const [key, defaultValue] of defaultENVEntries) {
        if (!process.env[key]) {
            process.env[key] = defaultValue;
        }
    }
}

const getDefaultENVEntries = () =>
    Object.entries({
        ...Object.fromEntries(
            (
                Object.entries(PRODUCTION_ENDPOINTS) as Array<
                    [ENDPOINT, string]
                >
            ).map(([key, value]) => [getEndpointEnvOverrideKey(key), value])
        ),
    });
