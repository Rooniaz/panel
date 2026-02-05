import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import InstallModal from './InstallModal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { httpErrorToHuman } from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCube, faDownload, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import useFlash from '@/plugins/useFlash';
import http from '@/api/http';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import Spinner from '@/components/elements/Spinner';
import { Alert } from '@/components/elements/alert';
import tw from 'twin.macro';

interface Version {
    version_number: string;
    title?: string;
}

interface MajorVersion {
    majorMinor: string;
    versions: Version[];
}

export default () => {
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState<Version[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const { clearFlashes, addError } = useFlash();
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    useEffect(() => {
        clearFlashes();
        getVersions();

        const handleModalClose = () => setSelectedVersion(null);
        window.addEventListener('mcbe:version:close', handleModalClose);

        return () => {
            window.removeEventListener('mcbe:version:close', handleModalClose);
        };
    }, []);

    const getMajorVersions = (versions: Version[]): MajorVersion[] => {
        const grouped = versions.reduce((acc: { [key: string]: Version[] }, version) => {
            const parts = version.version_number.split('.');
            const majorMinor = parts.slice(0, 2).join('.');

            if (!acc[majorMinor]) {
                acc[majorMinor] = [];
            }
            acc[majorMinor].push(version);
            return acc;
        }, {});

        return Object.entries(grouped)
            .map(([majorMinor, versions]) => ({
                majorMinor,
                versions: versions.sort((a, b) =>
                    b.version_number.localeCompare(a.version_number, undefined, { numeric: true })
                ),
            }))
            .sort((a, b) => {
                const [aMajor, aMinor] = a.majorMinor.split('.').map(Number);
                const [bMajor, bMinor] = b.majorMinor.split('.').map(Number);
                if (aMajor !== bMajor) return bMajor - aMajor;
                return bMinor - aMinor;
            });
    };

    const getVersions = () => {
        http.get(`/api/client/servers/${uuid}/mcbe/versions`)
            .then(({ data }) => {
                setVersions(data.versions);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error) });
                setLoading(false);
            });
    };

    const majorVersions = getMajorVersions(versions);

    if (loading) {
        return (
            <ServerContentBlock title={'Minecraft Bedrock Version Manager'} showFlashKey='mcbe:version'>
                <Spinner size={'large'} centered />
            </ServerContentBlock>
        );
    }

    return (
        <ServerContentBlock title={'Minecraft Bedrock Version Manager'} showFlashKey='mcbe:version'>
            <FlashMessageRender />

            <div className='mb-4'>
                <Alert type='info'>
                    <div className='flex items-center'>
                        <p>
                            ควรสำรองข้อมูลของคุณก่อนเปลี่ยนเวอร์ชัน บางเวอร์ชันอาจไม่เข้ากันได้กับข้อมูลโลกปัจจุบันของคุณ
                        </p>
                    </div>
                </Alert>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {majorVersions.map((majorVersion) => (
                    <div
                        key={majorVersion.majorMinor}
                        className='bg-neutral-700 rounded shadow-sm hover:shadow-lg transition-all duration-150 cursor-pointer transform hover:-translate-y-1 hover:bg-neutral-600 group relative'
                        onClick={() => setSelectedVersion(majorVersion.versions[0].version_number)}
                    >
                        <span className='absolute top-2 right-2 text-xs text-neutral-400 font-medium'>
                            เวอร์ชัน
                        </span>
                        <div className='p-4'>
                            <div className='flex items-center'>
                                <div className='w-12 h-12 mr-4 flex items-center justify-center bg-neutral-800 rounded-full'>
                                    <FontAwesomeIcon icon={faCube} className='text-2xl text-blue-400' />
                                </div>
                                <div className='flex-1'>
                                    <h3 className='text-lg font-medium text-neutral-100'>
                                        Version {majorVersion.majorMinor}
                                    </h3>
                                    <p className='text-sm text-neutral-300'>
                                        {majorVersion.versions.length} เวอร์ชัน
                                        {majorVersion.versions.length !== 1 ? '' : ''} พร้อมใช้งาน
                                    </p>
                                </div>
                                <div className='ml-4 text-neutral-300 group-hover:text-blue-400'>
                                    <FontAwesomeIcon icon={faDownload} className='text-lg' />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <InstallModal version={selectedVersion} />
        </ServerContentBlock>
    );
};
