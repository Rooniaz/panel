import React from 'react';
import { FastQueryResponse } from '@/api/server/mcpmanager';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faCircle, faNetworkWired, faCopy } from '@fortawesome/free-solid-svg-icons';
import CopyOnClick from '@/components/elements/CopyOnClick';
interface ServerOverviewProps {
    fastQueryData: FastQueryResponse | null;
    serverStatus: string | null;
}
export const ServerOverview: React.FC<ServerOverviewProps> = ({ fastQueryData, serverStatus }) => {
    const info = fastQueryData?.info;
    const players = fastQueryData?.players;
    const isOnline = serverStatus === 'running' && !!fastQueryData && !fastQueryData.error;
    const motdHtml = { __html: info?.motd?.formatted || 'Server is offline' };
    const serverIp = `${info?.ip || '0.0.0.0'}:${info?.port || '25565'}`;
    const Stat = ({ icon, label, value }: { icon: any; label: string; value: string | number }) => (
        <div tw="bg-neutral-800 p-3 rounded-lg text-center">
            <FontAwesomeIcon icon={icon} tw="text-neutral-300 mb-1" />
            <p tw="text-xs text-neutral-400 uppercase tracking-wider">{label}</p>
            <p tw="text-base font-semibold text-neutral-100">{value}</p>
        </div>
    );
    return (
        <TitledGreyBox title="Server Overview" css={tw`mb-6`}>
            <div css={tw`p-4 space-y-4`}>
                <div tw="bg-neutral-800 p-3 rounded-lg">
                    <div tw="flex items-center justify-between mb-2">
                        <div tw="flex items-center">
                            <FontAwesomeIcon icon={faServer} tw="text-neutral-300 mr-2" />
                            <span tw="text-base font-semibold text-neutral-100">Server Status</span>
                        </div>
                        <div tw="flex items-center">
                            <FontAwesomeIcon
                                icon={faCircle}
                                css={[tw`mr-2 text-xs`, isOnline ? tw`text-green-500 animate-pulse` : tw`text-red-500`]}
                            />
                            <span css={isOnline ? tw`text-green-400` : tw`text-red-400`}>
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                    <CopyOnClick text={serverIp}>
                        <div tw="bg-neutral-900 p-2 rounded flex items-center justify-between cursor-pointer hover:bg-neutral-700 transition-colors duration-200">
                            <div tw="flex items-center">
                                <FontAwesomeIcon icon={faNetworkWired} tw="text-neutral-400 mr-2" />
                                <code tw="text-sm text-neutral-300 font-mono">{serverIp}</code>
                            </div>
                            <FontAwesomeIcon icon={faCopy} tw="text-neutral-500" />
                        </div>
                    </CopyOnClick>
                </div>
                <div
                    css={tw`bg-neutral-900 p-3 rounded-lg text-center text-sm`}
                    dangerouslySetInnerHTML={motdHtml}
                />
                <div css={tw`grid grid-cols-2 gap-4`}>
                    <Stat
                        label="Players"
                        value={`${players?.online?.length || 0} / ${players?.max || 'N/A'}`} icon={undefined} />
                    <Stat
                        label="Version"
                        value={info?.version?.name || 'N/A'} icon={undefined} />
                </div>
            </div>
        </TitledGreyBox>
    );
};
