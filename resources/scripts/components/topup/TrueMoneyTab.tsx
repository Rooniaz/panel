import React, { useState, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Toast from './Toast';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Card = styled.div`
    ${tw`mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 p-6 backdrop-blur-sm`}
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
    ${tw`text-2xl font-bold text-white mb-4 flex items-center space-x-3`}
    background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const CarouselContainer = styled.div`
    ${tw`relative mx-auto mb-6 w-full max-w-md rounded-2xl p-6 border border-white/10 overflow-hidden`}
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 50%, rgba(15, 23, 42, 0.9) 100%);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 0 0 1px rgba(56, 189, 248, 0.1);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
        pointer-events: none;
    }
`;

const CarouselNav = styled.div`
    ${tw`absolute left-3 top-1/2 -translate-y-1/2`}
`;

const CarouselNavRight = styled.div`
    ${tw`absolute right-3 top-1/2 -translate-y-1/2`}
`;

const NavButton = styled.button`
    ${tw`rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30 p-3 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 z-10`}
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(8px);

    &:hover {
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.4);
        transform: scale(1.15);
        border-color: rgba(59, 130, 246, 0.6);
    }

    &:active {
        transform: scale(1.05);
    }
`;

const CarouselContent = styled.div`
    ${tw`grid grid-cols-1 gap-1 text-center text-xl relative z-10`}
`;

const CarouselItem = styled.div`
    ${tw`rounded-xl p-6 grid place-items-center relative overflow-hidden`}
    aspect-ratio: 1 / 1;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.3s;
    }

    &:hover::before {
        opacity: 1;
    }

    &:hover {
        transform: scale(1.05);
        border-color: rgba(56, 189, 248, 0.3);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15);
    }
`;

const CarouselImage = styled.img`
    ${tw`max-h-16 w-auto object-contain relative z-10 transition-transform duration-300`}
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));

    ${CarouselItem}:hover & {
        transform: scale(1.1);
    }
`;

const DotsContainer = styled.div`
    ${tw`mt-3 flex justify-center gap-1`}
`;

const Dot = styled.span<{ $active: boolean }>`
    ${tw`h-2 rounded-full transition-all duration-300 relative z-10`}
    ${(props) =>
        props.$active
            ? tw`w-8 bg-gradient-to-r from-blue-400 to-purple-400`
            : tw`w-2 bg-white/30 hover:bg-white/50`}
    box-shadow: ${(props) =>
        props.$active ? '0 0 8px rgba(59, 130, 246, 0.6), 0 2px 4px rgba(0, 0, 0, 0.2)' : 'none'};
    cursor: pointer;

    &:hover {
        transform: scale(1.2);
    }
`;

const InputGroup = styled.div`
    ${tw`space-y-3 mt-6`}
`;

const Label = styled.label`
    ${tw`block text-sm font-semibold text-neutral-200 mb-2 flex items-center space-x-2`}
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const StyledInput = styled(Input)`
    ${tw`w-full rounded-xl border transition-all duration-300`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05);

    &:focus {
        border-color: rgba(59, 130, 246, 0.5);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 6px 20px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        outline: none;
    }

    &:hover:not(:focus) {
        border-color: rgba(255, 255, 255, 0.2);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }
`;

const ErrorText = styled.p`
    ${tw`mt-2 text-xs flex items-center space-x-2 px-3 py-2 rounded-lg`}
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
`;

const CheckboxContainer = styled.div`
    ${tw`flex items-center gap-3 mt-6 p-4 rounded-xl`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s;

    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
        border-color: rgba(56, 189, 248, 0.2);
    }
`;

const CheckboxLabel = styled.label`
    ${tw`text-sm cursor-pointer text-neutral-300`}
    transition: color 0.2s;

    ${CheckboxContainer}:hover & {
        color: #e0e7ff;
    }
`;

const TermsLink = styled.button`
    ${tw`underline transition-all duration-200`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
    color: #93c5fd;

    &:hover {
        color: #60a5fa;
        text-decoration-style: solid;
    }
`;

