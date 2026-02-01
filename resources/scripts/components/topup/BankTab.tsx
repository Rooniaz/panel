import React, { useState, useRef, useMemo } from 'react';
import tw, { css } from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faLandmark,
    faCopy,
    faUpload,
    faCheck,
    faUser,
    faInfoCircle,
    faWallet,
    faClock,
} from '@fortawesome/free-solid-svg-icons';
import Checkbox from '@/components/elements/inputs/Checkbox';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Toast from './Toast';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const MainContainer = styled.div`
    ${tw`w-full space-y-6`}
`;

const HeaderCard = styled.div`
    ${tw`rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #3b82f6, #22d3ee, #8b5cf6);
    }
`;

const HeaderTitle = styled.h2`
    ${tw`text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3 flex-wrap`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const HeaderSubtitle = styled.p`
    ${tw`text-neutral-400 text-xs sm:text-sm`}
`;

const NavigationButtons = styled.div`
    ${tw`flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4`}
`;

const NavButton = styled.button<{ $active?: boolean }>`
    ${tw`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm`}
    ${({ $active }) =>
        $active
            ? css`
                  background: linear-gradient(135deg, #3b82f6, #22d3ee);
                  color: white;
                  box-shadow: 0 8px 25px rgba(34, 211, 238, 0.35), 0 0 0 1px rgba(56, 189, 248, 0.2);
                  transform: translateY(-2px);
              `
            : css`
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  color: #9ca3af;
                  &:hover {
                      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
                      border-color: rgba(59, 130, 246, 0.3);
                      color: white;
                      transform: translateY(-1px);
                  }
              `}
`;

const NavButtonIcon = styled(FontAwesomeIcon)`
    ${tw`w-3 h-3 sm:w-4 sm:h-4`}
`;

const BankInfoCard = styled.div`
    ${tw`rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const BankInfoGrid = styled.div`
    ${tw`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4`}
`;

const BankInfoItem = styled.div`
    ${tw`flex flex-col items-center text-center p-4 rounded-xl`}
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
    border: 1px solid rgba(59, 130, 246, 0.2);
`;

const BankInfoIcon = styled.div`
    ${tw`w-12 h-12 rounded-full flex items-center justify-center mb-3`}
    background: linear-gradient(135deg, #3b82f6 0%, #22d3ee 100%);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
`;

const BankInfoLabel = styled.div`
    ${tw`text-xs text-neutral-400 mb-1`}
`;

const BankInfoValue = styled.div`
    ${tw`text-base font-bold text-white`}
`;

const AccountNumberCard = styled.div`
    ${tw`mt-4 sm:mt-6 rounded-xl p-4 sm:p-5 border border-white/10`}
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    position: relative;
`;

const AccountNumberLabel = styled.div`
    ${tw`text-xs text-neutral-400 mb-2`}
`;

const AccountNumberValue = styled.div`
    ${tw`text-xl sm:text-2xl font-bold tracking-wider text-white mb-3 sm:mb-4 break-all`}
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
`;

const CopyButton = styled.button`
    ${tw`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2`}
    background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

    &:hover {
        background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        transform: translateY(-1px);
    }

    &:active {
        transform: translateY(0);
    }
`;

const UploadCard = styled.div`
    ${tw`rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(56, 189, 248, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const UploadTitle = styled.h3`
    ${tw`text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const UploadArea = styled.div<{ $state: string; $hasFile: boolean }>`
    ${tw`flex cursor-pointer flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border-2 border-dashed p-6 sm:p-8 md:p-12 transition-all duration-300 relative overflow-hidden`}
    min-height: 160px;
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
    
    @media (min-width: 640px) {
        min-height: 200px;
    }

    ${({ $hasFile, $state }) =>
        $hasFile
            ? css`
                  border-color: rgba(34, 211, 238, 0.5);
                  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%);
              `
            : $state === 'drag'
            ? css`
                  border-color: rgba(59, 130, 246, 0.8);
                  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(34, 211, 238, 0.1) 100%);
              `
            : css`
                  border-color: rgba(255, 255, 255, 0.2);
                  &:hover {
                      border-color: rgba(59, 130, 246, 0.5);
                      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
                  }
              `}

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent);
        transition: left 0.5s;
    }

    &:hover::before {
        left: 100%;
    }
`;

const UploadIcon = styled.div<{ $hasFile: boolean }>`
    ${tw`w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-all duration-300`}
    ${({ $hasFile }) =>
        $hasFile
            ? css`
                  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                  color: white;
                  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
              `
            : css`
                  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(34, 211, 238, 0.2) 100%);
                  color: #60a5fa;
              `}
`;

