import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto`};
    background: #0b1220;
    ${tw`border-b border-white/5 backdrop-blur`};

    & > div {
        ${tw`flex items-center text-sm px-3 py-2 gap-2`};

        & > a,
        & > div {
            ${tw`inline-flex items-center h-10 px-4 rounded-full no-underline whitespace-nowrap transition-all duration-150`};
            ${tw`text-white/80 bg-white/5 border border-white/10`};

            &:hover {
                ${tw`text-white bg-white/10 border-white/20`};
            }

            &:active,
            &.active {
                ${tw`text-white`};
                background: linear-gradient(
                    90deg,
                    ${theme`colors.cyan.400`.toString()},
                    ${theme`colors.indigo.500`.toString()}
                );
                ${tw`border-transparent shadow-[0_10px_30px_rgba(56,189,248,0.25)]`};
            }
        }
    }
`;

export default SubNavigation;
