import React from 'react';
import { NavLink, Route, Switch } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import RentServerContainer from '@/components/rent/RentServerContainer';
import SubscriptionContainer from '@/components/subscription/SubscriptionContainer';
import TopupContainer from '@/components/topup/TopupContainer';
import ContactContainer from '@/components/contact/ContactContainer';
import AddServerContainer from '@/components/admin/AddServerContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import SubNavigation from '@/components/elements/SubNavigation';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { useStoreState } from 'easy-peasy';

const MainContent = styled.div`
    ${tw`min-h-screen w-full p-4 lg:p-8 lg:ml-64 transition-all duration-300`};
`;

export default () => {
    const location = useLocation();
    const rootAdmin = useStoreState((state) => state.user.data?.rootAdmin);

    return (
        <>
            <Sidebar />
            <MainContent>
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <RentServerContainer />
                            </Route>
                            <Route path={'/servers'}>
                                <DashboardContainer />
                            </Route>
                            <Route path={'/subscription'}>
                                <SubscriptionContainer />
                            </Route>
                            <Route path={'/topup'}>
                                <TopupContainer />
                            </Route>
                            <Route path={'/contact'}>
                                <ContactContainer />
                            </Route>
                            <Route path={'/add-server'}>
                                <AddServerContainer />
                            </Route>
                            {routes.account.map(({ path, component: Component }) => (
                                <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                    {rootAdmin && location.pathname.startsWith('/account') && (
                                        <SubNavigation>
                                            <div>
                                                {routes.account
                                                    .filter((route) => !!route.name)
                                                    .map(({ path: accountPath, name, exact = false }) => (
                                                        <NavLink
                                                            key={accountPath}
                                                            to={`/account/${accountPath}`.replace('//', '/')}
                                                            exact={exact}
                                                        >
                                                            {name}
                                                        </NavLink>
                                                    ))}
                                            </div>
                                        </SubNavigation>
                                    )}
                                    <Component />
                                </Route>
                            ))}
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </TransitionRouter>
            </MainContent>
        </>
    );
};
