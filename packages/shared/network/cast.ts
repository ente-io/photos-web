import { logError } from '../sentry';
import { getToken } from '../storage/localStorage/helpers';
import HTTPService from './HTTPService';
import { getEndpoint } from './api';

class CastGateway {
    constructor() {}

    public async getCastData(code: string): Promise<string> {
        let resp;
        try {
            resp = await HTTPService.get(
                `${getEndpoint()}/cast/cast-data/${code}`
            );
        } catch (e) {
            logError(e, 'failed to getCastData');
            throw e;
        }
        return resp.data.encPayload;
    }

    public async getPublicKey(code: string): Promise<string> {
        let resp;
        try {
            const token = getToken();
            resp = await HTTPService.get(
                `${getEndpoint()}/cast/device-info/${code}`,
                undefined,
                {
                    'X-Auth-Token': token,
                }
            );
        } catch (e) {
            logError(e, 'failed to getPublicKey');
            throw e;
        }
        return resp.data.publicKey;
    }

    public async registerDevice(code: string, publicKey: string) {
        await HTTPService.put(getEndpoint() + '/cast/device-info/', {
            deviceCode: `${code}`,
            publicKey: publicKey,
        });
    }

    public async publishCastPayload(
        code: string,
        castPayload: string,
        collectionID: number,
        castToken: string
    ) {
        const token = getToken();
        await HTTPService.post(
            getEndpoint() + '/cast/cast-data/',
            {
                deviceCode: `${code}`,
                encPayload: castPayload,
                collectionID: collectionID,
                castToken: castToken,
            },
            undefined,
            { 'X-Auth-Token': token }
        );
    }
}

export default new CastGateway();