import React, { useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCreditCard, faSpinner, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { createPortal } from 'react-dom';
import Fade from '@/components/elements/Fade';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const ModalMask = styled.div`
    ${tw`fixed z-50 overflow-auto flex w-full inset-0 items-center justify-center p-4`}
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
    ${tw`max-w-md w-full bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 space-y-6 border border-white/10 backdrop-blur-sm relative`}
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    margin: auto;
`;

const CloseButton = styled.button`
    ${tw`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors`}
`;

const Title = styled.h2`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center space-x-3`}
`;

const UserInfo = styled.div`
    ${tw`bg-neutral-900/50 rounded-xl p-4 border border-white/5`}
`;

const UserInfoRow = styled.div`
    ${tw`flex items-center justify-between py-2`}
`;

const UserInfoLabel = styled.div`
    ${tw`text-neutral-400 text-sm`}
`;

const UserInfoValue = styled.div`
    ${tw`text-white font-medium`}
`;

const FormGroup = styled.div`
    ${tw`space-y-2`}
`;

const Label = styled.label`
    ${tw`block text-sm font-semibold text-neutral-300`}
`;

const ErrorText = styled.div`
    ${tw`text-red-400 text-sm flex items-center gap-1 mt-1`}
`;

const ButtonGroup = styled.div`
    ${tw`flex items-center gap-3`}
`;

const StyledButton = styled(Button)`
    ${tw`flex-1`}
`;

interface User {
    id: number;
    username: string;
    email: string;
    credit: number;
    createdAt?: string;
    registrationDate?: string;
}

interface Props {
    user: User;
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default ({ user, visible, onClose, onSuccess }: Props) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            setError('กรุณากรอกจำนวนเงินที่ถูกต้อง');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setError('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
                setLoading(false);
                return;
            }

            const response = await fetch(`${SPRING_BOOT_API_URL}/api/admin/wallet/topup`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    amount: amountNum,
                    note: note || `Admin topup for ${user.username}`,
                }),
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // If response is not JSON, use default message
                }
                throw new Error(errorMessage);
            }

            await response.json();
            setLoading(false);
            setAmount('');
            setNote('');
            onSuccess();
        } catch (err: any) {
            console.error('Failed to topup user:', err);
            setError(err?.message || 'เกิดข้อผิดพลาดในการเติมเงิน');
            setLoading(false);
        }
    };

    if (!visible) {
        return null;
    }

    const content = (
        <Fade in={visible} timeout={150} appear unmountOnExit>
            <ModalMask onClick={onClose}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                    <CloseButton onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </CloseButton>

                    <Title>
                        <FontAwesomeIcon icon={faCreditCard} css={tw`text-green-400`} />
                        <span>เติมเงินให้ผู้ใช้</span>
                    </Title>

                    <UserInfo>
                        <UserInfoRow>
                            <UserInfoLabel>ผู้ใช้</UserInfoLabel>
                            <UserInfoValue>{user.username}</UserInfoValue>
                        </UserInfoRow>
                        <UserInfoRow>
                            <UserInfoLabel>อีเมล</UserInfoLabel>
                            <UserInfoValue>{user.email}</UserInfoValue>
                        </UserInfoRow>
                        <UserInfoRow>
                            <UserInfoLabel>เครดิตปัจจุบัน</UserInfoLabel>
                            <UserInfoValue>{user.credit.toFixed(2)} B</UserInfoValue>
                        </UserInfoRow>
                    </UserInfo>

                    <form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>จำนวนเงิน (B)</Label>
                            <Input
                                type='number'
                                step='0.01'
                                min='0.01'
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder='0.00'
                                required
                                disabled={loading}
                            />
                            {error && (
                                <ErrorText>
                                    <FontAwesomeIcon icon={faExclamationCircle} />
                                    <span>{error}</span>
                                </ErrorText>
                            )}
                        </FormGroup>

                        <FormGroup>
                            <Label>หมายเหตุ (ไม่บังคับ)</Label>
                            <Input
                                type='text'
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder='หมายเหตุการเติมเงิน'
                                disabled={loading}
                            />
                        </FormGroup>

                        <ButtonGroup>
                            <StyledButton type='button' onClick={onClose} disabled={loading}>
                                ยกเลิก
                            </StyledButton>
                            <StyledButton type='submit' disabled={loading}>
                                {loading ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} spin css={tw`mr-2`} />
                                        กำลังเติมเงิน...
                                    </>
                                ) : (
                                    'เติมเงิน'
                                )}
                            </StyledButton>
                        </ButtonGroup>
                    </form>
                </ModalContent>
            </ModalMask>
        </Fade>
    );

    return createPortal(content, document.body);
};
