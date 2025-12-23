import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`w-full flex items-center justify-center min-h-screen px-4 py-8`}
`;

const LoginFormBox = styled.div`
    ${tw`w-full`}
    max-width: 450px;

    ${breakpoint('sm')`
        max-width: 450px;
    `};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <LoginFormBox>
            <FlashMessageRender css={tw`mb-4`} />
            {title && <h2 css={tw`text-center text-neutral-100 mb-4 text-3xl md:text-4xl`}>{title}</h2>}
            <Form {...props} ref={ref}>
                {props.children}
            </Form>
        </LoginFormBox>
    </Container>
));
