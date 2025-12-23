import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faInfoCircle,
    faBan,
    faExclamationTriangle,
    faCoins,
    faHourglass,
    faBullhorn,
    faFileAlt,
} from '@fortawesome/free-solid-svg-icons';
import Modal from '@/components/elements/Modal';

const ModalContent = styled.div`
    ${tw`max-w-md mx-auto bg-neutral-800 rounded-xl p-6 space-y-6`}
    max-height: 80vh;
    overflow-y: auto;

    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05);
`;

const Title = styled.h2`
    ${tw`text-2xl font-bold text-white mb-6 flex items-center space-x-3`}
`;

const TitleIcon = styled.div`
    ${tw`w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white`}
`;

const TermsList = styled.div`
    ${tw`space-y-6`}
`;

const TermSection = styled.div`
    ${tw`space-y-3`}
`;

const SectionHeader = styled.div`
    ${tw`flex items-center space-x-3 mb-2`}
`;

const SectionNumber = styled.div<{ $color?: string }>`
    ${tw`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
    ${(props) => {
        if (props.$color === 'green') return tw`bg-green-500`;
        if (props.$color === 'red') return tw`bg-red-500`;
        if (props.$color === 'yellow') return tw`bg-yellow-500`;
        return tw`bg-blue-500`;
    }}
`;

const SectionTitle = styled.h3`
    ${tw`text-lg font-bold text-white`}
`;

const SectionIcon = styled.div`
    ${tw`w-6 h-6 flex items-center justify-center`}
`;

const BulletList = styled.ul`
    ${tw`space-y-2 text-neutral-300 text-sm ml-11`}
`;

const BulletItem = styled.li`
    ${tw`list-disc`}
`;

const NoteSection = styled.div`
    ${tw`bg-blue-500/20 border-l-4 border-blue-500 p-4 rounded`}
`;

const NoteHeader = styled.div`
    ${tw`flex items-center space-x-2 mb-2`}
`;

const NoteText = styled.p`
    ${tw`text-blue-200 text-sm`}
`;

const CloseButton = styled.button`
    ${tw`w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-colors`}
