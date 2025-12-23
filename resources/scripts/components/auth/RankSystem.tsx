import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const RankContainer = styled.div`
    ${tw`flex flex-col h-full p-6 md:p-8`}
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
    border-radius: 12px;
`;

const RankItem = styled.div`
    ${tw`flex items-center mb-4 p-3 rounded-lg`}
    background: rgba(255, 255, 255, 0.05);
    transition: all 0.2s;

    &:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateX(4px);
    }
`;

interface Rank {
    name: string;
    icon: string;
    accumulated: number;
    bonus: string;
    color: string;
}

const ranks: Rank[] = [
    { name: 'COAL', icon: '⚫', accumulated: 250, bonus: '+2%', color: '#555555' },
    { name: 'COPPER', icon: '🟠', accumulated: 500, bonus: '+4%', color: '#B87333' },
    { name: 'LAPIS', icon: '🔵', accumulated: 1000, bonus: '+6%', color: '#4166F5' },
    { name: 'REDSTONE', icon: '🔴', accumulated: 2500, bonus: '+8%', color: '#AA0F01' },
    { name: 'IRON', icon: '⚪', accumulated: 5000, bonus: '+10%', color: '#C0C0C0' },
    { name: 'GOLD', icon: '🟡', accumulated: 10000, bonus: '+15%', color: '#FFD700' },
    { name: 'EMERALD', icon: '💚', accumulated: 20000, bonus: '+25%', color: '#50C878' },
    { name: 'DIAMOND', icon: '💎', accumulated: 30000, bonus: '+50%', color: '#B9F2FF' },
];

const RankSystem: React.FC = () => {
    return (
        <RankContainer>
            <div css={tw`mb-6`}>
                <h2 css={tw`text-2xl md:text-3xl font-bold text-white mb-2`}>เติมเครดิต ยิ่งสะสม ยิ่งคุ้ม</h2>
                <div css={tw`text-xl font-semibold text-blue-400 mb-1`}>TOP UP CREDITS</div>
                <div css={tw`text-lg text-white`}>MineLan</div>
            </div>

            <div css={tw`mb-4 p-3 rounded-lg bg-blue-500 bg-opacity-20 border border-blue-400 border-opacity-30`}>
                <div css={tw`text-sm text-blue-300`}>เติมปกติ 1 ฿ : 1 credit</div>
            </div>

            <div css={tw`flex-1 overflow-y-auto`}>
                <div css={tw`text-sm text-neutral-400 mb-3 font-semibold uppercase tracking-wide`}>ระบบ Rank</div>
                {ranks.map((rank, index) => (
                    <RankItem key={index}>
                        <div css={tw`text-2xl mr-3`}>{rank.icon}</div>
                        <div css={tw`flex-1`}>
                            <div css={tw`flex items-center justify-between`}>
                                <span css={tw`font-semibold text-white`} style={{ color: rank.color }}>
                                    {rank.name}
                                </span>
                                <span css={tw`text-green-400 font-bold ml-2`}>{rank.bonus}</span>
                            </div>
                            <div css={tw`text-xs text-neutral-400 mt-1`}>
                                Accumulated: {rank.accumulated.toLocaleString()} ฿
                            </div>
                            <div css={tw`text-xs text-blue-300`}>Bonus received: {rank.bonus}</div>
                        </div>
                    </RankItem>
                ))}
            </div>

            <div css={tw`mt-6 pt-4 border-t border-neutral-600`}>
                <a
                    href='https://discord.minelan.in.th'
                    target='_blank'
                    rel='noopener noreferrer'
                    css={tw`flex items-center text-blue-400 hover:text-blue-300 transition-colors`}
                >
                    <svg css={tw`w-5 h-5 mr-2`} fill='currentColor' viewBox='0 0 24 24'>
                        <path d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2518-.1918.3717-.2894a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.0976.246.1951.3728.2894a.077.077 0 01-.0066.1276c-.598.3428-1.2195.6447-1.8723.8933a.0766.0766 0 00-.0406.1057c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z' />
                    </svg>
                    <span css={tw`font-semibold`}>DISCORD.MINELAN.IN.TH</span>
                </a>
            </div>
        </RankContainer>
    );
};

export default RankSystem;
