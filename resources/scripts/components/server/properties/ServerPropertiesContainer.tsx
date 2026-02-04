import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { Field, Form, Formik } from 'formik';
import FlashMessageRender from '@/components/FlashMessageRender';
import FormikSwitch from '@/components/elements/FormikSwitch';
import Select from '@/components/elements/Select';
import Input from '@/components/elements/Input';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import useFlash from '@/plugins/useFlash';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faEdit, faFile } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/elements/button/index';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { Alert } from '@/components/elements/alert';

const CONSTANT_VALUES: Record<string, string[]> = {
    gamemode: ['survival', 'creative', 'adventure', 'spectator'],
    difficulty: ['peaceful', 'easy', 'normal', 'hard'],
};

// Thai translations for property keys
const PROPERTY_THAI_NAMES: Record<string, string> = {
    'accepts-transfers': 'ยอมรับการโอนย้าย',
    'broadcast-rcon-to-ops': 'ส่ง RCON ไปยัง Ops',
    'enable-code-of-conduct': 'เปิดใช้งานกฎเกณฑ์',
    'enable-rcon': 'เปิดใช้งาน RCON',
    'enforce-whitelist': 'บังคับใช้ Whitelist',
    'function-permission-level': 'ระดับสิทธิ์ Function',
    'allow-flight': 'อนุญาตให้บิน',
    'bug-report-link': 'ลิงก์รายงานข้อผิดพลาด',
    'enable-jmx-monitoring': 'เปิดใช้งาน JMX Monitoring',
    'enable-status': 'เปิดใช้งานสถานะ',
    'entity-broadcast-range-percentage': 'เปอร์เซ็นต์ระยะการส่ง Entity',
    'gamemode': 'โหมดเกม',
    'broadcast-console-to-ops': 'ส่ง Console ไปยัง Ops',
    'difficulty': 'ระดับความยาก',
    'enable-query': 'เปิดใช้งาน Query',
    'enforce-secure-profile': 'บังคับใช้ Secure Profile',
    'force-gamemode': 'บังคับโหมดเกม',
    'generate-structures': 'สร้างโครงสร้าง',
    'hardcore': 'โหมดฮาร์ดคอร์',
    'max-chained-neighbor-updates': 'อัปเดตเพื่อนบ้านสูงสุด',
    'max-players': 'ผู้เล่นสูงสุด',
    'max-tick-time': 'เวลา Tick สูงสุด',
    'max-world-size': 'ขนาดโลกสูงสุด',
    'motd': 'ข้อความวันนี้',
    'network-compression-threshold': 'เกณฑ์การบีบอัดเครือข่าย',
    'online-mode': 'โหมดออนไลน์',
    'op-permission-level': 'ระดับสิทธิ์ OP',
    'player-idle-timeout': 'หมดเวลาผู้เล่นไม่ใช้งาน',
    'prevent-proxy-connections': 'ป้องกันการเชื่อมต่อ Proxy',
    'pvp': 'PvP',
    'query.port': 'พอร์ต Query',
    'rate-limit': 'จำกัดอัตรา',
    'rcon.password': 'รหัสผ่าน RCON',
    'rcon.port': 'พอร์ต RCON',
    'require-resource-pack': 'ต้องการ Resource Pack',
    'resource-pack': 'Resource Pack',
    'resource-pack-prompt': 'ข้อความ Resource Pack',
    'resource-pack-sha1': 'SHA1 Resource Pack',
    'server-ip': 'IP เซิร์ฟเวอร์',
    'server-port': 'พอร์ตเซิร์ฟเวอร์',
    'simulation-distance': 'ระยะการจำลอง',
    'spawn-animals': 'เกิดสัตว์',
    'spawn-monsters': 'เกิดมอนสเตอร์',
    'spawn-npcs': 'เกิด NPC',
    'spawn-protection': 'การป้องกันการเกิด',
    'sync-chunk-writes': 'ซิงค์การเขียน Chunk',
    'text-filtering-config': 'การตั้งค่าการกรองข้อความ',
    'use-native-transport': 'ใช้ Native Transport',
    'view-distance': 'ระยะการมองเห็น',
    'white-list': 'Whitelist',
    'enforce-whitelist': 'บังคับใช้ Whitelist',
};

interface PropertyType {
    key: string;
    value: string | boolean | number;
    type: 'string' | 'boolean' | 'constant';
    options?: string[];
}

const Container = styled.div`
    ${tw`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3`}
`;

const HeaderContainer = styled.div`
    ${tw`flex space-x-4 mb-4 items-center`}
`;

const SearchContainer = styled.div`
    ${tw`w-full flex-1 relative items-center`}
`;

const SearchIcon = styled.div`
    ${tw`absolute text-neutral-400 pointer-events-none`}
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
`;

const SearchWrapper = styled.div`
    ${tw`relative flex flex-1 items-center`}

    input {
        padding-left: 40px !important;
        height: 40px !important;
    }
`;

const StyledButton = styled(Button)`
    ${tw`h-10`}
`;

const NoResults = styled.div`
    ${tw`text-center text-neutral-400 py-4 col-span-1 md:col-span-2 xl:col-span-3`}
`;

