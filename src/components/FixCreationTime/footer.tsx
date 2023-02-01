import React from 'react';
import { FIX_STATE } from '.';
import constants from 'utils/strings/constants';
import EnteButton from 'components/EnteButton';

export default function FixCreationTimeFooter({
    fixState,
    startFix,
    ...props
}) {
    return (
        fixState !== FIX_STATE.RUNNING && (
            <div
                style={{
                    width: '100%',
                    display: 'flex',
                    marginTop: '30px',
                    justifyContent: 'space-around',
                }}>
                {(fixState === FIX_STATE.NOT_STARTED ||
                    fixState === FIX_STATE.COMPLETED_WITH_ERRORS) && (
                    <EnteButton
                        variant={'secondary'}
                        onClick={() => {
                            props.hide();
                        }}>
                        {constants.CANCEL}
                    </EnteButton>
                )}
                {fixState === FIX_STATE.COMPLETED && (
                    <EnteButton variant={'secondary'} onClick={props.hide}>
                        {constants.CLOSE}
                    </EnteButton>
                )}
                {(fixState === FIX_STATE.NOT_STARTED ||
                    fixState === FIX_STATE.COMPLETED_WITH_ERRORS) && (
                    <>
                        <div style={{ width: '30px' }} />

                        <EnteButton variant={'neutral'} onClick={startFix}>
                            {constants.FIX_CREATION_TIME}
                        </EnteButton>
                    </>
                )}
            </div>
        )
    );
}