const logos = [
    { name: 'TrueMoney', url: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/TrueMoney_Logo.png' },
    { name: 'SCB', url: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Siam_Commercial_Bank_logo.svg' },
    { name: 'KBank', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Kasikorn_Bank_logo.svg' },
    { name: 'Krungthai', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0f/Krung_Thai_Bank_logo.svg' },
    { name: 'PromptPay', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5b/PromptPay_logo.png' },
    { name: 'GrabPay', url: 'https://seeklogo.com/images/G/grab-logo-4C96E9A6CB-seeklogo.com.png' },
    { name: 'Alipay', url: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Alipay_logo.svg' },
    { name: 'Apple', url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
];

interface Props {
    onShowTerms: () => void;
}

export default ({ onShowTerms }: Props) => {
    const [giftLink, setGiftLink] = useState('');
    const [supporterCode, setSupporterCode] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [page, setPage] = useState(0);
    const [toastOk, setToastOk] = useState<string | null>(null);
    const [toastErr, setToastErr] = useState<string | null>(null);

    const pageSize = 1;
    const totalPages = Math.ceil(logos.length / pageSize);
    const start = page * pageSize;
    const visible = logos.slice(start, start + pageSize);

    const canSubmit = useMemo(
        () => acceptedTerms && /^https?:\/\/gift\.truemoney\.com\/campaign\/.+/i.test(giftLink.trim()),
        [acceptedTerms, giftLink]
    );

    const handlePrev = () => {
        setPage((p) => (p - 1 + totalPages) % totalPages);
    };

    const handleNext = () => {
        setPage((p) => (p + 1) % totalPages);
    };

    const handleSubmit = async () => {
        if (!canSubmit) return;

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setToastErr('กรุณาเข้าสู่ระบบก่อนทำรายการ');
                setTimeout(() => setToastErr(null), 2500);
                return;
            }

            const res = await fetch(`${SPRING_BOOT_API_URL}/api/wallet/topup/truemoney`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ giftLink, supporterCode: supporterCode || '' }),
            });

            const data: any = await res.json();

            if (res.status === 401) {
                throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            }

            if (!res.ok || (data && (data.status === 'error' || data.ok === false))) {
                throw new Error(data?.message || `ส่งลิงก์ไม่สำเร็จ (${res.status})`);
            }

            setToastOk('ส่งลิงก์ซองสำเร็จ กำลังตรวจสอบ…');
            setTimeout(() => setToastOk(null), 2500);

            // Reset form
            setGiftLink('');
            setSupporterCode('');
            setAcceptedTerms(false);
        } catch (e: any) {
            setToastErr(e?.message ?? 'เกิดข้อผิดพลาดในการส่งลิงก์');
            setTimeout(() => setToastErr(null), 3000);
        }
    };

    return (
        <>
            <Card>
                <SectionTitle>เติมเงินผ่าน TrueMoney Wallet</SectionTitle>

                {/* Carousel */}
                <CarouselContainer>
                    <CarouselNav>
                        <NavButton type='button' onClick={handlePrev} aria-label='Previous'>
                            <FontAwesomeIcon icon={faChevronLeft} className={'h-4 w-4'} />
                        </NavButton>
                    </CarouselNav>
                    <CarouselNavRight>
                        <NavButton type='button' onClick={handleNext} aria-label='Next'>
                            <FontAwesomeIcon icon={faChevronRight} className={'h-4 w-4'} />
                        </NavButton>
                    </CarouselNavRight>

                    <CarouselContent>
                        {visible.map((item, i) => (
                            <CarouselItem key={start + i}>
                                <CarouselImage src={item.url} alt={item.name} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <DotsContainer>
                        {Array.from({ length: totalPages }).map((_, i) => (
                            <Dot key={i} $active={i === page} />
                        ))}
                    </DotsContainer>
                </CarouselContainer>

                <InputGroup>
                    <Label>
                        <span>กรอกลิงก์ซองทรูมันนี่</span>
                    </Label>
                    <StyledInput
                        type='text'
                        placeholder='https://gift.truemoney.com/campaign/?v=xxx'
                        value={giftLink}
                        onChange={(e) => setGiftLink(e.target.value)}
                    />
                    {!giftLink && (
                        <ErrorText>
                            <FontAwesomeIcon icon={faExclamationCircle} className={'w-3 h-3'} />
                            <span>กรุณาระบุลิงก์ซองทรูมันนี่</span>
                        </ErrorText>
                    )}
                </InputGroup>

                <InputGroup>
                    <Label>
                        <span>Supporter Code (ถ้ามี)</span>
                    </Label>
                    <StyledInput
                        type='text'
                        placeholder='ใส่โค้ดผู้สนับสนุน (ถ้ามี)'
                        value={supporterCode}
                        onChange={(e) => setSupporterCode(e.target.value)}
                    />
                </InputGroup>

                <CheckboxContainer>
                    <Switch
                        name='accept-terms-truemoney'
                        defaultChecked={acceptedTerms}
                        onChange={(e) => {
                            setAcceptedTerms(e.target.checked);
                        }}
                    />
                    <CheckboxLabel htmlFor='accept-terms-truemoney'>
                        ฉันได้อ่านและยอมรับ{' '}
                        <TermsLink type='button' onClick={onShowTerms}>
                            เงื่อนไขหรือข้อตกลง
                        </TermsLink>
                    </CheckboxLabel>
                </CheckboxContainer>

                <div css={tw`mt-8 flex justify-end`}>
                    <Button
                        type='button'
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        size={'xlarge'}
                        css={tw`inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300`}
                        style={{
                            background: canSubmit
                                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)'
                                : 'linear-gradient(135deg, #475569 0%, #334155 100%)',
                            boxShadow: canSubmit
                                ? '0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)'
                                : '0 4px 12px rgba(0, 0, 0, 0.2)',
                        }}
                        onMouseEnter={(e) => {
                            if (canSubmit) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow =
                                    '0 12px 35px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (canSubmit) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow =
                                    '0 8px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)';
                            }
                        }}
                    >
                        ยืนยัน
                    </Button>
                </div>
            </Card>

            <Toast show={!!toastOk} type='success' onClose={() => setToastOk(null)}>
                {toastOk}
            </Toast>
            <Toast show={!!toastErr} type='error' onClose={() => setToastErr(null)}>
                {toastErr}
            </Toast>
        </>
    );
};
