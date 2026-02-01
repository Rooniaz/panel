import styled, { keyframes } from 'styled-components/macro';
import tw from 'twin.macro';

/* Animation แสงสีฟ้าวิบวับ */
const bluePulse = keyframes`
    0%, 100% { box-shadow: 0 0 15px rgba(14, 165, 233, 0.4), inset 0 0 0 1px rgba(255,255,255,0.2); }
    50% { box-shadow: 0 0 25px rgba(59, 130, 246, 0.6), inset 0 0 0 1px rgba(255,255,255,0.5); }
`;

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto border-b border-white/5 backdrop-blur-md`};
    background: #0f172a; /* Dark Blue Background */
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);

    & > div {
        ${tw`flex items-center text-sm px-4 py-3 gap-2`};

        a {
            /* ปรับเป็น rounded-lg (สี่เหลี่ยมมน) แทน rounded-full */
            ${tw`relative inline-flex items-center justify-center h-10 px-5 rounded-lg no-underline whitespace-nowrap transition-all duration-200`};
            
            /* แก้ไข Error: เปลี่ยนจาก text-slate-400 เป็น text-gray-400 ซึ่งมีในทุกระบบ */
            ${tw`text-gray-400 font-medium border border-transparent`};
            
            /* พื้นหลังปกติแบบจางๆ */
            background: rgba(255, 255, 255, 0.03);
            
            &:hover:not(.active) {
                ${tw`text-white`};
                background: rgba(255, 255, 255, 0.08);
                transform: translateY(-1px);
            }

            /* Active State: สีฟ้า Ocean เต็มช่อง */
            &.active {
                ${tw`text-white font-bold`};
                
                /* Gradient ฟ้า Sky -> น้ำเงิน Blue */
                background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
                
                /* เงาสีฟ้า Glow */
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
                
                transform: translateY(-1px);
                animation: ${bluePulse} 3s infinite;

                /* เส้นขอบบนจางๆ เพิ่มมิติ */
                border-top: 1px solid rgba(255,255,255,0.2);
            }

            span {
                ${tw`relative z-10`};
            }

            svg {
                ${tw`relative z-10 mr-2 w-4 h-4`};
            }
        }
    }

    /* Scrollbar Styling (Blue Theme) */
    &::-webkit-scrollbar { height: 4px; }
    &::-webkit-scrollbar-thumb { 
        background: rgba(56, 189, 248, 0.2); 
        border-radius: 4px; 
    }
    &:hover::-webkit-scrollbar-thumb {
        background: rgba(56, 189, 248, 0.4); 
    }
`;

export default SubNavigation;