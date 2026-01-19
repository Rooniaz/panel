import axios from 'axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import React, { useRef, useState } from 'react';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import { WithClassname } from '@/components/types';
import { PhotographIcon } from '@heroicons/react/outline';
import Spinner from '@/components/elements/Spinner';
import { useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';

export default ({ className }: WithClassname) => {
    const iconUploadInput = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { mutate } = useFileManagerSwr();
    const { addError, clearAndAddHttpError } = useFlashKey('files');
    const addFlash = useStoreActions((actions: any) => actions.flashes.addFlash);

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    // Function to add a success message with the correct color
    const addSuccess = (message: string, title: string = 'Success') => {
        addFlash({ key: 'files', message, title, type: 'success' });
    };

    const processAndUploadIcon = async (file: File) => {
        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Set canvas size to 64x64 (Minecraft server icon size)
        canvas.width = 64;
        canvas.height = 64;

        // Create an image element to load the file
        const img = new Image();
        
        // Wait for the image to load
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });

        // Clear the canvas with a transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate scaling while preserving aspect ratio
        let width = img.width;
        let height = img.height;
        let offsetX = 0;
        let offsetY = 0;
        
        // Calculate the scaling factor to fit the image within 64x64
        const scaleFactor = Math.min(64 / width, 64 / height);
        
        // Calculate new dimensions
        width = width * scaleFactor;
        height = height * scaleFactor;
        
        // Center the image on the canvas
        offsetX = (64 - width) / 2;
        offsetY = (64 - height) / 2;
        
        // Draw the image on the canvas with proper scaling and centering
        ctx.drawImage(img, offsetX, offsetY, width, height);

        // Convert the canvas to a Blob
        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        // Create a new File object with the correct name
        const processedFile = new File([blob], 'server-icon.png', { type: 'image/png' });

        // Get the upload URL and upload the processed file
        const url = await getFileUploadUrl(uuid);
        await axios.post(
            url,
            { files: processedFile },
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                params: { directory: '/' }, // Always upload to root directory
            }
        );
    };

    const onIconSubmission = (files: FileList) => {
        clearAndAddHttpError();
        setIsLoading(true);
        
        if (files.length !== 1) {
            setIsLoading(false);
            return addError('Please select only one image file.', 'Error');
        }
        
        const file = files[0];
        
        // Check if the file is an image
        if (!file.type.startsWith('image/')) {
            setIsLoading(false);
            return addError('The selected file is not an image.', 'Error');
        }
        
        // Process and upload the icon
        processAndUploadIcon(file)
            .then(() => {
                addSuccess('Server icon has been updated successfully.');
                mutate();
                setIsLoading(false);
            })
            .catch((error) => {
                setIsLoading(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <>
            <input
                type={'file'}
                ref={iconUploadInput}
                css={tw`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;

                    onIconSubmission(e.currentTarget.files);
                    if (iconUploadInput.current) {
                        iconUploadInput.current.files = null;
                    }
                }}
                accept="image/*"
            />
            <Button 
                className={className} 
                onClick={() => iconUploadInput.current && iconUploadInput.current.click()}
                title="Upload a server icon (64x64 PNG)"
                disabled={isLoading}
            >
                <div css={tw`flex items-center`}>
                    {isLoading ? 
                        <Spinner size="small" css={tw`mr-2`} /> : 
                        <PhotographIcon css={tw`w-4 h-4 mr-2`} />
                    }
                    Set Icon
                </div>
            </Button>
        </>
    );
};