`;

interface Props {
    onClose: () => void;
}

export default ({ onClose }: Props) => {
    return (
        <Modal visible={true} onDismissed={onClose} appear>
            <ModalContent>
                <Title>
                    <TitleIcon>
                        <FontAwesomeIcon icon={faFileAlt} />
                    </TitleIcon>
                    <span>ข้อกำหนดและเงื่อนไข</span>
                </Title>

                <TermsList>
                    <TermSection>
                        <SectionHeader>
                            <SectionNumber>1</SectionNumber>
                            <SectionTitle>การยอมรับเงื่อนไข</SectionTitle>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                เมื่อคุณลงทะเบียนหรือเข้าใช้งานเว็บไซต์นี้
                                ถือว่าคุณตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขที่เกี่ยวข้องทั้งหมด
                            </BulletItem>
                            <BulletItem>
                                เนื้อหาทั้งหมดบนเว็บไซต์ได้รับความคุ้มครองตามกฎหมายลิขสิทธิ์และเครื่องหมายการค้า
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber>2</SectionNumber>
                            <SectionTitle>ความรับผิดชอบของผู้ใช้งาน</SectionTitle>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                ผู้ใช้ต้องเก็บรักษาข้อมูลเข้าสู่ระบบ เช่น รหัสผ่าน และชื่อผู้ใช้ไว้เป็นความลับ
                            </BulletItem>
                            <BulletItem>
                                หากบุคคลที่สามใช้บัญชีของคุณ ผู้ใช้จะเป็นผู้รับผิดชอบต่อการกระทำนั้นทั้งหมด
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber $color='green'>3</SectionNumber>
                            <SectionTitle>การใช้งานที่ถูกต้อง</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faCheckCircle} className={'text-green-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                ห้ามใช้เว็บไซต์ในทางที่ผิดกฎหมาย หรือขัดต่อข้อตกลงนี้และกฎหมายในประเทศของคุณ
                            </BulletItem>
                            <BulletItem>
                                ห้ามนำเนื้อหาหรือโค้ดจากเว็บไซต์ไปใช้ในลักษณะที่เป็นการแข่งขัน
                                หรือเพื่อสร้างระบบที่คล้ายกันโดยไม่ได้รับอนุญาต
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber>4</SectionNumber>
                            <SectionTitle>ความถูกต้องของข้อมูล</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faInfoCircle} className={'text-blue-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                ผู้ใช้ต้องให้ข้อมูลที่เป็นจริงและถูกต้องทุกครั้งที่ลงทะเบียนหรือทำธุรกรรมบนเว็บไซต์
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber $color='red'>5</SectionNumber>
                            <SectionTitle>การละเมิดและบทลงโทษ</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faBan} className={'text-red-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                หากลูกค้าละเมิดข้อกำหนดใด และไม่แก้ไขภายใน 3 วันหลังจากได้รับแจ้ง
                                ทางเราขอสงวนสิทธิ์ในการยกเลิกบัญชีหรือบริการโดยไม่ต้องแจ้งให้ทราบล่วงหน้า
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber $color='red'>6</SectionNumber>
                            <SectionTitle>ข้อห้ามในการเผยแพร่/อัปโหลด</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faBan} className={'text-red-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                ห้ามเผยแพร่หรืออัปโหลดเนื้อหาที่ละเมิดลิขสิทธิ์, ผิดกฎหมาย, หรือได้มาโดยไม่ชอบด้วยกฎหมาย
                            </BulletItem>
                            <BulletItem>
                                ห้ามกระทำการที่ส่งผลกระทบต่อผู้ใช้คนอื่น หรือก่อให้เกิดความเสียหายแก่ระบบ
                            </BulletItem>
                            <BulletItem>
                                ห้ามอัปโหลดไวรัส โทรจัน หรือไฟล์ที่มีเจตนาไม่ดีตาม พ.ร.บ. คอมพิวเตอร์
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber $color='yellow'>7</SectionNumber>
                            <SectionTitle>ความรับผิดชอบของผู้ให้บริการ</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faExclamationTriangle} className={'text-yellow-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                หากเกิดปัญหาจากซอฟต์แวร์หรือปลั๊กอินของบุคคลที่สาม ที่ไม่ได้ติดตั้งโดยเรา
                                ทางเราจะไม่รับผิดชอบในทุกกรณี
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber>8</SectionNumber>
                            <SectionTitle>การเติมเงินและการคืนเงิน</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faCoins} className={'text-green-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                เมื่อเติมเงินเข้าระบบแล้วจะไม่สามารถขอคืนเงินได้ทุกกรณี กรุณาตรวจสอบข้อมูลก่อนทำธุรกรรม
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber>9</SectionNumber>
                            <SectionTitle>การหมดอายุของเซิร์ฟเวอร์</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faHourglass} className={'text-blue-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                เมื่อเซิร์ฟเวอร์หมดอายุ
                                ลูกค้าจะต้องทำการเติมเครดิตให้เพียงพอสำหรับการต่ออายุแบบอัตโนมัติภายในเวลา 12
                                ชั่วโมงนับตั้งแต่เวลาที่หมดอายุ
                                ทางเราจะไม่รับผิดชอบต่อการสูญหายของข้อมูลหรือการสูญหายของเซิร์ฟเวอร์หากลูกค้าไม่ทำการต่ออายุภายในเวลาที่กำหนด
                            </BulletItem>
                        </BulletList>
                    </TermSection>

                    <TermSection>
                        <SectionHeader>
                            <SectionNumber>10</SectionNumber>
                            <SectionTitle>การเปลี่ยนแปลงข้อตกลง</SectionTitle>
                            <SectionIcon>
                                <FontAwesomeIcon icon={faBullhorn} className={'text-red-400'} />
                            </SectionIcon>
                        </SectionHeader>
                        <BulletList>
                            <BulletItem>
                                ผู้ให้บริการขอสงวนสิทธิ์ในการแก้ไข เปลี่ยนแปลง หรือยกเลิกรายละเอียดบริการ เงื่อนไข ราคา
                                หรือแพ็กเกจต่างๆ ได้ทุกเมื่อโดยไม่ต้องแจ้งล่วงหน้า
                            </BulletItem>
                        </BulletList>
                    </TermSection>
                </TermsList>

                <NoteSection>
                    <NoteHeader>
                        <FontAwesomeIcon icon={faFileAlt} className={'text-blue-400'} />
                        <span className={'text-blue-200 font-semibold'}>หมายเหตุ</span>
                    </NoteHeader>
                    <NoteText>
                        โปรดอ่านข้อกำหนดข้างต้นให้เข้าใจ ก่อนใช้งานบริการทุกครั้ง เพื่อป้องกันความเข้าใจผิดในอนาคต
                        หากมีข้อสงสัยสามารถติดต่อทีมงานได้ทุกช่องทาง
                    </NoteText>
                </NoteSection>

                <CloseButton onClick={onClose}>ปิดหน้าต่าง</CloseButton>
            </ModalContent>
        </Modal>
    );
};
