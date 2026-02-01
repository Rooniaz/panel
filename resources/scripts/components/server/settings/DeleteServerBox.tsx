import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import http from '@/api/http';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';
import { useHistory } from 'react-router-dom';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);
    const history = useHistory();

    const handleDelete = () => {
        console.log('[DeleteServer] Starting deletion...');
        console.log('[DeleteServer] UUID:', uuid);
        console.log('[DeleteServer] Calling Spring Boot API directly (same as CREATE flow)');

        setIsDeleting(true);
        clearFlashes('settings');

        // ✅ อ่าน JWT token จาก localStorage
        const token = localStorage.getItem('auth_token');

        if (!token) {
            console.error('[DeleteServer] ❌ JWT token not found in localStorage!');
            setIsDeleting(false);
            addFlash({
                key: 'settings',
                type: 'error',
                message: 'Authentication token not found. Please login again.',
            });
            return;
        }

        console.log('[DeleteServer] Token found:', token.substring(0, 20) + '...');

        // ✅ เรียก Spring Boot โดยตรง (เหมือน CREATE server flow)
        http.delete(`/api/servers/${uuid}`, {
            baseURL: 'http://localhost:9000', // Spring Boot API
            withCredentials: true, // ส่ง cookies
            headers: {
                Authorization: `Bearer ${token}`, // ✅ ส่ง JWT token ใน Authorization header
            },
        })
            .then((response) => {
                console.log('[DeleteServer] Spring Boot response:', response.data);
                console.log('[DeleteServer] ✅ Server deleted successfully!');

                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Server has been deleted successfully from both Panel and Spring Boot.',
                });

                // ✅ Redirect และ refresh dashboard เพื่อไม่ให้แสดง server ที่ถูกลบแล้ว
                setTimeout(() => {
                    // Redirect to dashboard และ force reload เพื่อ refresh server list
                    window.location.href = '/';
                }, 500);
            })
            .catch((error) => {
                console.error('[DeleteServer] ❌ Deletion failed:', error);
                console.error('[DeleteServer] Error details:', {
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    message: error.response?.data?.message || error.message,
                });

                setIsDeleting(false);

                // Extract error message
                const errorMessage =
                    error.response?.data?.message || error.response?.data?.error || httpErrorToHuman(error);

                addFlash({
                    key: 'settings',
                    type: 'error',
                    message: errorMessage,
                });
            })
            .finally(() => {
                setModalVisible(false);
            });
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    return (
        <TitledGreyBox title={'Delete Server'} css={tw`relative`}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm server deletion'}
                confirm={'Yes, delete server'}
                onClose={() => setModalVisible(false)}
                onConfirmed={handleDelete}
            >
                <p css={tw`mb-4`}>
                    Your server will be permanently deleted from both the panel and Spring Boot system. This action
                    cannot be undone.
                </p>
                <p css={tw`text-red-400 font-medium`}>
                    <strong>Warning:</strong> All server data, files, databases, and backups will be permanently
                    removed.
                </p>
            </Dialog.Confirm>
            <p css={tw`text-sm`}>
                Deleting your server will permanently remove it from the panel and Spring Boot system.&nbsp;
                <strong css={tw`font-medium text-red-400`}>
                    This action is irreversible and all server data will be lost.
                </strong>
            </p>
            <div css={tw`mt-6 flex gap-4`}>
                <Button.Danger
                    variant={Button.Variants.Secondary}
                    onClick={() => setModalVisible(true)}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete Server'}
                </Button.Danger>
            </div>
        </TitledGreyBox>
    );
};