const PropertyBox = ({ property, values }: { property: PropertyType; values: any }) => {
    const thaiName = PROPERTY_THAI_NAMES[property.key] || property.key;
    const englishName = property.key.toUpperCase().replace(/-/g, '-');

    return (
        <TitledGreyBox
            title={
                <div css={tw`flex items-center justify-between w-full`}>
                    <span css={tw`text-base font-semibold uppercase`}>{thaiName}</span>
                    <span css={tw`text-xs text-neutral-400 font-mono`}>{englishName}</span>
                </div>
            }
        >
            <div css={tw`px-1 py-2`}>
                {property.type === 'boolean' && (
                    <FormikSwitch
                        name={property.key}
                        label={thaiName}
                        description={`Current value: ${values[property.key]}`}
                    />
                )}
                {property.type === 'constant' && (
                    <div>
                        <Label>{thaiName}</Label>
                        <Field as={Select} name={property.key}>
                            {property.options?.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </Field>
                    </div>
                )}
                {property.type === 'string' && (
                    <div>
                        <Label>{thaiName}</Label>
                        <Field as={Input} name={property.key} />
                    </div>
                )}
            </div>
        </TitledGreyBox>
    );
};

const Label = styled.label`
    ${tw`block text-sm text-neutral-300 mb-1`}
`;

const UnsavedChangesAlert = styled.div`
    ${tw`mb-4`}
`;

export default () => {
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PropertyType[]>([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [fileNotFound, setFileNotFound] = useState(false);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    useEffect(() => {
        clearFlashes();
        getProperties();
    }, []);

    const getProperties = async () => {
        try {
            if (!uuid) return;
            setLoading(true);
            const content = await getFileContents(uuid, '/server.properties');
            const parsedProperties = parseProperties(content);
            setProperties(parsedProperties);
        } catch (error: any) {
            if (
                error.message?.includes('not found') ||
                error.statusCode === 404 ||
                error.statusCode === 500 ||
                error.response?.status === 500 ||
                error.response?.data?.error
            ) {
                setFileNotFound(true);
            } else {
                clearAndAddHttpError({ key: 'server-properties', error });
            }
        } finally {
            setLoading(false);
        }
    };

    const parseProperties = (content: string): PropertyType[] => {
        return content
            .split('\n')
            .filter((line) => line && !line.startsWith('#'))
            .map((line) => {
                const [key, value] = line.split('=').map((part) => part.trim());
                let type: 'string' | 'boolean' | 'constant' = 'string';
                let parsedValue: string | boolean | number = value;

                if (value === 'true' || value === 'false') {
                    type = 'boolean';
                    parsedValue = value === 'true';
                } else if (key in CONSTANT_VALUES) {
                    type = 'constant';
                }

                return {
                    key,
                    value: parsedValue,
                    type,
                    options: CONSTANT_VALUES[key],
                };
            });
    };

    const stringifyProperties = (properties: PropertyType[]): string => {
        return properties.map((prop) => `${prop.key}=${prop.value}`).join('\n');
    };

    const handleSubmit = async (values: { [key: string]: any }) => {
        try {
            if (!uuid) return;
            const updatedProperties = properties.map((prop) => ({
                ...prop,
                value: values[prop.key],
            }));

            await saveFileContents(uuid, '/server.properties', stringifyProperties(updatedProperties));
            setProperties(updatedProperties);
            setHasUnsavedChanges(false);
        } catch (error) {
            clearAndAddHttpError({ key: 'server-properties', error });
        }
    };

    if (loading) {
        return null;
    }

    const initialValues = {
        search: '',
        ...properties.reduce(
            (acc, prop) => ({
                ...acc,
                [prop.key]: prop.value,
            }),
            {}
        ),
    };

    return (
        <ServerContentBlock title='Server Properties'>
            <Formik onSubmit={handleSubmit} initialValues={initialValues} enableReinitialize>
                {({ values, isSubmitting, dirty }) => {
                    useEffect(() => {
                        setHasUnsavedChanges(dirty);
                    }, [dirty]);

                    const filteredProperties = properties.filter(
                        (prop) =>
                            prop.key.toLowerCase().includes(values.search.toLowerCase()) ||
                            String(prop.value).toLowerCase().includes(values.search.toLowerCase())
                    );

                    return (
                        <Form>
                            <FlashMessageRender byKey={'server-properties'} />
                            {fileNotFound && (
                                <div className='mb-4'>
                                    <Alert type='danger' className='mb-4'>
                                        <p className='font-medium'>server.properties file not found</p>
                                        <p className='ml-2'>
                                            Please make sure your server is properly installed and try again.
                                        </p>
                                    </Alert>
                                </div>
                            )}
                            {hasUnsavedChanges && (
                                <UnsavedChangesAlert>
                                    <Alert type='warning' className='mb-0'>
                                        <div className='flex items-center'>
                                            <span className='font-medium mr-2'>Unsaved Changes:</span>
                                            There are changes that have not been saved
                                        </div>
                                    </Alert>
                                </UnsavedChangesAlert>
                            )}
                            <HeaderContainer>
                                <SearchContainer>
                                    <SearchWrapper>
                                        <Field as={Input} name='search' placeholder='Search for properties...' />
                                        <SearchIcon>
                                            <FontAwesomeIcon icon={faSearch} />
                                        </SearchIcon>
                                    </SearchWrapper>
                                </SearchContainer>
                                <StyledButton type='submit' css={tw`w-32`} disabled={isSubmitting}>
                                    <FontAwesomeIcon icon={faFile} className='mr-2' />
                                    {isSubmitting ? 'Saving...' : 'Save'}
                                </StyledButton>
                                <Link to={`/server/${uuid}/files/edit#/server.properties`}>
                                    <StyledButton css={tw`w-32`}>
                                        <FontAwesomeIcon icon={faEdit} className='mr-2' />
                                        Manual
                                    </StyledButton>
                                </Link>
                            </HeaderContainer>
                            <Container>
                                {filteredProperties.length === 0 ? (
                                    <NoResults>No properties match your search</NoResults>
                                ) : (
                                    filteredProperties.map((property) => (
                                        <PropertyBox key={property.key} property={property} values={values} />
                                    ))
                                )}
                            </Container>
                        </Form>
                    );
                }}
            </Formik>
        </ServerContentBlock>
    );
};
