import {
    offscreenCanvasSupported,
    runningInChrome,
    webglSupported,
} from 'utils/common';

import isElectron from 'is-electron';
import { addLogLine } from '@ente/shared/logging';

export function canEnableMlSearch(): boolean {
    // check if is chrome or ente desktop
    if (!runningInChrome() && !isElectron()) {
        addLogLine('Not running in Chrome Desktop or Ente Desktop App');
        return false;
    }

    if (!offscreenCanvasSupported()) {
        addLogLine('OffscreenCanvas is NOT supported');
        return false;
    }

    if (!webglSupported()) {
        addLogLine('webgl is NOT supported');
        return false;
    }

    return true;
}
