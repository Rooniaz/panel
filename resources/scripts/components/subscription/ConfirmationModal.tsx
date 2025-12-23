import React, { useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faInfoCircle, faFolder } from '@fortawesome/free-solid-svg-icons';
import { SubscriptionPlan } from './SubscriptionContainer';
import Switch from '@/components/elements/Switch';

const Overlay = styled.div`
    ${tw`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center`}
`;

const ModalContainer = styled.div`
    ${tw`bg-neutral-800 rounded-lg shadow-xl max-w-md w-full mx-4 relative`}
`;

const ModalHeader = styled.div`
    ${tw`flex items-center justify-between p-6 border-b border-neutral-700`}
`;

const HeaderLeft = styled.div`
    ${tw`flex items-center space-x-3`}
`;

const HeaderIcon = styled.div`
    ${tw`w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white`}
`;

const HeaderTitle = styled.h2`
    ${tw`text-xl font-bold text-white`}
`;

const CloseButton = styled.button`
    ${tw`text-neutral-400 hover:text-white transition-colors`}
`;

const ModalBody = styled.div`
    ${tw`p-6`}
`;

const PlanInfo = styled.div`
    ${tw`mb-6`}
`;

const PlanName = styled.p`
    ${tw`text-white font-semibold mb-2`}
`;

const PlanPrice = styled.p`
    ${tw`text-neutral-400`}
`;

const Divider = styled.div`
    ${tw`border-t border-neutral-700 my-6`}
`;

const TermsSection = styled.div`
    ${tw`mb-6`}
`;

const TermsHeader = styled.div`
    ${tw`flex items-center space-x-2 mb-4`}
`;

const TermsTitle = styled.h3`
    ${tw`text-white font-semibold`}
`;

const TermsText = styled.div`
    ${tw`text-neutral-300 text-sm leading-relaxed space-y-2`}
`;

const TermsParagraph = styled.p`
    ${tw`mb-2`}
`;

const CheckboxContainer = styled.div`
    ${tw`flex items-center space-x-3 mb-6`}
`;

const CheckboxLabel = styled.label`
    ${tw`text-neutral-300 text-sm cursor-pointer`}
`;

const ModalFooter = styled.div`
    ${tw`flex items-center justify-end space-x-3 p-6 border-t border-neutral-700`}
`;

const Button = styled.button<{ $primary?: boolean; disabled?: boolean }>`
    ${tw`px-6 py-2 rounded-lg font-semibold transition-colors`}
    ${(props) => {
        if (props.disabled) return tw`opacity-50 cursor-not-allowed`;
        if (props.$primary) return tw`bg-red-700 text-white hover:bg-red-800`;
        return tw`bg-neutral-700 text-white hover:bg-neutral-600`;
    }}
`;

interface Props {
    plan: SubscriptionPlan;
    onConfirm: () => void;
    onCancel: () => void;
}

export default ({ plan, onConfirm, onCancel }: Props) => {
    const [accepted, setAccepted] = useState(false);

    return (
        <Overlay onClick={onCancel}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <HeaderLeft>
                        <HeaderIcon>
                            <FontAwesomeIcon icon={faFolder} />
                        </HeaderIcon>
                        <HeaderTitle>ยืนยันการสมัครสมาชิก</HeaderTitle>
                    </HeaderLeft>
                    <CloseButton onClick={onCancel}>
                        <FontAwesomeIcon icon={faTimes} />
                    </CloseButton>
                </ModalHeader>

                <ModalBody>
                    <PlanInfo>
                        <PlanName>คุณกำลังจะสมัครสมาชิก {plan.name}</PlanName>
                        <PlanPrice>ราคา: {plan.price} Credits / เดือน</PlanPrice>
                    </PlanInfo>

                    <Divider />

                    <TermsSection>
                        <TermsHeader>
                            <FontAwesomeIcon icon={faInfoCircle} className={'text-blue-400'} />
                            <TermsTitle>ข้อกำหนดและเงื่อนไข</TermsTitle>
                        </TermsHeader>
                        <TermsText>
                            <TermsParagraph>
                                <strong>เมื่อสมัครสมาชิกแล้วจะไม่มีการคืนเงินไม่ว่ากรณีใด ๆ ก็ตาม</strong>{' '}
                                อีกทั้งจะมีการต่ออายุแบบอัตโนมัติเมื่อถึงวันที่หมดอายุ
                            </TermsParagraph>
                            <TermsParagraph>
                                และการยกเลิกการสมัครสมาชิกหมายถึง{' '}
                                <strong>การยกเลิกการต่ออายุแบบอัตโนมัติเมื่อถึงวันที่หมดอายุ</strong>
                                ของรอบการสมัครสมาชิก
                            </TermsParagraph>
                            <TermsParagraph>
                                <strong>การยกเลิกการสมัครสมาชิก จะยังได้รับสิทธิพิเศษต่าง ๆ ต่อ</strong>
                                จนกว่าจะถึงวันหมดอายุในรอบปัจจุบัน
                            </TermsParagraph>
                        </TermsText>
                    </TermsSection>

                    <CheckboxContainer>
                        <Switch
                            name='accept-terms'
                            defaultChecked={accepted}
                            onChange={(e) => {
                                setAccepted(e.target.checked);
                            }}
                        />
                        <CheckboxLabel htmlFor='accept-terms'>
                            ฉันได้อ่านและยอมรับ ข้อกำหนดและเงื่อนไขข้างต้น
                        </CheckboxLabel>
                    </CheckboxContainer>
                </ModalBody>

                <ModalFooter>
                    <Button onClick={onCancel}>ยกเลิก</Button>
                    <Button $primary onClick={onConfirm} disabled={!accepted}>
                        ยืนยันการสมัครสมาชิก
                    </Button>
                </ModalFooter>
            </ModalContainer>
        </Overlay>
    );
};
