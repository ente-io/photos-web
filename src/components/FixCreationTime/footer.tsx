import React from 'react';
import { FIX_STATE } from '.';
import constants from 'utils/strings/constants';
import { Button } from '@mui/material';

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
                    <Button
                        size={'large'}
                        color={'secondary'}
                        onClick={() => {
                            props.hide();
                        }}>
                        {constants.CANCEL}
                    </Button>
                )}
                {fixState === FIX_STATE.COMPLETED && (
                    <Button
                        size={'large'}
                        color={'secondary'}
                        onClick={props.hide}>
                        {constants.CLOSE}
                    </Button>
                )}
                {(fixState === FIX_STATE.NOT_STARTED ||
                    fixState === FIX_STATE.COMPLETED_WITH_ERRORS) && (
                    <>
                        <div style={{ width: '30px' }} />

                        <Button
                            size={'large'}
                            color="accent"
                            onClick={startFix}>
                            {constants.FIX_CREATION_TIME}
                        </Button>
                    </>
                )}
            </div>
        )
    );
}
