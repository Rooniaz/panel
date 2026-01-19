import React, { useState, ReactNode } from 'react';
import tw from 'twin.macro';
interface Tab {
    id: string;
    title: string;
    content: ReactNode;
}
interface PlayerDetailsTabsProps {
    tabs: Tab[];
}
const TabButton = tw.button`
    px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out
    border-b-2 focus:outline-none
    [&:not(:disabled)]:hover:bg-neutral-700
`;
const ActiveTabButton = tw(TabButton)`
    border-cyan-400 text-white
`;
const InactiveTabButton = tw(TabButton)`
    border-transparent text-neutral-400
`;
const PlayerDetailsTabs: React.FC<PlayerDetailsTabsProps> = ({ tabs }) => {
    const [activeTab, setActiveTab] = useState(tabs[0].id);
    return (
        <div>
            <div tw="border-b border-neutral-800">
                <nav tw="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            css={[
                                tw`px-4 py-2 text-sm font-medium transition-colors duration-200 ease-in-out border-b-2 focus:outline-none`,
                                activeTab === tab.id ? tw`border-cyan-400 text-white` : tw`border-transparent text-neutral-400 hover:text-white hover:border-gray-300`
                            ]}
                        >
                            {tab.title}
                        </button>
                    ))}
                </nav>
            </div>
            <div tw="mt-6">
                {tabs.map(tab => (
                    <div key={tab.id} css={[activeTab === tab.id ? tw`block` : tw`hidden`]}>
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PlayerDetailsTabs;