const UploadText = styled.div`
    ${tw`text-lg font-semibold text-white`}
`;

const UploadSubtext = styled.div`
    ${tw`text-sm text-neutral-400`}
`;

const FileNameDisplay = styled.div`
    ${tw`text-center`}
`;

const FileNameText = styled.div`
    ${tw`text-lg font-semibold text-cyan-400 mb-1`}
`;

const FileNameSubtext = styled.div`
    ${tw`text-sm text-neutral-400`}
`;

const InfoBox = styled.div`
    ${tw`mt-6 p-4 rounded-xl border border-yellow-500/30`}
    background: linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%);
`;

const InfoBoxTitle = styled.div`
    ${tw`flex items-center gap-2 text-yellow-400 font-semibold mb-2`}
`;

const InfoBoxList = styled.ul`
    ${tw`list-disc space-y-1 pl-5 text-sm text-neutral-300`}
`;

const FormSection = styled.div`
    ${tw`mt-6 space-y-4`}
`;

const FormLabel = styled.label`
    ${tw`block text-sm font-semibold text-neutral-300 mb-2`}
`;

const FormInput = styled(Input)`
    ${tw`w-full`}
`;

const CheckboxWrapper = styled.div`
    ${tw`flex items-start gap-3 p-4 rounded-xl border border-white/5`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
`;

const StyledCheckbox = styled(Checkbox)`
    ${tw`w-5 h-5 rounded border-2 border-blue-500 bg-transparent cursor-pointer appearance-none mt-0.5 flex-shrink-0`}
    accent-color: #3b82f6;
    transition: all 0.2s;

    &:checked {
        background-color: #3b82f6;
        border-color: #3b82f6;
        background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M5.707 7.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L7 8.586 5.707 7.293z'/%3e%3c/svg%3e");
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
    }

    &:hover {
        border-color: #60a5fa;
    }

    &:focus {
        outline: none;
        ring: 2px;
        ring-color: rgba(59, 130, 246, 0.5);
    }
`;

const CheckboxLabel = styled.label`
    ${tw`text-sm cursor-pointer text-neutral-300`}
`;

const TermsLink = styled.button`
    ${tw`underline text-blue-400 hover:text-blue-300 transition-colors`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
`;

const SubmitButtonWrapper = styled.div`
    ${tw`mt-6 flex justify-center`}
`;

