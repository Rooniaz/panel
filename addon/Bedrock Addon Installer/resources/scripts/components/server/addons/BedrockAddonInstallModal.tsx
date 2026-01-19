import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Button } from '@/components/elements/button';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCalendarAlt, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { formatDistanceToNow } from 'date-fns';
import Spinner from '@/components/elements/Spinner';
import { useFlashKey } from '@/plugins/useFlash';
import useFlash from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import FormikSwitch from '@/components/elements/FormikSwitch';
import MessageBox from '@/components/MessageBox';
import { Dialog } from '@/components/elements/dialog';
import { Form, Formik } from 'formik';
import Select from '@/components/elements/Select';
interface Addon {
    id: number;
    name: string;
    summary: string;
    author: string;
    thumbnailUrl: string;
    downloadCount: number;
    gameVersion: string;
    addonType: string;
    fileDate?: string;
    dateModified?: string;
    dateCreated?: string;
    classId?: number;
    type?: string;
}
interface AddonFile {
    id: number;
    displayName: string;
    fileName: string;
    downloadUrl: string;
    gameVersion: string;
    fileDate?: string;
    fileSize: number;
}
interface Props {
    addon: Addon;
    open: boolean;
    onClose: () => void;
    onInstalled: (addonType: string) => void;
}
interface FormValues {
    fileId: string;
}
interface AddonTypeOption {
    value: string;
    label: string;
    description: string;
}
const AddonCard = tw.div`bg-neutral-700 shadow-inner rounded p-4 mb-4`;
const AddonInfo = tw.div`flex flex-col md:flex-row items-start md:items-center gap-4`;
const AddonDetails = tw.div`flex-1 min-w-0`;
const AddonImage = tw.img`w-24 h-24 rounded-lg object-cover`;
const AddonTitle = tw.h3`text-lg font-medium text-neutral-100 line-clamp-2 mb-1`;
const AddonMeta = tw.div`flex flex-wrap gap-4 text-sm text-neutral-300 mt-2`;
const AddonMetaItem = tw.div`flex items-center gap-2`;
const AddonDescription = tw.p`text-sm text-neutral-200 mt-4 line-clamp-3`;
const VersionList = tw.div`mt-6 bg-neutral-700 rounded-lg border border-neutral-700 overflow-hidden`;
const VersionItem = styled.div<{ selected: boolean }>`
    ${tw`p-4 border-b border-neutral-700 last:border-0 flex items-center justify-between cursor-pointer transition-colors duration-150`};
    ${(props) => (props.selected ? tw`bg-primary-500 hover:bg-primary-600` : tw`hover:bg-neutral-700`)};
`;
const VersionInfo = tw.div`flex-1 min-w-0`;
const VersionName = tw.div`font-semibold mb-1`;
const VersionMeta = tw.div`text-xs text-neutral-300 flex items-center gap-3`;
const ADDON_TYPE_OPTIONS: AddonTypeOption[] = [
    { value: 'addon', label: 'Addon', description: 'Combined behavior and resource pack' },
    { value: 'map', label: 'Map', description: 'World/map file' },
    { value: 'texture_pack', label: 'Texture Pack', description: 'Resource pack with textures only' },
    { value: 'script', label: 'Script', description: 'Behavior pack with scripts and functions' },
    { value: 'skin', label: 'Skin Pack', description: 'Character skin pack' },
];
const getAddonTypeFromClassId = (classId?: number): string => {
    switch (classId) {
        case 4984:
            return 'addon';
        case 6913:
            return 'map';
        case 6929:
            return 'texture_pack';
        case 6940:
            return 'script';
        case 6925:
            return 'skin';
        default:
            return 'addon';
    }
};
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export default ({ addon, open, onClose, onInstalled }: Props) => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('bedrock_addon_install');
    const { addFlash, clearFlashes: clearAllFlashes } = useFlash();
    const [loading, setLoading] = useState(true);
    const [versions, setVersions] = useState<AddonFile[]>([]);
    useEffect(() => {
        if (open && addon) {
            clearFlashes();
            setLoading(true);
            setVersions([]);
            http.get(`/api/client/servers/${id}/bedrock/addons/versions`, {
                params: {
                    addonId: String(addon.id),
                },
            })
                .then(({ data }) => {
                    if (data && Array.isArray(data.files)) {
                        setVersions(data.files);
                    }
                    setLoading(false);
                })
                .catch((error) => {
                    clearAndAddHttpError(error);
                    setLoading(false);
                });
        }
    }, [open, addon]);
    const submit = (
        { fileId }: FormValues,
        { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
        clearFlashes();
        const detectedType = getAddonTypeFromClassId(addon.classId);
        http.post(`/api/client/servers/${id}/bedrock/addons/install`, {
            addonId: String(addon.id),
            fileId: parseInt(fileId),
            addonType: detectedType,
            addonName: addon.name,
        })
            .then(() => {
                setSubmitting(false);
                addFlash({
                    key: 'bedrock_addon_install_success',
                    message:
                        'The addon installation has been queued and will begin shortly in the background.',
                    type: 'success',
                    title: 'Installation Queued',
                });
                onInstalled(detectedType);
            })
            .catch((error) => {
                setSubmitting(false);
                clearAndAddHttpError(error);
            });
    };
    return (
        <Formik
            onSubmit={submit}
            initialValues={{
                fileId: versions.length > 0 ? String(versions[0].id) : '',
            }}
            enableReinitialize
        >
            {({ isSubmitting, values, submitForm, setFieldValue }) => (
                <Dialog open={open} onClose={onClose} title='Install Bedrock Addon'>
                    <FlashMessageRender byKey={'bedrock_addon_install'} css={tw`mb-6`} />
                    <Form>
                        <AddonCard>
                            <AddonInfo>
                                {addon.thumbnailUrl ? (
                                    <AddonImage
                                        src={addon.thumbnailUrl}
                                        alt={`${addon.name} icon`}
                                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div
                                        css={tw`w-24 h-24 rounded-lg bg-neutral-600 border-2 border-neutral-500 flex items-center justify-center text-neutral-300`}
                                    >
                                        <FontAwesomeIcon icon={faInfoCircle} size='lg' />
                                    </div>
                                )}
                                <AddonDetails>
                                    <AddonTitle>{addon.name}</AddonTitle>
                                    <p css={tw`text-sm text-neutral-300`}>By {addon.author}</p>
                                    <AddonMeta>
                                        <AddonMetaItem>
                                            <FontAwesomeIcon icon={faDownload} css={tw`text-neutral-400`} />
                                            <span>{addon.downloadCount.toLocaleString()} downloads</span>
                                        </AddonMetaItem>
                                        <AddonMetaItem>
                                            <FontAwesomeIcon icon={faCalendarAlt} css={tw`text-neutral-400`} />
                                            <span>
                                                Updated{' '}
                                                {formatDistanceToNow(
                                                    new Date(addon.dateModified || addon.dateCreated || new Date()),
                                                    { addSuffix: true }
                                                )}
                                            </span>
                                        </AddonMetaItem>
                                    </AddonMeta>
                                </AddonDetails>
                            </AddonInfo>
                            <AddonDescription>{addon.summary}</AddonDescription>
                        </AddonCard>
                        <div css={tw`mt-6`}>
                            {loading ? (
                                <div css={tw`flex justify-center py-8`}>
                                    <Spinner size='large' />
                                </div>
                            ) : versions.length > 0 ? (
                                <div css={tw`mb-6`}>
                                    <Select
                                        onChange={(e) => setFieldValue('fileId', e.target.value)}
                                        value={values.fileId}
                                        disabled={isSubmitting}
                                    >
                                        {versions.map((version) => (
                                            <option key={version.id} value={version.id}>
                                                {version.displayName}{' '}
                                                {version.gameVersion ? `(MC ${version.gameVersion})` : ''}
                                            </option>
                                        ))}
                                    </Select>
                                    {versions.find((v) => String(v.id) === values.fileId) && (
                                        <div css={tw`mt-2 text-sm text-neutral-300`}>
                                            <div css={tw`flex items-center gap-4`}>
                                                <span>
                                                    <FontAwesomeIcon
                                                        icon={faCalendarAlt}
                                                        css={tw`mr-1 text-neutral-400`}
                                                    />
                                                    {formatDistanceToNow(
                                                        new Date(
                                                            versions.find((v) => String(v.id) === values.fileId)
                                                                ?.fileDate || new Date()
                                                        ),
                                                        { addSuffix: true }
                                                    )}
                                                </span>
                                                <span>
                                                    <FontAwesomeIcon
                                                        icon={faDownload}
                                                        css={tw`mr-1 text-neutral-400`}
                                                    />
                                                    {formatBytes(
                                                        versions.find((v) => String(v.id) === values.fileId)
                                                            ?.fileSize || 0
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p
                                    css={tw`text-center text-sm text-neutral-300 py-4 bg-neutral-800 rounded border border-neutral-700`}
                                >
                                    No versions available for this addon.
                                </p>
                            )}
                        </div>
                        <Dialog.Footer>
                            <Button.Text onClick={onClose}>Cancel</Button.Text>
                            <Button
                                onClick={submitForm}
                                disabled={loading || !values.fileId || isSubmitting}
                                css={tw`ml-3`}
                            >
                                {isSubmitting ? 'Installing...' : 'Install Addon'}
                            </Button>
                        </Dialog.Footer>
                    </Form>
                </Dialog>
            )}
        </Formik>
    );
};
