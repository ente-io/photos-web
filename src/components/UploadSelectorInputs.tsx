import React from 'react';

export default function UploadSelectorInputs({
    getFileSelectorInputProps,
    getFolderSelectorInputProps,
}) {
    return (
        <>
            <input {...getFileSelectorInputProps()} />
            <input {...getFolderSelectorInputProps()} />
        </>
    );
}
