import React, { useState, useRef, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLandmark, faCopy, faUpload, faCheck, faUser } from '@fortawesome/free-solid-svg-icons';
import Checkbox from '@/components/elements/inputs/Checkbox';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Toast from './Toast';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Card = styled.div`
    ${tw`bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 rounded-2xl p-6 border border-white/10 backdrop-blur-sm`}
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

const SectionTitle = styled.h3`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center space-x-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const BankInfoSection = styled.div`
    ${tw`space-y-5`}
`;

const InfoRow = styled.div`
    ${tw`flex items-center gap-4`}
`;

const InfoIcon = styled.div`
    ${tw`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0`}
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
`;

const IconWrapper = styled.div`
    ${tw`flex items-center justify-center w-full h-full`}
`;

const InfoContent = styled.div`
    ${tw`flex-1`}
`;

const InfoLabel = styled.div`
    ${tw`text-xs text-neutral-400`}
`;

const InfoValue = styled.div`
    ${tw`text-base font-semibold text-white mt-1`}
`;

const AccountNumberBox = styled.div`
    ${tw`flex items-center justify-between rounded-xl bg-gradient-to-r from-black/30 via-black/20 to-black/30 p-4 border border-white/10`}
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
`;

const AccountNumber = styled.div`
    ${tw`text-lg font-bold tracking-[.05em] text-white`}
`;

const CopyButton = styled.button`
    ${tw`inline-flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm hover:bg-blue-500/20 transition-all duration-200`}
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);

    &:hover {
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        transform: translateY(-1px);
        border-color: rgba(59, 130, 246, 0.5);
    }
`;

const UploadArea = styled.div<{ $state: string }>`
    ${tw`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-300`}
    ${(props) =>
        props.$state === 'drag'
            ? tw`border-blue-400/80 bg-gradient-to-br from-blue-400/20 to-purple-400/10`
            : tw`border-white/20 hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-400/10 hover:to-purple-400/5`}
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &:hover {
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
        transform: translateY(-2px);
    }
`;

const UploadIcon = styled.div`
    ${tw`h-8 w-8 opacity-90`}
`;

const UploadText = styled.div`
    ${tw`text-lg font-semibold`}
`;

const UploadSubtext = styled.div`
    ${tw`text-xs text-neutral-400`}
`;

const ConditionsList = styled.ul`
    ${tw`list-disc space-y-1 pl-6 text-sm text-neutral-400 mt-4`}
`;

const InputGroup = styled.div`
    ${tw`space-y-3 mt-5`}
`;

const Label = styled.label`
    ${tw`block text-sm font-semibold text-neutral-300`}
`;

const TermsLink = styled.button`
    ${tw`underline text-blue-400 hover:text-blue-300 transition-colors`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
`;

const CheckboxContainer = styled.div`
    ${tw`flex items-center gap-3 mt-2`}
`;

const StyledCheckbox = styled(Checkbox)`
    ${tw`w-5 h-5 rounded border-2 border-blue-500 bg-transparent cursor-pointer appearance-none`}
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
    ${tw`text-sm cursor-pointer`}
`;

const ResultCard = styled.div`
    ${tw`mt-6 rounded-xl border p-4`}
    border-color: rgba(52, 211, 153, 0.3);
    background-color: rgba(16, 185, 129, 0.1);
`;

const ResultTitle = styled.div`
    ${tw`mb-1 text-sm font-semibold`}
    color: #6ee7b7;
`;

const ResultGrid = styled.div`
    ${tw`grid gap-2 text-sm`}
`;

const ResultRow = styled.div`
    ${tw`flex justify-between`}
`;

const ResultLabel = styled.span`
    ${tw`text-neutral-400`}
`;

const ResultValue = styled.span`
    ${tw`font-bold text-white`}
`;

const ResultValueMedium = styled.span`
    ${tw`font-medium text-white`}
`;

