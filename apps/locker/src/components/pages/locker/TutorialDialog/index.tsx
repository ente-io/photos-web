import DialogBoxV2 from '@/components/DialogBoxV2';
import EnteButton from '@/components/EnteButton';
import { Stepper, Step, StepLabel, Stack, Dialog } from '@mui/material';
import { useState } from 'react';

interface IProps {
    open: boolean;
    onHide: () => void;
}

const TutorialDialog = (props: IProps) => {
    const steps = [
        {
            title: "What's locker?",
            text: 'Locker serves as your personal document storage, providing a safe place for important files. This Home collection is where all your sub-collections and uncategorized files will be stored.',
            images: ['/images/tutorial/city.png'],
        },
        {
            title: 'Collections',
            text: 'Collections can house files, just like your Home collection. Double-click them to view their contents or click once to perform actions, like renaming, deleting and more.',
            images: ['/images/tutorial/collections.svg'],
        },
        {
            title: 'Files',
            text: 'Files can be selected by clicking on their checkboxes, revealing a list of options, like renaming, moving and more.',
            images: ['/images/tutorial/selected_file.svg'],
        },
    ];

    const [activeStep, setActiveStep] = useState(0);

    return (
        <DialogBoxV2
            disablePortal
            open={props.open}
            onClose={props.onHide}
            sx={{ zIndex: 1600 }}
            dialogMaxWidth="30rem"
            attributes={{
                title: `Locker Introduction`,
            }}>
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((step) => (
                    <Step key={step.title}>
                        <StepLabel>{step.title}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Stack gap="1rem" alignItems="space-between" height="100%">
                <div
                    style={{
                        height: '8rem',
                    }}>
                    {steps[activeStep].text && <p>{steps[activeStep].text}</p>}
                </div>
                <div
                    style={{
                        height: '10rem',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                    {steps[activeStep].images &&
                        steps[activeStep].images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt=""
                                style={{
                                    height: '100%',
                                    width: '100%',
                                    objectFit: 'contain',
                                }}
                            />
                        ))}
                </div>
                <EnteButton
                    onClick={() => {
                        if (activeStep === steps.length - 1) {
                            props.onHide();
                        } else {
                            setActiveStep((prev) => prev + 1);
                        }
                    }}>
                    {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </EnteButton>
            </Stack>
        </DialogBoxV2>
    );
};

export default TutorialDialog;
