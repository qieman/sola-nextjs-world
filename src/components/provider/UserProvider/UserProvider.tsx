import {ReactNode, useContext, useEffect, useState, useRef} from 'react'
import {useAccount, useDisconnect, useWalletClient} from 'wagmi'
import UserContext from './UserContext'
import DialogsContext from '../DialogProvider/DialogsContext'
import * as AuthStorage from '../../../utils/authStorage'
import {login as solaLogin, myProfile, Profile} from '@/service/solas'
import {useRouter} from 'next/navigation'
import useEvent, {EVENT} from '../../../hooks/globalEvent'
import {setAuth} from "@/utils/authStorage";
import useShowRole from "@/components/zugame/RoleDialog/RoleDialog";
import useSafePush from "@/hooks/useSafePush";
import {WalletContext as solanaWalletContext} from '@solana/wallet-adapter-react'
import fetch from "@/utils/fetch";
import {createSignInMessage} from '@solana/wallet-standard-util';

const MiniKitLib = require('@worldcoin/minikit-js')

console.log('MiniKitLib', MiniKitLib)

// import {MiniKit, ResponseEvent} from '@worldcoin/minikit-js'

// import { useProfile as useFarcasterProfile, useSignInMessage, useSignIn } from '@farcaster/auth-kit';


export interface User {
    id: number | null,
    userName: string | null,
    avatar: string | null,
    domain: string | null,
    email: string | null,
    wallet: string | null,
    twitter: string | null,
    authToken: string | null,
    nickname: string | null,
    far_address: string | null
    permissions: string[],
    phone: string | null,
    maodaoid?: number | null,
    detail?: Profile | null

}

export interface UserContext {
    user: User
    setUser: (data: Partial<Record<keyof User, any>>) => any
    logOut: () => any
}

export interface UserProviderProps {
    children: ReactNode
}

const emptyUser: User = {
    id: 0,
    userName: null,
    avatar: null,
    domain: null,
    email: null,
    wallet: null,
    twitter: null,
    authToken: null,
    nickname: null,
    permissions: [],
    phone: null,
    far_address: null
}

let worldIdNonce : null | number = null;

