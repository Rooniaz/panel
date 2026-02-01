import React, { useState, useMemo } from 'react';
import tw, { css } from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faExclamationCircle,
    faChevronLeft,
    faChevronRight,
    faWallet,
    faLandmark,
    faClock,
    faInfoCircle,
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
        background: linear-gradient(90deg, #f97316, #ea580c, #dc2626);
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
                  background: linear-gradient(135deg, #f97316, #ea580c);
                  color: white;
                  box-shadow: 0 8px 25px rgba(234, 88, 12, 0.35), 0 0 0 1px rgba(251, 146, 60, 0.2);
                  transform: translateY(-2px);
              `
            : css`
                  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                  border: 1px solid rgba(255, 255, 255, 0.1);
                  color: #9ca3af;
                  &:hover {
                      background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
                      border-color: rgba(251, 146, 60, 0.3);
                      color: white;
                      transform: translateY(-1px);
                  }
              `}
`;

const NavButtonIcon = styled(FontAwesomeIcon)`
    ${tw`w-3 h-3 sm:w-4 sm:h-4`}
`;

const ContentCard = styled.div`
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

const GuideSection = styled.div`
    ${tw`mb-6`}
`;

const CarouselWrapper = styled.div`
    ${tw`relative mb-4 flex items-center gap-4`}

    @media (max-width: 768px) {
        ${tw`gap-0 relative`}
    }
`;

const GuideImageContainer = styled.div`
    ${tw`relative mx-auto w-full rounded-2xl overflow-hidden flex-1`}
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
`;

const GuideImage = styled.img`
    ${tw`w-full h-auto object-contain`}
    display: block;
    max-height: 400px;

    @media (max-width: 768px) {
        max-height: 300px;
    }
`;

const CarouselNavButton = styled.button`
    ${tw`flex-shrink-0 rounded-full border border-white/10 p-3 transition-all duration-300 z-10 backdrop-blur-sm`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

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
    }
`;

const CarouselNavButtonLeft = styled(CarouselNavButton)`
    ${tw`hidden md:flex md:static`}
`;

const CarouselNavButtonRight = styled(CarouselNavButton)`
    ${tw`hidden md:flex md:static`}
`;

const CarouselNavButtonMobile = styled(CarouselNavButton)`
    ${tw`md:hidden absolute`}
`;

const CarouselNavButtonMobileLeft = styled(CarouselNavButtonMobile)`
    left: 0.5rem;
`;

const CarouselNavButtonMobileRight = styled(CarouselNavButtonMobile)`
    right: 0.5rem;
`;

const DotsContainer = styled.div`
    ${tw`flex justify-center items-center gap-3`}
`;

const DotButton = styled.button<{ $active: boolean }>`
    ${tw`rounded-full transition-all duration-300 cursor-pointer`}
    ${({ $active }) =>
        $active
            ? css`
                  width: 2rem;
                  height: 0.75rem;
                  background: #3b82f6;
                  box-shadow: 0 0 8px rgba(59, 130, 246, 0.8), 0 2px 4px rgba(0, 0, 0, 0.2);
              `
            : css`
                  width: 0.75rem;
                  height: 0.75rem;
                  background: rgba(156, 163, 175, 0.5);
                  &:hover {
                      background: rgba(156, 163, 175, 0.8);
                      transform: scale(1.2);
                  }
              `}
`;

const FormSection = styled.div`
    ${tw`space-y-4`}
`;

const FormLabel = styled.label`
    ${tw`block text-sm font-semibold text-neutral-300 mb-2 flex items-center gap-2`}
    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
`;

const FormInput = styled(Input)`
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
    ${tw`mt-2 text-xs flex items-center gap-2 px-3 py-2 rounded-lg`}
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #fca5a5;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
`;

const CheckboxWrapper = styled.div`
    ${tw`flex items-start gap-3 p-4 rounded-xl border border-white/5`}
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.5) 100%);
    transition: all 0.3s;

    &:hover {
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
        border-color: rgba(56, 189, 248, 0.2);
    }
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
    transition: color 0.2s;

    ${CheckboxWrapper}:hover & {
        color: #e0e7ff;
    }