const SubmitButton = styled(Button)<{ $canSubmit: boolean; $isUploading: boolean }>`
    ${tw`px-12 py-4 text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[200px]`}
    ${({ $canSubmit, $isUploading }) =>
        $canSubmit && !$isUploading
            ? css`
                  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%);
                  color: white;
                  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2);
                  &:hover {
                      transform: translateY(-2px);
                      box-shadow: 0 12px 35px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.3);
                  }
              `
            : css`
                  background: linear-gradient(135deg, #475569 0%, #334155 100%);
                  color: #9ca3af;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                  cursor: not-allowed;
              `}
`;

const ResultCard = styled.div`
    ${tw`mt-6 rounded-xl border p-6`}
    border-color: rgba(16, 185, 129, 0.4);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
`;

const ResultTitle = styled.div`
    ${tw`mb-4 text-lg font-bold flex items-center gap-2`}
    color: #6ee7b7;
`;

const ResultGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-2 gap-4`}
`;

const ResultItem = styled.div`
    ${tw`p-3 rounded-lg`}
    background: rgba(0, 0, 0, 0.2);
`;

const ResultLabel = styled.div`
    ${tw`text-xs text-neutral-400 mb-1`}
`;

const ResultValue = styled.div`
    ${tw`text-base font-bold text-white`}
`;

const ResultValueMedium = styled.div`
    ${tw`text-sm font-medium text-white`}
`;

export interface TopupResult {
    amount: number | string;
    slipVerificationId: number;
    paymentId: number;
    method: string;
    slipRef: string | null;
    senderNameTh?: string | null;
    senderBankId?: string | null;
    senderAccountMasked?: string | null;
}

interface Props {
    onShowTerms: () => void;
    onNavigateToBank?: () => void;
    onNavigateToTrueMoney?: () => void;
    onNavigateToHistory?: () => void;
    activeTab?: 'bank' | 'truemoney' | 'history';
}

export default ({
    onShowTerms,
    onNavigateToBank,
    onNavigateToTrueMoney,
    onNavigateToHistory,
    activeTab = 'bank',
}: Props) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [supporterCode, setSupporterCode] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [uploadState, setUploadState] = useState<'idle' | 'selected' | 'uploading' | 'done' | 'error'>('idle');
    const [result, setResult] = useState<TopupResult | null>(null);
    const [copied, setCopied] = useState(false);
    const [toastOk, setToastOk] = useState<string | null>(null);
    const [toastErr, setToastErr] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const bankInfo = {
        bankName: 'ไทยพาณิชย์',
        accountNo: '512331232',
        accountHolder: 'นายบัวลอย หมูหวาน',
    };

    const canSubmit = useMemo(() => acceptedTerms && !!fileName, [acceptedTerms, fileName]);

    const handleCopyAccount = () => {
        navigator.clipboard.writeText(bankInfo.accountNo);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handlePickFile = () => {
        fileRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResult(null);
        setUploadState('selected');
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        const token = localStorage.getItem('auth_token');
        if (!token) {
            setToastErr('กรุณาเข้าสู่ระบบก่อนทำรายการ');
            setTimeout(() => setToastErr(null), 2500);
            return;
        }

        try {
            setUploadState('uploading');

            const form = new FormData();
            form.append('slip', file, file.name);
            form.append('supporterCode', supporterCode ?? '');

            const res = await fetch(`${SPRING_BOOT_API_URL}/api/wallet/topup/bank/easyslip`, {
                method: 'POST',
                body: form,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            let data: any = null;
            try {
                data = await res.json();
            } catch {
                data = null;
            }

            if (res.status === 401) {
                throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            }

            const errMsg =
                (data && (data.error || data.message)) || (!res.ok && `อัปโหลดสลิปไม่สำเร็จ (${res.status})`) || null;

            if (!res.ok || (data && (data.ok === false || data.status === 'error'))) {
                throw new Error(errMsg || 'อัปโหลดสลิปล้มเหลว');
            }

            const mapped: TopupResult | null = data
                ? {
                      amount: typeof data.amount === 'number' ? data.amount : Number(data.amount ?? 0),
                      slipVerificationId: data.slipVerificationId ?? data.result?.slipVerificationId ?? 0,
                      paymentId: data.paymentId ?? data.result?.paymentId ?? 0,
                      method: data.method ?? data.result?.method ?? 'BANK',
                      slipRef: data.slipRef ?? data.result?.slipRef ?? null,
                      senderNameTh: data.senderNameTh ?? null,
                      senderBankId: data.senderBankId ?? null,
                      senderAccountMasked: data.senderAccountMasked ?? null,
                  }
                : null;

            setResult(mapped);
            setUploadState('done');
            setToastOk('อัปโหลดสลิปสำเร็จ! ระบบกำลังบันทึกยอดเข้าวอลเล็ท');
            setTimeout(() => setToastOk(null), 3000);

            setFileName(null);
            if (fileRef.current) fileRef.current.value = '';
        } catch (e: any) {
            setUploadState('error');
            setToastErr(e?.message ?? 'เกิดข้อผิดพลาดระหว่างอัปโหลดสลิป');
            setTimeout(() => setToastErr(null), 3500);
        }
    };

    return (
        <MainContainer>
            <HeaderCard>
                <HeaderTitle>
                    <FontAwesomeIcon icon={faLandmark} />
                    <span>เติมเงินผ่านธนาคาร</span>
                </HeaderTitle>
                <HeaderSubtitle>โอนเงินตามข้อมูลด้านล่างและอัปโหลดสลิปโอนเงิน</HeaderSubtitle>
                <NavigationButtons>
                    <NavButton $active={activeTab === 'bank'} onClick={onNavigateToBank}>
                        <NavButtonIcon icon={faLandmark} />
                        <span>ธนาคาร</span>
                    </NavButton>
                    <NavButton $active={activeTab === 'truemoney'} onClick={onNavigateToTrueMoney}>
                        <NavButtonIcon icon={faWallet} />
                        <span>เติมเงินผ่าน TrueMoney</span>
                    </NavButton>
                    <NavButton $active={activeTab === 'history'} onClick={onNavigateToHistory}>
                        <NavButtonIcon icon={faClock} />
                        <span>ประวัติเติมเงิน</span>
                    </NavButton>
                </NavigationButtons>
            </HeaderCard>

            <BankInfoCard>
                <BankInfoGrid>
                    <BankInfoItem>
                        <BankInfoIcon>
                            <FontAwesomeIcon icon={faLandmark} className={'text-white text-xl'} />
                        </BankInfoIcon>
                        <BankInfoLabel>ธนาคาร</BankInfoLabel>
                        <BankInfoValue>{bankInfo.bankName}</BankInfoValue>
                    </BankInfoItem>
                    <BankInfoItem>
                        <BankInfoIcon>
                            <FontAwesomeIcon icon={faUser} className={'text-white text-xl'} />
                        </BankInfoIcon>
                        <BankInfoLabel>ชื่อบัญชี</BankInfoLabel>
                        <BankInfoValue>{bankInfo.accountHolder}</BankInfoValue>
                    </BankInfoItem>
                    <BankInfoItem>
                        <BankInfoIcon>
                            <FontAwesomeIcon icon={faCopy} className={'text-white text-xl'} />
                        </BankInfoIcon>
                        <BankInfoLabel>เลขบัญชี</BankInfoLabel>
                        <BankInfoValue>{bankInfo.accountNo}</BankInfoValue>
                    </BankInfoItem>
                </BankInfoGrid>

                <AccountNumberCard>
                    <AccountNumberLabel>เลขบัญชีสำหรับโอนเงิน</AccountNumberLabel>
                    <AccountNumberValue>{bankInfo.accountNo}</AccountNumberValue>
                    <CopyButton onClick={handleCopyAccount}>
                        <FontAwesomeIcon icon={faCopy} />
                        <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกเลขบัญชี'}</span>
                    </CopyButton>
                </AccountNumberCard>
            </BankInfoCard>

            <UploadCard>
                <UploadTitle>
                    <FontAwesomeIcon icon={faUpload} />
                    <span>อัปโหลดสลิปโอนเงิน</span>
                </UploadTitle>

                <UploadArea $state={uploadState} $hasFile={!!fileName} onClick={handlePickFile}>
                    {fileName ? (
                        <>
                            <UploadIcon $hasFile={true}>
                                <FontAwesomeIcon icon={faCheck} />
                            </UploadIcon>
                            <FileNameDisplay>
                                <FileNameText>{fileName}</FileNameText>
                                <FileNameSubtext>คลิกเพื่อเปลี่ยนไฟล์</FileNameSubtext>
                            </FileNameDisplay>
                        </>
                    ) : (
                        <>
                            <UploadIcon $hasFile={false}>
                                <FontAwesomeIcon icon={faUpload} />
                            </UploadIcon>
                            <UploadText>เลือกไฟล์สลิปโอนเงิน</UploadText>
                            <UploadSubtext>รองรับไฟล์ภาพ JPG/PNG หรือ PDF</UploadSubtext>
                        </>
                    )}
                </UploadArea>
                <input
                    ref={fileRef}
                    type='file'
                    accept='image/*,application/pdf'
                    className={'hidden'}
                    onChange={handleFileChange}
                />

                <InfoBox>
                    <InfoBoxTitle>
                        <FontAwesomeIcon icon={faInfoCircle} />
                        <span>ข้อควรทราบ</span>
                    </InfoBoxTitle>
                    <InfoBoxList>
                        <li>ระบบไม่รองรับการโอนเงินจากธนาคารที่ไม่มี QR Code บนสลิป เช่น MAKE by KBank, Kept</li>
                        <li>หากพบปัญหาในการเติมเงิน กรุณาติดต่อผู้ดูแลระบบ</li>
                    </InfoBoxList>
                </InfoBox>

                <FormSection>
                    <div>
                        <FormLabel>Supporter Code (ถ้ามี)</FormLabel>
                        <FormInput
                            type='text'
                            placeholder='ใส่โค้ดผู้สนับสนุน (ถ้ามี)'
                            value={supporterCode}
                            onChange={(e) => setSupporterCode(e.target.value)}
                        />
                    </div>

                    <CheckboxWrapper>
                        <StyledCheckbox
                            id='accept-terms-bank'
                            checked={acceptedTerms}
                            onChange={(e) => {
                                setAcceptedTerms(e.target.checked);
                            }}
                        />
                        <CheckboxLabel htmlFor='accept-terms-bank'>
                            ฉันได้อ่านและยอมรับ{' '}
                            <TermsLink type='button' onClick={onShowTerms}>
                                เงื่อนไขหรือข้อตกลง
                            </TermsLink>
                        </CheckboxLabel>
                    </CheckboxWrapper>
                </FormSection>

                <SubmitButtonWrapper>
                    <SubmitButton
                        type='button'
                        onClick={handleSubmit}
                        disabled={!canSubmit || uploadState === 'uploading'}
                        $canSubmit={canSubmit}
                        $isUploading={uploadState === 'uploading'}
                    >
                        {uploadState === 'uploading' && <FontAwesomeIcon icon={faUpload} className={'animate-spin'} />}
                        {uploadState === 'done' && <FontAwesomeIcon icon={faCheck} />}
                        {uploadState === 'uploading'
                            ? 'กำลังอัปโหลด…'
                            : uploadState === 'done'
                            ? 'อัปโหลดสำเร็จ'
                            : uploadState === 'error'
                            ? 'ลองใหม่'
                            : 'ยืนยันการเติมเงิน'}
                    </SubmitButton>
                </SubmitButtonWrapper>

                {result && (
                    <ResultCard>
                        <ResultTitle>
                            <FontAwesomeIcon icon={faCheck} />
                            <span>ผลการเติมเงิน</span>
                        </ResultTitle>
                        <ResultGrid>
                            <ResultItem>
                                <ResultLabel>ยอดที่เติม</ResultLabel>
                                <ResultValue>{Number(result.amount).toFixed(2)} บาท</ResultValue>
                            </ResultItem>
                            <ResultItem>
                                <ResultLabel>รหัสสลิป</ResultLabel>
                                <ResultValueMedium>{result.slipRef || '-'}</ResultValueMedium>
                            </ResultItem>
                            <ResultItem>
                                <ResultLabel>Payment ID</ResultLabel>
                                <ResultValueMedium>{result.paymentId}</ResultValueMedium>
                            </ResultItem>
                            <ResultItem>
                                <ResultLabel>Slip Verification</ResultLabel>
                                <ResultValueMedium>{result.slipVerificationId}</ResultValueMedium>
                            </ResultItem>
                            {(result.senderNameTh || result.senderAccountMasked || result.senderBankId) && (
                                <>
                                    <ResultItem style={{ gridColumn: '1 / -1' }}>
                                        <ResultLabel>ผู้โอน</ResultLabel>
                                        <ResultValueMedium>
                                            {result.senderNameTh || '-'}
                                            {result.senderAccountMasked ? ` • ${result.senderAccountMasked}` : ''}
                                            {result.senderBankId ? ` • ${result.senderBankId}` : ''}
                                        </ResultValueMedium>
                                    </ResultItem>
                                </>
                            )}
                        </ResultGrid>
                    </ResultCard>
                )}
            </UploadCard>

            {copied && (
                <Toast show={true} type='success' onClose={() => setCopied(false)}>
                    คัดลอกลงคลิปบอร์ดแล้ว
                </Toast>
            )}
            <Toast show={!!toastOk} type='success' onClose={() => setToastOk(null)}>
                {toastOk}
            </Toast>
            <Toast show={!!toastErr} type='error' onClose={() => setToastErr(null)}>
                {toastErr}
            </Toast>
        </MainContainer>
    );
};
