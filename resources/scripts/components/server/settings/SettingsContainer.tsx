import React, { useEffect, useState } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import DeleteServerBox from '@/components/server/settings/DeleteServerBox';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';
import AllocationRow from '@/components/server/network/AllocationRow';
import ButtonElement from '@/components/elements/Button';
import createServerAllocation from '@/api/server/network/createServerAllocation';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Spinner from '@/components/elements/Spinner';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import { useFlashKey } from '@/plugins/useFlash';
import VariableBox from '@/components/server/startup/VariableBox';
import getServerStartup from '@/api/swr/getServerStartup';
import Select from '@/components/elements/Select';
import InputSpinner from '@/components/elements/InputSpinner';
import setSelectedDockerImage from '@/api/server/setSelectedDockerImage';
import useFlash from '@/plugins/useFlash';
import { ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);
    
    // Network/Allocation state
    const [loading, setLoading] = useState(false);
    const allocationLimit = ServerContext.useStoreState((state) => state.server.data!.featureLimits.allocations);
    const allocations = ServerContext.useStoreState((state) => state.server.data!.allocations, isEqual);
    const setServerFromState = ServerContext.useStoreActions((actions) => actions.server.setServerFromState);
    
    const { clearFlashes: clearNetworkFlashes, clearAndAddHttpError: clearAndAddNetworkError } = useFlashKey('server:network');
    const { data: allocationData, error: allocationError, mutate: mutateAllocations } = getServerAllocations();
    
    useEffect(() => {
        mutateAllocations(allocations);
    }, []);
    
    useEffect(() => {
        clearAndAddNetworkError(allocationError);
    }, [allocationError]);
    
    useDeepCompareEffect(() => {
        if (!allocationData) return;
        setServerFromState((state) => ({ ...state, allocations: allocationData }));
    }, [allocationData]);
    
    const onCreateAllocation = () => {
        clearNetworkFlashes();
        setLoading(true);
        createServerAllocation(uuid)
            .then((allocation) => {
                setServerFromState((s) => ({ ...s, allocations: s.allocations.concat(allocation) }));
                return mutateAllocations(allocationData?.concat(allocation), false);
            })
            .catch((error) => clearAndAddNetworkError(error))
            .then(() => setLoading(false));
    };

    // Startup state
    const [startupLoading, setStartupLoading] = useState(false);
    const { clearFlashes: clearStartupFlashes, clearAndAddHttpError: clearAndAddStartupError } = useFlash();
    const variables = ServerContext.useStoreState(
        ({ server }) => ({
            variables: server.data!.variables,
            invocation: server.data!.invocation,
            dockerImage: server.data!.dockerImage,
        }),
        isEqual
    );

    const { data: startupData, error: startupError, isValidating: startupValidating, mutate: mutateStartup } = getServerStartup(uuid, {
        ...variables,
        dockerImages: { [variables.dockerImage]: variables.dockerImage },
    });

    const isCustomImage =
        startupData &&
        !Object.values(startupData.dockerImages)
            .map((v) => v.toLowerCase())
            .includes(variables.dockerImage.toLowerCase());

    useEffect(() => {
        if (startupData) {
            mutateStartup();
        }
    }, []);

    useDeepCompareEffect(() => {
        if (!startupData) return;
        setServerFromState((s) => ({
            ...s,
            invocation: startupData.invocation,
            variables: startupData.variables,
        }));
    }, [startupData]);

    const updateSelectedDockerImage = (v: React.ChangeEvent<HTMLSelectElement>) => {
        setStartupLoading(true);
        clearStartupFlashes('startup:image');

        const image = v.currentTarget.value;
        setSelectedDockerImage(uuid, image)
            .then(() => setServerFromState((s) => ({ ...s, dockerImage: image })))
            .catch((error) => {
                console.error(error);
                clearAndAddStartupError({ key: 'startup:image', error });
            })
            .then(() => setStartupLoading(false));
    };

    return (
        <ServerContentBlock title={'Settings'} showFlashKey={'settings'}>
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            <FlashMessageRender byKey={'server:network'} css={tw`mb-4`} />
            <FlashMessageRender byKey={'startup:image'} css={tw`mb-4`} />
            <div css={tw`md:flex`}>
                <div css={tw`w-full md:flex-1 md:mr-10`}>
                    <Can action={'file.sftp'}>
                        <TitledGreyBox title={'SFTP Details'} css={tw`mb-6 md:mb-10`}>
                            <div>
                                <Label>Server Address</Label>
                                <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                    <Input type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly />
                                </CopyOnClick>
                            </div>
                            <div css={tw`mt-6`}>
                                <Label>Username</Label>
                                <CopyOnClick text={`${username}.${id}`}>
                                    <Input type={'text'} value={`${username}.${id}`} readOnly />
                                </CopyOnClick>
                            </div>
                            <div css={tw`mt-6 flex items-center`}>
                                <div css={tw`flex-1`}>
                                    <div css={tw`border-l-4 border-cyan-500 p-3`}>
                                        <p css={tw`text-xs text-neutral-200`}>
                                            Your SFTP password is the same as the password you use to access this panel.
                                        </p>
                                    </div>
                                </div>
                                <div css={tw`ml-4`}>
                                    <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                        <Button.Text variant={Button.Variants.Secondary}>Launch SFTP</Button.Text>
                                    </a>
                                </div>
                            </div>
                        </TitledGreyBox>
                    </Can>
                    <TitledGreyBox title={'Debug Information'} css={tw`mb-6 md:mb-10`}>
                        <div css={tw`flex items-center justify-between text-sm`}>
                            <p>Node</p>
                            <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{node}</code>
                        </div>
                        <CopyOnClick text={uuid}>
                            <div css={tw`flex items-center justify-between mt-2 text-sm`}>
                                <p>Server ID</p>
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{uuid}</code>
                            </div>
                        </CopyOnClick>
                    </TitledGreyBox>
                </div>
                <div css={tw`w-full mt-6 md:flex-1 md:mt-0`}>
                    <Can action={'settings.rename'}>
                        <div css={tw`mb-6 md:mb-10`}>
                            <RenameServerBox />
                        </div>
                    </Can>
                    <Can action={'settings.reinstall'}>
                        <ReinstallServerBox />
                    </Can>
                    <div css={tw`mt-6 md:mt-10`}>
                        <DeleteServerBox />
                    </div>
                </div>
            </div>
            
            {/* Network/Allocations Section */}
            <TitledGreyBox title={'Network Allocations'} css={tw`mt-6 md:mt-10`}>
                {!allocationData ? (
                    <Spinner size={'large'} centered />
                ) : (
                    <>
                        {allocationData.map((allocation) => (
                            <AllocationRow key={`${allocation.ip}:${allocation.port}`} allocation={allocation} />
                        ))}
                        {allocationLimit > 0 && (
                            <Can action={'allocation.create'}>
                                <SpinnerOverlay visible={loading} />
                                <div css={tw`mt-6 sm:flex items-center justify-end`}>
                                    <p css={tw`text-sm text-neutral-300 mb-4 sm:mr-6 sm:mb-0`}>
                                        You are currently using {allocationData.length} of {allocationLimit} allowed allocations for
                                        this server.
                                    </p>
                                    {allocationLimit > allocationData.length && (
                                        <ButtonElement css={tw`w-full sm:w-auto`} color={'primary'} onClick={onCreateAllocation}>
                                            Create Allocation
                                        </ButtonElement>
                                    )}
                                </div>
                            </Can>
                        )}
                    </>
                )}
            </TitledGreyBox>

            {/* Startup Section */}
            {!startupData ? (
                !startupError || (startupError && startupValidating) ? (
                    <Spinner centered size={Spinner.Size.LARGE} css={tw`mt-6 md:mt-10`} />
                ) : (
                    <ServerError title={'Oops!'} message={httpErrorToHuman(startupError)} onRetry={() => mutateStartup()} />
                )
            ) : (
                <>
                    <div css={tw`md:flex mt-6 md:mt-10`}>
                        <TitledGreyBox title={'Startup Command'} css={tw`flex-1`}>
                            <div css={tw`px-1 py-2`}>
                                <p css={tw`font-mono bg-neutral-900 rounded py-2 px-4`}>{startupData.invocation}</p>
                            </div>
                        </TitledGreyBox>
                        <TitledGreyBox title={'Docker Image'} css={tw`flex-1 lg:flex-none lg:w-1/3 mt-8 md:mt-0 md:ml-10`}>
                            {Object.keys(startupData.dockerImages).length > 1 && !isCustomImage ? (
                                <>
                                    <InputSpinner visible={startupLoading}>
                                        <Select
                                            disabled={Object.keys(startupData.dockerImages).length < 2}
                                            onChange={updateSelectedDockerImage}
                                            defaultValue={variables.dockerImage}
                                        >
                                            {Object.keys(startupData.dockerImages).map((key) => (
                                                <option key={startupData.dockerImages[key]} value={startupData.dockerImages[key]}>
                                                    {key}
                                                </option>
                                            ))}
                                        </Select>
                                    </InputSpinner>
                                    <p css={tw`text-xs text-neutral-300 mt-2`}>
                                        This is an advanced feature allowing you to select a Docker image to use when running
                                        this server instance.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Input disabled readOnly value={variables.dockerImage} />
                                    {isCustomImage && (
                                        <p css={tw`text-xs text-neutral-300 mt-2`}>
                                            This {"server's"} Docker image has been manually set by an administrator and cannot
                                            be changed through this UI.
                                        </p>
                                    )}
                                </>
                            )}
                        </TitledGreyBox>
                    </div>
                    <h3 css={tw`mt-8 mb-2 text-2xl`}>Variables</h3>
                    <div css={tw`grid gap-8 md:grid-cols-2`}>
                        {startupData.variables.map((variable) => (
                            <VariableBox key={variable.envVariable} variable={variable} />
                        ))}
                    </div>
                </>
            )}
        </ServerContentBlock>
    );
};