`;

const TermsLink = styled.button`
    ${tw`underline text-blue-400 hover:text-blue-300 transition-colors`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
`;

const SubmitButtonWrapper = styled.div`
    ${tw`mt-6 flex justify-center`}
`;

const SubmitButton = styled(Button)<{ $canSubmit: boolean }>`
    ${tw`px-12 py-4 text-lg font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 min-w-[200px]`}
    ${({ $canSubmit }) =>
        $canSubmit
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

interface Props {
    onShowTerms: () => void;
    onNavigateToBank?: () => void;
    onNavigateToTrueMoney?: () => void;
    onNavigateToHistory?: () => void;
    activeTab?: 'bank' | 'truemoney' | 'history';
}

const translateErrorMessage = (message: string): string => {
    const msg = message.toLowerCase();

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

    if (/[\u0E00-\u0E7F]/.test(message)) {
        return message;
    }

    return 'เกิดข้อผิดพลาดในการเติมเงิน กรุณาลองใหม่อีกครั้ง';
};

export default ({
    onShowTerms,
    onNavigateToBank,
    onNavigateToTrueMoney,
    onNavigateToHistory,
    activeTab = 'truemoney',
}: Props) => {
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

            const urlParams = new URLSearchParams(window.location.search);
            const supporterCode = localStorage.getItem('supporterCode') || urlParams.get('supporterCode') || '';

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

            setGiftLink('');
            setAcceptedTerms(false);
        } catch (e: any) {
            const errorMessage = e?.message ?? 'เกิดข้อผิดพลาดในการส่งลิงก์';
            setToastErr(translateErrorMessage(errorMessage));
            setTimeout(() => setToastErr(null), 3000);
        }
    };

    return (
        <MainContainer>
            <HeaderCard>
                <HeaderTitle>
                    <FontAwesomeIcon icon={faWallet} />
                    <span>เติมเงินผ่าน TrueMoney Wallet</span>
                </HeaderTitle>
                <HeaderSubtitle>ใช้ลิงก์ซอง TrueMoney เพื่อเติมเครดิตเข้าบัญชีได้ทันที</HeaderSubtitle>
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

            <ContentCard>
                {guideImages.length > 1 && (
                    <GuideSection>
                        <CarouselWrapper>
                            <CarouselNavButtonLeft type='button' onClick={handlePrev} aria-label='Previous'>
                                <FontAwesomeIcon icon={faChevronLeft} />
                            </CarouselNavButtonLeft>
                            <GuideImageContainer>
                                <GuideImage
                                    src={guideImages[currentGuide]}
                                    alt={`TrueMoney Guide ${currentGuide + 1}`}
                                />
                                <CarouselNavButtonMobileLeft type='button' onClick={handlePrev} aria-label='Previous'>
                                    <FontAwesomeIcon icon={faChevronLeft} />
                                </CarouselNavButtonMobileLeft>
                                <CarouselNavButtonMobileRight type='button' onClick={handleNext} aria-label='Next'>
                                    <FontAwesomeIcon icon={faChevronRight} />
                                </CarouselNavButtonMobileRight>
                            </GuideImageContainer>
                            <CarouselNavButtonRight type='button' onClick={handleNext} aria-label='Next'>
                                <FontAwesomeIcon icon={faChevronRight} />
                            </CarouselNavButtonRight>
                        </CarouselWrapper>
                        <DotsContainer>
                            {guideImages.map((_, i) => (
                                <DotButton
                                    key={i}
                                    type='button'
                                    onClick={() => setCurrentGuide(i)}
                                    aria-label={`Go to image ${i + 1}`}
                                    $active={i === currentGuide}
                                />
                            ))}
                        </DotsContainer>
                    </GuideSection>
                )}
                {guideImages.length === 1 && (
                    <GuideSection>
                        <GuideImageContainer>
                            <GuideImage src={guideImages[0]} alt='TrueMoney Guide' />
                        </GuideImageContainer>
                    </GuideSection>
                )}

                <FormSection>
                    <div>
                        <FormLabel>
                            <FontAwesomeIcon icon={faInfoCircle} />
                            <span>กรอกลิงก์ซองทรูมันนี่</span>
                        </FormLabel>
                        <FormInput
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
                    </div>

                    <CheckboxWrapper>
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
                    </CheckboxWrapper>
                </FormSection>

                <SubmitButtonWrapper>
                    <SubmitButton type='button' onClick={handleSubmit} disabled={!canSubmit} $canSubmit={canSubmit}>
                        ยืนยัน
                    </SubmitButton>
                </SubmitButtonWrapper>
            </ContentCard>

            <Toast show={!!toastOk} type='success' onClose={() => setToastOk(null)}>
                {toastOk}
            </Toast>
            <Toast show={!!toastErr} type='error' onClose={() => setToastErr(null)}>
                {toastErr}
            </Toast>
        </MainContainer>
    );
};
