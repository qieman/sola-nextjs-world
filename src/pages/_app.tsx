import React from 'react';
import '@/styles/index.sass'
import 'swiper/css'
import NextNProgress from 'nextjs-progressbar';
import Script from 'next/script'
import Layout from "@/components/Layout/Layout";

// providers
import LangProvider from "@/components/provider/LangProvider/LangProvider"
import DialogProvider from "@/components/provider/DialogProvider/DialogProvider"
import PageBacProvider from "@/components/provider/PageBackProvider";
import UserProvider from "@/components/provider/UserProvider/UserProvider";
import theme from "@/theme"
import {Provider as StyletronProvider} from 'styletron-react'
import {BaseProvider} from 'baseui'
import {arbitrum, avalancheFuji, base, mainnet, optimism, polygon} from 'wagmi/chains'
import {InjectedConnector} from 'wagmi/connectors/injected'
import {publicProvider} from 'wagmi/providers/public'
import {configureChains, createConfig, WagmiConfig} from 'wagmi'
import {styletron} from '@/styletron'
import Head from 'next/head'
import MapProvider from "@/components/provider/MapProvider/MapProvider";
import EventHomeProvider from "@/components/provider/EventHomeProvider/EventHomeProvider";
import ColorSchemeProvider from "@/components/provider/ColorSchemeProvider";
import Subscriber from '@/components/base/Subscriber'
import NotificationsProvider from "@/components/provider/NotificationsProvider/NotificationsProvider";
import {SolanaWalletProvider} from '@/components/provider/SolanaWalletProvider/SolanaWalletProvider'
import MiniKitProvider from "@/components/provider/MiniKitProvider/MiniKitProvider";

import '@farcaster/auth-kit/styles.css';
// import { AuthKitProvider } from '@farcaster/auth-kit';

const farcasterConfig = {
    rpcUrl: 'https://mainnet.optimism.io',
    domain: process.env.NEXT_PUBLIC_HOST!.split('//')[1],
    siweUri: process.env.NEXT_PUBLIC_HOST,
};

const inject = new InjectedConnector({
    chains: [mainnet, polygon, avalancheFuji, optimism, base, arbitrum],
} as any)

// const walletConnectConnect = new WalletConnectConnector({
//     chains: [mainnet, moonbeam],
//     options: {
//         projectId: '291f8dbc68b408d4552ec4e7193c1b47'
//     }
// })

const {chains, publicClient, webSocketPublicClient} = configureChains(
    [mainnet, polygon, avalancheFuji, optimism, base, arbitrum],
    [publicProvider()],
)

const config = createConfig({
    autoConnect: true,
    publicClient,
    webSocketPublicClient,
    connectors: [
        //  walletConnectConnect,
        inject,
        // new JoyIdConnector(
        // {
        //     chains: [mainnet, polygon, avalancheFuji],
        //     options: {
        //         joyidAppURL: 'https://app.joy.id'
        //     }
        // })
    ],
})

function MyApp({Component, pageProps, ...props}: any) {

    function DisplayLay(params: { children: any }) {
        return props.router.pathname.includes('/wamo/') || props.router.pathname.includes('/iframe/')
            ? <div className={'light'} style={{width: '100vw', height: '100vh'}}>{params.children}</div>
            : <Layout>{params.children}</Layout>
    }

    return (
        <>
            <Script src="/analyse/rollbar.js"/>
            <PageBacProvider>
                <Head>
                    <link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
                    <script defer data-domain="app.sola.day" src="https://analytics.wamo.club/js/script.js"></script>
                    {/* eslint-disable-next-line @next/next/no-sync-scripts */}
                    <script src="/analyse/rollbar.js"></script>
                    <meta name="viewport"
                          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
                    <title>{process.env.NEXT_PUBLIC_SPECIAL_VERSION === 'maodao' ? 'Ready Player Club' : 'Social Layer'}</title>
                </Head>
                <WagmiConfig config={config as any}>
                    {/*<AuthKitProvider config={farcasterConfig}>*/}
                    <SolanaWalletProvider>
                        <ColorSchemeProvider>
                            <StyletronProvider value={styletron}>
                                <BaseProvider theme={theme}>
                                    <DialogProvider>
                                        <MiniKitProvider>
                                            <MapProvider>
                                                <UserProvider>
                                                    <LangProvider>
                                                        <DialogProvider>
                                                            <EventHomeProvider>
                                                                <NotificationsProvider>
                                                                    <DisplayLay>
                                                                        <NextNProgress options={{showSpinner: false}}/>
                                                                        <Component {...pageProps} />
                                                                        <Subscriber/>
                                                                    </DisplayLay>
                                                                </NotificationsProvider>
                                                            </EventHomeProvider>
                                                        </DialogProvider>
                                                    </LangProvider>
                                                </UserProvider>
                                            </MapProvider>
                                        </MiniKitProvider>
                                    </DialogProvider>
                                </BaseProvider>
                            </StyletronProvider>
                        </ColorSchemeProvider>
                    </SolanaWalletProvider>
                    {/*</AuthKitProvider>*/}
                </WagmiConfig>
            </PageBacProvider>
        </>
    );
}

export default MyApp;
