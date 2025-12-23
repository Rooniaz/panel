import React, { useState, useMemo } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Switch from '@/components/elements/Switch';
import Input from '@/components/elements/Input';
import Button from '@/components/elements/Button';
import Toast from './Toast';

const SPRING_BOOT_API_URL = 'http://localhost:9000';

const Card = styled.div`
    ${tw`mx-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6`}
    box-shadow: 0 10px 25px rgba(0,0,0,.3);
`;

const SectionTitle = styled.h3`
    ${tw`text-xl font-bold text-white mb-4`}
`;

const CarouselContainer = styled.div`
    ${tw`relative mx-auto mb-5 w-full max-w-md rounded-2xl bg-black/30 p-5`}
`;

const CarouselNav = styled.div`
    ${tw`absolute left-3 top-1/2 -translate-y-1/2`}
`;

const CarouselNavRight = styled.div`
    ${tw`absolute right-3 top-1/2 -translate-y-1/2`}
`;

const NavButton = styled.button`
    ${tw`rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors`}
`;

const CarouselContent = styled.div`
    ${tw`grid grid-cols-1 gap-1 text-center text-xl`}
`;

const CarouselItem = styled.div`
    ${tw`rounded-xl bg-white/10 p-2 grid place-items-center`}
    aspect-ratio: 1 / 1;
`;

const CarouselImage = styled.img`
    ${tw`max-h-10 w-auto object-contain`}
`;

const DotsContainer = styled.div`
    ${tw`mt-3 flex justify-center gap-1`}
`;

const Dot = styled.span<{ $active: boolean }>`
    ${tw`h-1.5 rounded-full transition-all`}
    ${(props) => (props.$active ? tw`w-6 bg-white` : tw`w-1.5 bg-white/30`)}
`;

const InputGroup = styled.div`
    ${tw`space-y-3 mt-4`}
`;

const Label = styled.label`
    ${tw`block text-sm font-semibold text-neutral-300`}
`;

const ErrorText = styled.p`
    ${tw`mt-2 text-xs text-red-300`}
`;

const CheckboxContainer = styled.div`
    ${tw`flex items-center gap-3 mt-4`}
`;

const CheckboxLabel = styled.label`
    ${tw`text-sm cursor-pointer`}
`;

const TermsLink = styled.button`
    ${tw`underline`}
    text-decoration-style: dotted;
    text-underline-offset: 0.25rem;
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
                    <Label>กรอกลิงก์ซองทรูมันนี่</Label>
                    <Input
                        type='text'
                        placeholder='https://gift.truemoney.com/campaign/?v=xxx'
                        value={giftLink}
                        onChange={(e) => setGiftLink(e.target.value)}
                    />
                    {!giftLink && <ErrorText>กรุณาระบุลิงก์ซองทรูมันนี่</ErrorText>}
                </InputGroup>

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

                <div css={tw`mt-6 flex justify-end`}>
                    <Button
                        type='button'
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        size={'xlarge'}
                        css={tw`inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60`}
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
