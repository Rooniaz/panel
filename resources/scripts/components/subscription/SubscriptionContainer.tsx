import React, { useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCrown, faCheck, faAward } from '@fortawesome/free-solid-svg-icons';
import ConfirmationModal from './ConfirmationModal';

const Container = styled.div`
    ${tw`flex items-center justify-center relative lg:ml-64 lg:mt-8`}
`;

const HeaderSection = styled.div`
    ${tw`text-center mb-12`}
`;

const Title = styled.h1`
    ${tw`text-4xl font-bold text-white mb-4`}
`;

const Subtitle = styled.p`
    ${tw`text-xl text-neutral-400`}
`;

const PlansGrid = styled.div`
    ${tw`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto`}
`;

const PlanCard = styled.div<{ $isRecommended?: boolean }>`
    ${tw`relative rounded-lg p-8 bg-neutral-800 border-2 transition-all duration-300`}
    ${(props) =>
        props.$isRecommended ? tw`border-yellow-500 shadow-lg` : tw`border-neutral-700 hover:border-blue-500`}
    background: linear-gradient(135deg, rgba(30, 30, 30, 0.9) 0%, rgba(20, 20, 20, 0.9) 100%);
    ${(props) =>
        props.$isRecommended
            ? 'box-shadow: 0 10px 15px -3px rgba(234, 179, 8, 0.5), 0 4px 6px -2px rgba(234, 179, 8, 0.3);'
            : ''}
`;

const RecommendedBadge = styled.div`
    ${tw`absolute -top-4 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-purple-500 text-white text-xs font-semibold rounded-full`}
`;

const PlanIcon = styled.div<{ $isRecommended?: boolean }>`
    ${tw`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mb-4 mx-auto`}
    ${(props) =>
        props.$isRecommended ? 'background: linear-gradient(135deg, #eab308 0%, #a855f7 100%);' : tw`bg-blue-500`}
`;

const PlanName = styled.h2`
    ${tw`text-2xl font-bold text-white text-center mb-2`}
`;

const PlanDescription = styled.p`
    ${tw`text-neutral-400 text-center mb-6 text-sm`}
`;

const PriceSection = styled.div`
    ${tw`text-center mb-6`}
`;

const Price = styled.div`
    ${tw`text-5xl font-bold text-white mb-2`}
`;

const PriceUnit = styled.div`
    ${tw`text-neutral-400 text-sm`}
`;

const FeaturesList = styled.ul`
    ${tw`space-y-3 mb-8`}
`;

const FeatureItem = styled.li`
    ${tw`flex items-start space-x-3 text-neutral-300`}
`;

const CheckIcon = styled.div`
    ${tw`w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5`}
`;

const SubscribeButton = styled.button<{ $isRecommended?: boolean }>`
    ${tw`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300`}
    ${(props) =>
        props.$isRecommended
            ? 'background: linear-gradient(135deg, #eab308 0%, #a855f7 100%); color: white;'
            : tw`bg-blue-500 text-white hover:bg-blue-600`}
`;

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    icon: any;
    features: string[];
    isRecommended?: boolean;
}

const plans: SubscriptionPlan[] = [
    {
        id: 'plus',
        name: 'MineLan Plus',
        description: 'แพ็กเกจระดับเริ่มต้นพร้อมสิทธิพิเศษ',
        price: 59,
        icon: faStar,
        features: [
            'Server หมดอายุเก็บต่อได้ 24 ชั่วโมง (ปกติ 12 ชั่วโมง)',
            'Smart Addons Uploader 5 ครั้ง',
            'น้องมาย AI วิเคราะห์ Log จาก Console',
        ],
    },
    {
        id: 'pro',
        name: 'MineLan Pro',
        description: 'แพ็กเกจระดับกลางพร้อมสิทธิพิเศษเพิ่มเติม',
        price: 79,
        icon: faCrown,
        features: [
            'Server หมดอายุเก็บต่อได้ 24 ชั่วโมง',
            'Smart Addons Uploader 15 ครั้ง',
            'หลังจากจำนวนครั้ง Smart Addons Uploader หมด ชำระ 8 Credits/ครั้ง',
            'ฟีเจอร์สำหรับจัดการ Addon ที่ติดตั้งแล้ว',
            'น้องมาย AI วิเคราะห์ Log จาก Console',
        ],
    },
    {
        id: 'ultra',
        name: 'MineLan Ultra',
        description: 'แพ็กเกจระดับสูงสุดพร้อมสิทธิเหนือระดับ',
        price: 159,
        icon: faAward,
        features: [
            'Server หมดอายุเก็บต่อได้ 36 ชั่วโมง',
            'Smart Addons Uploader 50 ครั้ง',
            'หลังจากจำนวนครั้ง Smart Addons Uploader หมด ชำระ 5 Credits/ครั้ง',
            'ฟีเจอร์สำหรับจัดการ Addon ที่ติดตั้งแล้ว',
            'น้องมาย AI วิเคราะห์ Log จาก Console',
        ],
        isRecommended: true,
    },
];

export default () => {
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleSubscribe = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setShowModal(true);
    };

    const handleConfirm = () => {
        // TODO: Implement subscription API call
        console.log('Subscribing to:', selectedPlan);
        setShowModal(false);
        setSelectedPlan(null);
    };

    const handleCancel = () => {
        setShowModal(false);
        setSelectedPlan(null);
    };

    return (
        <Container>
            <div css={tw`max-w-6xl mx-auto px-4`}>
                <HeaderSection>
                    <Title>เลือกแพ็กเกจที่เหมาะกับคุณ</Title>
                    <Subtitle>อัปเกรดเพื่อรับสิทธิพิเศษและประสิทธิภาพที่มากขึ้น</Subtitle>
                </HeaderSection>

                <PlansGrid>
                    {plans.map((plan) => (
                        <PlanCard key={plan.id} $isRecommended={plan.isRecommended}>
                            {plan.isRecommended && <RecommendedBadge>แนะนำ</RecommendedBadge>}
                            <PlanIcon $isRecommended={plan.isRecommended}>
                                <FontAwesomeIcon icon={plan.icon} />
                            </PlanIcon>
                            <PlanName>{plan.name}</PlanName>
                            <PlanDescription>{plan.description}</PlanDescription>
                            <PriceSection>
                                <Price>{plan.price}</Price>
                                <PriceUnit>Credits / เดือน</PriceUnit>
                            </PriceSection>
                            <FeaturesList>
                                {plan.features.map((feature, index) => (
                                    <FeatureItem key={index}>
                                        <CheckIcon>
                                            <FontAwesomeIcon icon={faCheck} className={'text-xs text-white'} />
                                        </CheckIcon>
                                        <span>{feature}</span>
                                    </FeatureItem>
                                ))}
                            </FeaturesList>
                            <SubscribeButton $isRecommended={plan.isRecommended} onClick={() => handleSubscribe(plan)}>
                                สมัครสมาชิก
                            </SubscribeButton>
                        </PlanCard>
                    ))}
                </PlansGrid>

                {showModal && selectedPlan && (
                    <ConfirmationModal plan={selectedPlan} onConfirm={handleConfirm} onCancel={handleCancel} />
                )}
            </div>
        </Container>
    );
};