const Divider = styled.div`
    ${tw`h-px w-full bg-white/10 my-1`}
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
}

export default ({ onShowTerms }: Props) => {
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
        <>
            <div css={tw`grid gap-6 lg:grid-cols-2`}>
                {/* Left: Bank info */}
                <Card>
                    <SectionTitle>โอนเงินตามข้อมูลดังนี้</SectionTitle>
                    <BankInfoSection>
                        <InfoRow>
                            <InfoIcon>
                                <IconWrapper>
                                    <FontAwesomeIcon icon={faLandmark} css={tw`h-5 w-5 text-white`} />
                                </IconWrapper>
                            </InfoIcon>
                            <InfoContent>
                                <InfoLabel>ธนาคาร</InfoLabel>
                                <InfoValue>{bankInfo.bankName}</InfoValue>
                            </InfoContent>
                        </InfoRow>
                        <AccountNumberBox>
                            <div>
                                <InfoLabel>เลขบัญชี</InfoLabel>
                                <AccountNumber>{bankInfo.accountNo}</AccountNumber>
                            </div>
                            <CopyButton onClick={handleCopyAccount}>
                                <FontAwesomeIcon icon={faCopy} className={'h-4 w-4'} />
                                <span>คัดลอก</span>
                            </CopyButton>
                        </AccountNumberBox>
                        <InfoRow>
                            <InfoIcon>
                                <IconWrapper>
                                    <FontAwesomeIcon icon={faUser} css={tw`h-5 w-5 text-white`} />
                                </IconWrapper>
                            </InfoIcon>
                            <InfoContent>
                                <InfoLabel>ชื่อบัญชี</InfoLabel>
                                <InfoValue>{bankInfo.accountHolder}</InfoValue>
                            </InfoContent>
                        </InfoRow>
                    </BankInfoSection>
                </Card>

                {/* Right: Slip upload */}
                <Card>
                    <SectionTitle>อัปโหลดสลิปโอนเงิน</SectionTitle>
                    <UploadArea $state={uploadState} onClick={handlePickFile}>
                        {fileName ? (
                            <div css={tw`flex flex-col items-center justify-center gap-2`}>
                                <UploadIcon>
                                    <FontAwesomeIcon icon={faCheck} className={'text-green-400'} />
                                </UploadIcon>
                                <UploadText css={tw`text-center`}>
                                    <span css={tw`font-medium text-cyan-400`}>{fileName}</span>
                                </UploadText>
                                <UploadSubtext>คลิกเพื่อเปลี่ยนไฟล์</UploadSubtext>
                            </div>
                        ) : (
                            <>
                                <UploadIcon>
                                    <FontAwesomeIcon icon={faUpload} />
                                </UploadIcon>
                                <UploadText>เลือกไฟล์สลิป…</UploadText>
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

                    <ConditionsList>
                        <li>ระบบไม่รองรับการโอนเงินจากธนาคารที่ไม่มี QR Code บนสลิป เช่น MAKE by KBank, Kept</li>
                        <li>หากพบปัญหาในการเติมเงิน กรุณาติดต่อผู้ดูแลระบบ</li>
                    </ConditionsList>

                    <InputGroup>
                        <Label>Supporter Code (ถ้ามี)</Label>
                        <Input
                            type='text'
                            placeholder='ใส่โค้ดผู้สนับสนุน (ถ้ามี)'
                            value={supporterCode}
                            onChange={(e) => setSupporterCode(e.target.value)}
                        />
                    </InputGroup>

                    <CheckboxContainer>
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
                    </CheckboxContainer>

                    <div css={tw`mt-6 flex justify-center`}>
                        <Button
                            type='button'
                            onClick={handleSubmit}
                            disabled={!canSubmit || uploadState === 'uploading'}
                            size={'xlarge'}
                            css={tw`inline-flex items-center justify-center gap-2 rounded-xl px-12 py-5 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300 w-full max-w-md`}
                            style={{
                                background:
                                    canSubmit && uploadState !== 'uploading'
                                        ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
                                        : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                                boxShadow:
                                    canSubmit && uploadState !== 'uploading'
                                        ? '0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                            }}
                            onMouseEnter={(e) => {
                                if (canSubmit && uploadState !== 'uploading') {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 12px 35px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.3)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (canSubmit && uploadState !== 'uploading') {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow =
                                        '0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)';
                                }
                            }}
                        >
                            {uploadState === 'done' && <FontAwesomeIcon icon={faCheck} className={'h-5 w-5'} />}
                            {uploadState === 'uploading'
                                ? 'กำลังอัปโหลด…'
                                : uploadState === 'done'
                                ? 'อัปโหลดสำเร็จ'
                                : uploadState === 'error'
                                ? 'ลองใหม่'
                                : 'ยืนยัน'}
                        </Button>
                    </div>

                    {result && (
                        <ResultCard>
                            <ResultTitle>ผลการเติมเงิน</ResultTitle>
                            <ResultGrid>
                                <ResultRow>
                                    <ResultLabel>ยอดที่เติม</ResultLabel>
                                    <ResultValue>{Number(result.amount).toFixed(2)} บาท</ResultValue>
                                </ResultRow>
                                <ResultRow>
                                    <ResultLabel>รหัสสลิป</ResultLabel>
                                    <ResultValueMedium>{result.slipRef || '-'}</ResultValueMedium>
                                </ResultRow>
                                <ResultRow>
                                    <ResultLabel>Payment ID</ResultLabel>
                                    <ResultValueMedium>{result.paymentId}</ResultValueMedium>
                                </ResultRow>
                                <ResultRow>
                                    <ResultLabel>Slip Verification</ResultLabel>
                                    <ResultValueMedium>{result.slipVerificationId}</ResultValueMedium>
                                </ResultRow>
                                {(result.senderNameTh || result.senderAccountMasked || result.senderBankId) && (
                                    <>
                                        <Divider />
                                        <ResultRow>
                                            <ResultLabel>ผู้โอน</ResultLabel>
                                            <ResultValueMedium css={tw`truncate`}>
                                                {result.senderNameTh || '-'}
                                                {result.senderAccountMasked ? ` • ${result.senderAccountMasked}` : ''}
                                                {result.senderBankId ? ` • ${result.senderBankId}` : ''}
                                            </ResultValueMedium>
                                        </ResultRow>
                                    </>
                                )}
                            </ResultGrid>
                        </ResultCard>
                    )}
                </Card>
            </div>

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
        </>
    );
};
