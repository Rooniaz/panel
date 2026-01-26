import React, { useState, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Checkbox from '@/components/elements/inputs/Checkbox';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Toast from './Toast';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Card = styled.div`
    ${tw`mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-neutral-800/95 via-neutral-800/90 to-neutral-900/95 p-6 backdrop-blur-sm`}
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

const GuideImageContainer = styled.div`
    ${tw`relative mx-auto mb-6 w-full rounded-2xl overflow-hidden`}
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
`;

const CarouselWrapper = styled.div`
    ${tw`relative mb-6 flex items-center gap-4`}

    @media (max-width: 768px) {
        ${tw`gap-0 relative`}
    }
`;

const NavButton = styled.button`
    ${tw`flex-shrink-0 rounded-full border border-white/10 p-3 transition-all duration-300 z-10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        z-index: 20;
        width: 2.5rem;
        height: 2.5rem;
    }

    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
        border-color: rgba(56, 189, 248, 0.3);
        box-shadow: 0 6px 20px rgba(56, 189, 248, 0.2), 0 0 0 1px rgba(56, 189, 248, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
        transform: scale(1.1);

        @media (max-width: 768px) {
            transform: translateY(-50%) scale(1.1);
        }
    }

    &:active {
        transform: scale(0.95);

        @media (max-width: 768px) {
            transform: translateY(-50%) scale(0.95);
        }

        background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
    }
`;

const DotsContainer = styled.div`
    ${tw`flex justify-center items-center gap-3 mt-4`}
`;

const GuideImage = styled.img`
    ${tw`w-full h-auto object-contain`}
    display: block;
    max-height: 70vh;

    @media (max-width: 768px) {
        max-height: 60vh;
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
    ${tw`text-sm cursor-pointer text-neutral-300`}
    transition: color 0.2s;

    ${CheckboxContainer}:hover & {
        color: #e0e7ff;
    }
`;

const TermsLink = styled.button`
    ${tw`text-blue-400 hover:text-blue-300 underline transition-colors`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
`;

interface Props {
    onShowTerms: () => void;
}

const translateErrorMessage = (message: string): string => {
    const msg = message.toLowerCase();

    // Check for common error patterns
    if (msg.includes('out of stock') || msg.includes('voucher ticket is out of stock')) {
        return 'ลิงค์นี้ถูกใช้แล้ว';
    }
    if (msg.includes('invalid gift link') || msg.includes('verification failed')) {
        return 'ลิงค์ไม่ถูกต้องหรือหมดอายุ';
    }
    if (msg.includes('already used') || msg.includes('already redeemed')) {
        return 'ลิงค์นี้ถูกใช้แล้ว';
    }
    if (msg.includes('expired') || msg.includes('expire')) {
        return 'ลิงค์หมดอายุแล้ว';
    }
    if (msg.includes('not found') || msg.includes('voucher not found')) {
        return 'ไม่พบลิงค์นี้';
    }
    if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) {
        return 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง';
    }

    // If message is already in Thai, return as is
    if (/[\u0E00-\u0E7F]/.test(message)) {
        return message;
    }

    // Default fallback
    return 'เกิดข้อผิดพลาดในการเติมเงิน กรุณาลองใหม่อีกครั้ง';
};

export default ({ onShowTerms }: Props) => {
    const [giftLink, setGiftLink] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [currentGuide, setCurrentGuide] = useState(0);
    const [toastOk, setToastOk] = useState<string | null>(null);
    const [toastErr, setToastErr] = useState<string | null>(null);

    const guideImages = ['/truemoney-guide.jpg', '/truemoney-guide2.jpg'];

    const canSubmit = useMemo(
        () => acceptedTerms && /^https?:\/\/gift\.truemoney\.com\/campaign\/.+/i.test(giftLink.trim()),
        [acceptedTerms, giftLink]
    );

    const handlePrev = () => {
        setCurrentGuide((p) => (p - 1 + guideImages.length) % guideImages.length);
    };

    const handleNext = () => {
        setCurrentGuide((p) => (p + 1) % guideImages.length);
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

            // Get supporterCode from localStorage or URL params if available
            const urlParams = new URLSearchParams(window.location.search);
            const supporterCode = localStorage.getItem('supporterCode') || urlParams.get('supporterCode') || '';

            // Send giftLink as-is without any transformation
            const requestBody: { giftLink: string; supporterCode?: string } = { giftLink: giftLink.trim() };
            if (supporterCode) {
                requestBody.supporterCode = supporterCode;
            }

            const res = await fetch(`${SPRING_BOOT_API_URL}/api/wallet/topup/truemoney`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            });

            const data: any = await res.json();

            if (res.status === 401) {
                throw new Error('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
            }

            if (!res.ok || (data && (data.status === 'error' || data.ok === false))) {
                const errorMessage = data?.message || `ส่งลิงก์ไม่สำเร็จ (${res.status})`;
                throw new Error(translateErrorMessage(errorMessage));
            }

            setToastOk('ส่งลิงก์ซองสำเร็จ กำลังตรวจสอบ…');
            setTimeout(() => setToastOk(null), 2500);

            // Reset form
            setGiftLink('');
            setAcceptedTerms(false);
        } catch (e: any) {
            const errorMessage = e?.message ?? 'เกิดข้อผิดพลาดในการส่งลิงก์';
            setToastErr(translateErrorMessage(errorMessage));
            setTimeout(() => setToastErr(null), 3000);
        }
    };

    return (
        <>
            <Card>
                <SectionTitle>เติมเงินผ่าน TrueMoney Wallet</SectionTitle>

                {/* Guide Images */}
                {guideImages.length > 1 && (
                    <>
                        <CarouselWrapper>
                            <NavButton
                                type='button'
                                onClick={handlePrev}
                                aria-label='Previous'
                                css={tw`hidden md:flex md:static`}
                            >
                                <FontAwesomeIcon icon={faChevronLeft} css={tw`text-white text-lg`} />
                            </NavButton>
                            <GuideImageContainer css={tw`flex-1 relative`}>
                                <GuideImage
                                    src={guideImages[currentGuide]}
                                    alt={`TrueMoney Guide ${currentGuide + 1}`}
                                />
                                <NavButton
                                    type='button'
                                    onClick={handlePrev}
                                    aria-label='Previous'
                                    css={tw`md:hidden absolute left-2`}
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} css={tw`text-white text-lg`} />
                                </NavButton>
                                <NavButton
                                    type='button'
                                    onClick={handleNext}
                                    aria-label='Next'
                                    css={tw`md:hidden absolute right-2`}
                                >
                                    <FontAwesomeIcon icon={faChevronRight} css={tw`text-white text-lg`} />
                                </NavButton>
                            </GuideImageContainer>
                            <NavButton
                                type='button'
                                onClick={handleNext}
                                aria-label='Next'
                                css={tw`hidden md:flex md:static`}
                            >
                                <FontAwesomeIcon icon={faChevronRight} css={tw`text-white text-lg`} />
                            </NavButton>
                        </CarouselWrapper>
                        <DotsContainer>
                            {guideImages.map((_, i) => (
                                <button
                                    key={i}
                                    type='button'
                                    onClick={() => setCurrentGuide(i)}
                                    aria-label={`Go to image ${i + 1}`}
                                    css={tw`rounded-full transition-all duration-300 cursor-pointer`}
                                    style={{
                                        width: i === currentGuide ? '2rem' : '0.75rem',
                                        height: i === currentGuide ? '0.75rem' : '0.75rem',
                                        background: i === currentGuide ? '#3b82f6' : 'rgba(156, 163, 175, 0.5)',
                                        boxShadow:
                                            i === currentGuide
                                                ? '0 0 8px rgba(59, 130, 246, 0.8), 0 2px 4px rgba(0, 0, 0, 0.2)'
                                                : 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (i !== currentGuide) {
                                            e.currentTarget.style.background = 'rgba(156, 163, 175, 0.8)';
                                            e.currentTarget.style.transform = 'scale(1.2)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (i !== currentGuide) {
                                            e.currentTarget.style.background = 'rgba(156, 163, 175, 0.5)';
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }
                                    }}
                                />
                            ))}
                        </DotsContainer>
                    </>
                )}
                {guideImages.length === 1 && (
                    <GuideImageContainer>
                        <GuideImage src={guideImages[0]} alt='TrueMoney Guide' />
                    </GuideImageContainer>
                )}

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
                    {giftLink && !/^https?:\/\/gift\.truemoney\.com\/campaign\/.+/i.test(giftLink.trim()) && (
                        <ErrorText>
                            <FontAwesomeIcon icon={faExclamationCircle} className={'w-3 h-3'} />
                            <span>ระบุลิงก์ไม่ถูกต้อง</span>
                        </ErrorText>
                    )}
                </InputGroup>

                <CheckboxContainer>
                    <StyledCheckbox
                        id='accept-terms-truemoney'
                        checked={acceptedTerms}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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

                <div css={tw`mt-8 flex justify-center`}>
                    <Button
                        type='button'
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        size={'xlarge'}
                        css={tw`inline-flex items-center justify-center gap-2 rounded-xl px-12 py-5 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-60 transition-all duration-300 w-full max-w-md`}
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
