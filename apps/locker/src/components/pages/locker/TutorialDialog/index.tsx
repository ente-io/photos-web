import DialogBoxV2 from '@/components/DialogBoxV2';
import EnteButton from '@/components/EnteButton';
import { Stepper, Step, StepLabel, Stack } from '@mui/material';
import { useState } from 'react';

interface IProps {
    open: boolean;
    onHide: () => void;
}

const TutorialDialog = (props: IProps) => {
    const steps = [
        {
            title: "What's locker?",
            text: 'Hey, welcome to Locker! For a long time now, ente has been all about photos, but we recognize you may have other files you want to keep backed up securely. Locker is just that, your personal locker for important documents. This is your Home collection where all your sub-collections and uncategorized files will live.',
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
            images: [
                '/images/tutorial/selected_file.svg',
                '/images/tutorial/selected_options.jpg',
            ],
        },
    ];

    const [activeStep, setActiveStep] = useState(0);

    return (
        <DialogBoxV2
            sx={{ zIndex: 1600 }}
            attributes={{
                title: `Locker Introduction`,
            }}
            open={props.open}
            onClose={props.onHide}
            dialogMaxWidth="40rem">
            <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((step) => (
                    <Step key={step.title}>
                        <StepLabel>{step.title}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Stack gap="1rem">
                {steps[activeStep].text && <p>{steps[activeStep].text}</p>}
                {steps[activeStep].images &&
                    steps[activeStep].images.map((image, index) => (
                        <img key={index} src={image} alt="" />
                    ))}
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