function UserProvider(props: UserProviderProps) {
    const [userInfo, setUserInfo] = useState<User>(emptyUser)
    const {address, isConnecting, isDisconnected, connector} = useAccount()
    const {disconnect} = useDisconnect()
    const {data} = useWalletClient()
    const {showToast, clean, showLoading} = useContext(DialogsContext)
    const router = useRouter()
    const [newProfile, _] = useEvent(EVENT.profileUpdate)
    const showRoleDialog = useShowRole()
    const {safePush} = useSafePush()
    const solanaWallet: any = useContext(solanaWalletContext)
    // const {isAuthenticated, profile } = useFarcasterProfile()
    // const { signature, message } = useSignInMessage()
    // const { signOut } = useSignIn({})



    const setUser = (data: Partial<Record<keyof User, any>>) => {
        const copyUserInfo = {...userInfo, ...data}
        setUserInfo(copyUserInfo)
    }

    const setProfile = async (props: { authToken: string }) => {
        try {
            const profileInfo = await myProfile({auth_token: props.authToken})
            setUser({
                wallet: profileInfo.sol_address || profileInfo?.address,
                id: profileInfo?.id! || null,
                twitter: profileInfo?.twitter || null,
                domain: profileInfo?.username ? profileInfo?.username + process.env.NEXT_PUBLIC_SOLAS_DOMAIN : null,
                userName: profileInfo?.username || null,
                email: profileInfo?.email || null,
                avatar: profileInfo?.image_url || null,
                authToken: props.authToken,
                nickname: profileInfo?.nickname || null,
                permissions: profileInfo?.permissions || [],
                maodaoid: profileInfo?.maodaoid,
                far_address: profileInfo?.far_address,
                detail: profileInfo
            })

            // if (!profileInfo!.username) {
            //     // 如果当前页面是’/login‘说明是邮箱登录，fallback已经在点击邮箱登录按钮的时候设置了:
            //     // src/components/dialogs/ConnectWalletDialog/ConnectWalletDialog.tsx  42行
            //
            //     if (!window.location.href.includes('/login')) {
            //         window.localStorage.setItem('fallback', window.location.href)
            //     }
            //     clean()
            //     setTimeout(() => {
            //         safePush('/regist')
            //     },100)
            //     return
            // }

            // if (window.location.pathname === '/') {
            //     navigate(`/profile/${profileInfo.username}`)
            // }

            window.localStorage.setItem('zugame_team', '')

            // if (process.env.NEXT_PUBLIC_SPECIAL_VERSION === 'zumap' && profileInfo.zugame_team) {
            //     showRoleDialog(profileInfo.zugame_team)
            //     window.localStorage.setItem('zugame_team', profileInfo.zugame_team)
            // }

        } catch (e: any) {
            console.error('[setProfile]: ', e)
            showToast('Login fail', 3000)
            logOut()
        }
    }

    const logOut = () => {
        console.trace('logOut====')
        try {
            disconnect()
            solanaWallet.disconnect()
            // signOut && signOut()
        } catch (e: any) {
            console.warn(e)
        }

        if (userInfo.wallet) {
            AuthStorage.burnAuth(userInfo.wallet)
        }

        if (userInfo.email) {
            AuthStorage.burnAuth(userInfo.email)
        }

        AuthStorage.setLastLoginType(null)
        window.localStorage.removeItem('isSolarLogin')
        window.localStorage.removeItem('wagmi.wallet')
        window.localStorage.removeItem('wagmi.store')
        window.localStorage.removeItem('wagmi.cache')
        window.localStorage.removeItem('wagmi.connected')
        window.localStorage.removeItem('auth_sola')

        setUserInfo(emptyUser)
    }

    const zupassLogin = async () => {
        const loginType = AuthStorage.getLastLoginType()
        if (!loginType) return
        if (loginType !== 'zupass') return

        console.log('Login ...')
        console.log('Login type: ', loginType)

        const emailAuthInfo = AuthStorage.getEmailAuth()
        if (!emailAuthInfo) return

        const authToken = emailAuthInfo.authToken
        const email = emailAuthInfo.email
        console.log('Login email: ', email)
        console.log('Storage token: ', authToken)

        await setProfile({authToken})
        setAuth(email, authToken)
    }

    const emailLogin = async () => {
        const loginType = AuthStorage.getLastLoginType()
        if (!loginType) return
        if (loginType !== 'email') return

        console.log('Login ...')
        console.log('Login type: ', loginType)

        const emailAuthInfo = AuthStorage.getEmailAuth()
        if (!emailAuthInfo) return

        const authToken = emailAuthInfo.authToken
        const email = emailAuthInfo.email
        console.log('Login email: ', email)
        console.log('Storage token: ', authToken)

        await setProfile({authToken})
        setAuth(email, authToken)
    }

    const walletLogin = async () => {
        const loginType = AuthStorage.getLastLoginType()
        if (!loginType) return
        if (loginType !== 'wallet') return

        if (!address) {
            logOut()
            return
        }

        if (!data) return


        console.log('Login ...')
        console.log('Login type: ', loginType)
        console.log('Login wallet: ', address)

        let authToken = AuthStorage.getAuth(address)?.authToken
        if (!authToken) {
            const unloading = showLoading()
            try {
                authToken = await solaLogin(data, connector?.name)
                console.log('New token: ', authToken)
            } catch (e) {
                console.error(e)
                showToast('Login fail', 3000)
                logOut()
                return
            } finally {
                unloading()
            }
        }

        console.log('Storage token: ', authToken)
        await setProfile({authToken: authToken})
        setAuth(address, authToken)
    }

    const minikitLogin = async () => {
        console.log('Login ...')
        console.log('Login type: ', 'world id')

        showToast('1')
        if (!MiniKitLib.MiniKit.isInstalled()) {
            showToast('WorldID not installed', 3000)
            return
        }

        showToast('2')
        let authToken = AuthStorage.getAuth(address)?.authToken

        if (!authToken) {
            showToast('3')
            const unloading = showLoading()
            try {
                const res = await fetch.get({url: `${process.env.NEXT_PUBLIC_API}/siwe/nonce`})
                const nonce: any = res.data.nonce + '';
                worldIdNonce = nonce
                const domain = window.location.host
                showToast('4')
                const generateMessageResult = MiniKitLib.MiniKit.commands.walletAuth({
                    nonce: nonce,
                    expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                    notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                    statement:
                        `${domain} wants you to sign in with your World ID account:`,
                });
                showToast('5')
                alert(generateMessageResult)
                console.log('New token: ', authToken)
            } catch (e) {
                showToast('6')
                console.error(e)
                showToast('Login fail', 3000)
                logOut()
                return
            } finally {
                showToast('7')
                unloading()
            }
        }
    }

    useEffect(() => {
        if (!MiniKitLib.MiniKit.isInstalled()) {
            return;
        }

        MiniKitLib.MiniKit.subscribe(MiniKitLib.ResponseEvent.MiniAppWalletAuth, async (payload:any) => {
            if (payload.status === "error") {
                alert('WorldID login failed')
                throw new Error('WorldID login failed');
            } else {
               console.log(payload)
                const response: any = await fetch.post({
                    url: "/api/worldid/verify",
                    data: {payload, nonce: worldIdNonce}
                });

                if (response.status === 200) {
                    const res = response.data
                    await setProfile({authToken: res.auth_token})
                    setAuth(res.address, res.auth_token)
                } else {
                    throw new Error("Authentication failed");
                }
            }
        });

        return () => {
            MiniKitLib.MiniKit.unsubscribe(MiniKitLib.ResponseEvent.MiniAppWalletAuth);
        };
    }, []);

    const phoneLogin = async () => {
        const loginType = AuthStorage.getLastLoginType()
        if (!loginType) return
        if (loginType !== 'phone') return

        console.log('Login ...')
        console.log('Login type: ', loginType)

        const emailAuthInfo = AuthStorage.getPhoneAuth()
        if (!emailAuthInfo) return

        const authToken = emailAuthInfo.authToken
        const phone = emailAuthInfo.phone
        console.log('Login phone: ', phone)
        console.log('Storage token: ', authToken)
        await setProfile({authToken})
        setAuth(phone, authToken)
    }

    const solanaLogin = async () => {
        const loginType = AuthStorage.getLastLoginType()
        if (!loginType) return
        if (loginType !== 'solana') return

        console.log('Login ...')
        console.log('Login type: ', loginType)


        let authToken = AuthStorage.getAuth(solanaWallet.publicKey.toBase58())?.authToken
        const adapter: any = solanaWallet.wallet.adapter;
        const address = adapter.publicKey ? adapter.publicKey.toBase58() : undefined

        console.log('adapter', adapter)

        if (!authToken) {
            const unloading = showLoading()
            try {
                adapter.connect()
                const now = new Date().toISOString()
                const message = createSignInMessage({
                    address: adapter.publicKey.toBase58(),
                    domain: window.location.origin,
                    version: '1',
                    issuedAt: now,
                    uri: window.location.origin,
                })

                const sign = await solanaWallet.wallet.adapter.signMessage(message)
                let signature: any = {}
                sign.map((item: any, index: number) => {
                    signature[index] = item
                })

                const getAuthToken = await fetch.post({
                    url: '/api/solana/authenticate',
                    data: {
                        signature: signature,
                        signedMessage: message,
                        public_key: adapter.publicKey,
                        address: address,
                        timestamps: now,
                    }
                })

                authToken = getAuthToken.data.auth_token
                await setProfile({authToken: authToken!})
                setAuth(adapter.publicKey.toBase58(), authToken!)
            } catch (e) {
                console.error(e)
                showToast('Login fail', 3000)
                logOut()
                return
            } finally {
                unloading()
            }
        }

        console.log('Storage token: ', authToken!)
        await setProfile({authToken: authToken!})
        setAuth(address, authToken!)
    }

    // const farcasterLogin = async () => {
    //     console.log('facasterLogin ...', profile)
    //     console.log(signature, message)
    //     const unloading = showLoading()
    //    try {
    //        const login = await fetch.post({
    //            url: '/api/farcaster/login',
    //            data: {
    //                signature,
    //                message,
    //                custody: profile.custody
    //            }
    //        }) as any
    //
    //        console.log('Storage token: ', login.data.auth_token)
    //        await setProfile({authToken: login.data.auth_token})
    //        setAuth(profile!.fid! + '', login.data.auth_token)
    //    } catch (e) {
    //           console.error(e)
    //           showToast('Login fail', 3000)
    //           logOut()
    //           return
    //    } finally {
    //           unloading()
    //    }
    // }

    const login = async () => {
        const loginType = AuthStorage.getLastLoginType()
        if (!loginType) return

        console.log('Auto Login ...')
        console.log('Login type: ', loginType)

        let auth = AuthStorage.getAuth()
        if (!auth) {
            return
        }

        const authToken = auth.authToken
        const account = auth.account

        console.log('Login account: ', account)
        console.log('Storage token: ', authToken)

        await setProfile({authToken})
    }

    useEffect(() => {
        login()
    }, [])

    useEffect(() => {
        const auth = AuthStorage.getAuth()
        const loginType = AuthStorage.getLastLoginType()

        if (!auth && loginType === 'wallet') {
            walletLogin()
        }

        // login()
    }, [data])

    useEffect(() => {
        solanaWallet.connected && solanaLogin()
    }, [solanaWallet.connected])

    // useEffect(() => {
    //     if (isAuthenticated) {
    //         farcasterLogin()
    //     }
    // }, [isAuthenticated])

    // update profile from event
    useEffect(() => {
        if (newProfile && (newProfile.id === userInfo.id || (!userInfo.domain && userInfo.id))) {
            setUser({
                ...userInfo,
                domain: newProfile.domain,
                userName: newProfile.domain ? newProfile.domain.split('.')[0] : null,
                nickname: newProfile.nickname,
                avatar: newProfile.image_url
            })
        }
    }, [newProfile])

    return (
        <UserContext.Provider
            value={{user: userInfo, setUser, logOut, emailLogin, walletLogin, phoneLogin, zupassLogin, minikitLogin}}>
            {props.children}
        </UserContext.Provider>
    )
}

export default UserProvider
