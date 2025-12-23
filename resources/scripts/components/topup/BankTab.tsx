import React, { useState, useRef, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faCopy, faUpload, faCheck, faInfo } from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Toast from './Toast';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Card = styled.div`
    ${tw`bg-neutral-800 rounded-xl p-6 border border-white/10`}
    box-shadow: 0 10px 25px rgba(0,0,0,.3);
`;

const SectionTitle = styled.h3`
    ${tw`text-xl font-bold text-white mb-6`}
`;

const BankInfoSection = styled.div`
    ${tw`space-y-5`}
`;

const InfoRow = styled.div`
    ${tw`flex items-center gap-4`}
`;

const InfoIcon = styled.div`
    ${tw`w-10 h-10 rounded-xl bg-black/30 grid place-items-center`}
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
    ${tw`flex items-center justify-between rounded-xl bg-black/20 p-4`}
`;

const AccountNumber = styled.div`
    ${tw`text-lg font-bold tracking-[.05em] text-white`}
`;

const CopyButton = styled.button`
    ${tw`inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm hover:bg-white/20 transition-colors`}
`;

const UploadArea = styled.div<{ $state: string }>`
    ${tw`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition`}
    ${(props) =>
        props.$state === 'drag'
            ? tw`border-blue-400/80 bg-blue-400/10`
            : tw`border-white/20 hover:border-white/40 hover:bg-white/5`}
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
    ${tw`underline`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
`;

const CheckboxContainer = styled.div`
    ${tw`flex items-center gap-3 mt-2`}
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
        bankName: 'ธนาคารไทยพาณิชย์',
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
                                <FontAwesomeIcon icon={faBuilding} className={'h-5 w-5'} />
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
                                <FontAwesomeIcon icon={faInfo} className={'h-5 w-5'} />
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
                        <UploadIcon>
                            <FontAwesomeIcon icon={faUpload} />
                        </UploadIcon>
                        <UploadText>เลือกไฟล์สลิป…</UploadText>
                        <UploadSubtext>รองรับไฟล์ภาพ JPG/PNG หรือ PDF</UploadSubtext>
                        {fileName && (
                            <div css={tw`mt-2 text-sm text-neutral-300`}>
                                ไฟล์ที่เลือก: <span css={tw`font-medium`}>{fileName}</span>
                            </div>
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
                        <Switch
                            name='accept-terms-bank'
                            defaultChecked={acceptedTerms}
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

                    <div css={tw`mt-6 flex justify-end`}>
                        <Button
                            type='button'
                            onClick={handleSubmit}
                            disabled={!canSubmit || uploadState === 'uploading'}
                            size={'xlarge'}
                            css={tw`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60`}
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
