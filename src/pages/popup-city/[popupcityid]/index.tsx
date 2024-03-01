import React, {useContext, useEffect} from 'react'
import UserContext from '@/components/provider/UserProvider/UserContext'
import {usePathname, useRouter} from 'next/navigation'
import LangContext from '@/components/provider/LangProvider/LangContext'
import HomeUserPanel from "@/components/base/HomeUserPanel/HomeUserPanel";
import {
    Badge,
    Event,
    getGroupMembership,
    Group,
    Membership,
    popupCityDetail,
    queryBadge,
    queryEvent,
    PopupCity
} from "@/service/solas";
import ListEventVertical from "@/components/compose/ListEventVertical/ListEventVertical";
import DialogsContext from "@/components/provider/DialogProvider/DialogsContext";
import EventHomeContext from "@/components/provider/EventHomeProvider/EventHomeContext";
import MaodaoListEventVertical from "@/components/maodao/MaodaoListEventVertical/ListEventVertical";
import useIssueBadge from "@/hooks/useIssueBadge";
import Link from "next/link";
import AppButton from "@/components/base/AppButton/AppButton";
import mapContext from "@/components/provider/MapProvider/MapContext";

function PopupCity(props: { badges: Badge[], popupcity: PopupCity, initEvent?: Group, initList?: Event[], membership?: Membership[] }) {
    const {user} = useContext(UserContext)
    const router = useRouter()
    const pathname = usePathname()
    const {lang} = useContext(LangContext)
    const {showToast, openConnectWalletDialog} = useContext(DialogsContext)
    const {ready, joined, isManager, setEventGroup} = useContext(EventHomeContext)
    const eventGroup = useContext(EventHomeContext).eventGroup || props.initEvent || undefined
    const startIssueBadge = useIssueBadge()
    const { MapReady } = useContext(mapContext)

    useEffect(() => {
        if (props.initEvent) {
            setEventGroup(props.initEvent)
        }
    }, [props.initEvent])

    const gotoCreateEvent = () => {
        if (!user.authToken) {
            showToast('Please Login to continue')
            return
        }

        if (!eventGroup) {
            return
        }

        router.push(`/event/${eventGroup.username}/create`)
    }

    const issueBadge = async () => {
        if (!user.userName) {
            openConnectWalletDialog()
            return
        }

        const badges = await queryBadge({sender_id: user.id!, page: 1})
        startIssueBadge({badges: badges.data, group_id: eventGroup!.id})
    }


    return <>
        <div className='home-page-event'>
            <div className={'home-page-city-name'}>
                <div className={'home-page-city-name-text'}>{props.popupcity.title}</div>
            </div>
            <div className={'home-page-event-wrapper'}>
                <div className={`home-page-event-main`}>
                    <Link href={`/event/${props.initEvent!.username}/schedule`} className={'calendar-btn'}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M16 14H8C7.73478 14 7.48043 14.1054 7.29289 14.2929C7.10536 14.4804 7 14.7348 7 15C7 15.2652 7.10536 15.5196 7.29289 15.7071C7.48043 15.8946 7.73478 16 8 16H16C16.2652 16 16.5196 15.8946 16.7071 15.7071C16.8946 15.5196 17 15.2652 17 15C17 14.7348 16.8946 14.4804 16.7071 14.2929C16.5196 14.1054 16.2652 14 16 14ZM16 10H10C9.73478 10 9.48043 10.1054 9.29289 10.2929C9.10536 10.4804 9 10.7348 9 11C9 11.2652 9.10536 11.5196 9.29289 11.7071C9.48043 11.8946 9.73478 12 10 12H16C16.2652 12 16.5196 11.8946 16.7071 11.7071C16.8946 11.5196 17 11.2652 17 11C17 10.7348 16.8946 10.4804 16.7071 10.2929C16.5196 10.1054 16.2652 10 16 10ZM20 4H17V3C17 2.73478 16.8946 2.48043 16.7071 2.29289C16.5196 2.10536 16.2652 2 16 2C15.7348 2 15.4804 2.10536 15.2929 2.29289C15.1054 2.48043 15 2.73478 15 3V4H13V3C13 2.73478 12.8946 2.48043 12.7071 2.29289C12.5196 2.10536 12.2652 2 12 2C11.7348 2 11.4804 2.10536 11.2929 2.29289C11.1054 2.48043 11 2.73478 11 3V4H9V3C9 2.73478 8.89464 2.48043 8.70711 2.29289C8.51957 2.10536 8.26522 2 8 2C7.73478 2 7.48043 2.10536 7.29289 2.29289C7.10536 2.48043 7 2.73478 7 3V4H4C3.73478 4 3.48043 4.10536 3.29289 4.29289C3.10536 4.48043 3 4.73478 3 5V19C3 19.7956 3.31607 20.5587 3.87868 21.1213C4.44129 21.6839 5.20435 22 6 22H18C18.7956 22 19.5587 21.6839 20.1213 21.1213C20.6839 20.5587 21 19.7956 21 19V5C21 4.73478 20.8946 4.48043 20.7071 4.29289C20.5196 4.10536 20.2652 4 20 4ZM19 19C19 19.2652 18.8946 19.5196 18.7071 19.7071C18.5196 19.8946 18.2652 20 18 20H6C5.73478 20 5.48043 19.8946 5.29289 19.7071C5.10536 19.5196 5 19.2652 5 19V6H7V7C7 7.26522 7.10536 7.51957 7.29289 7.70711C7.48043 7.89464 7.73478 8 8 8C8.26522 8 8.51957 7.89464 8.70711 7.70711C8.89464 7.51957 9 7.26522 9 7V6H11V7C11 7.26522 11.1054 7.51957 11.2929 7.70711C11.4804 7.89464 11.7348 8 12 8C12.2652 8 12.5196 7.89464 12.7071 7.70711C12.8946 7.51957 13 7.26522 13 7V6H15V7C15 7.26522 15.1054 7.51957 15.2929 7.70711C15.4804 7.89464 15.7348 8 16 8C16.2652 8 16.5196 7.89464 16.7071 7.70711C16.8946 7.51957 17 7.26522 17 7V6H19V19Z"
                                fill="#7492EF"/>
                        </svg>
                        {lang['Activity_Calendar']}
                    </Link>

                    {
                        !user.userName &&
                        <div className={'center'}>
                            <div className={'home-login-panel'}>
                                <img src="/images/balloon.png" alt=""/>
                                <div className={'text'}>{lang['Activity_login_des']}</div>
                                <AppButton onClick={e => {
                                    openConnectWalletDialog()
                                }} special size={'compact'}>{lang['Activity_login_btn']}</AppButton>
                            </div>
                        </div>
                    }

                    { props.initEvent?.map_enabled && MapReady &&
                        <div className="home-map">
                            <iframe src={`/iframe/map?group=${props.initEvent?.username}`} frameBorder={0} width="100%" height="300" />
                            <Link className={'map-link'} href={`/event/${props.initEvent?.username}/map`}>
                                {'Browse in map'}
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 15 15" fill="none">
                                    <path d="M13.3637 8.4541V13.3632H8.45459" stroke="#333333" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M1.00009 5.90918L1.00009 1.00009L5.90918 1.00009" stroke="#333333" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M13.3637 13.3632L8.45459 8.4541" stroke="#333333" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M1.00009 1.00009L5.90918 5.90918" stroke="#333333" strokeWidth="1.63636" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </Link>
                        </div>
                    }

                    <div className="center">
                        <ListEventVertical patch={`/popup-city/${props.popupcity.id}`} initData={props.initList || []}/>
                    </div>

                    {!!user.id
                        && eventGroup
                        && ready
                        && <div className={'home-action-bar'}>
                            <div className={'create-event-btn'} onClick={e => {
                                gotoCreateEvent()
                            }}>+ {lang['Activity_Create_Btn']}</div>

                            {(user.id === (eventGroup as Group).creator.id || isManager) &&
                                <div className={'setting-btn'} onClick={e => {
                                    router.push(`/event/setting/${eventGroup!.username}`)
                                }}>{lang['Activity_Setting_Btn']}</div>
                            }
                        </div>
                    }
                </div>

                <div className={'home-page-event-side'}>
                    <HomeUserPanel membership={props.membership || []}
                                   badges={props.badges || []}
                                   showSchedule={false}
                                   isSide
                                   slot={() => {
                                       return <>
                                           {!!user.id
                                               && eventGroup
                                               && ready &&
                                               <div className={'home-action-bar'}>
                                                   <div className={'create-event-btn'} onClick={e => {
                                                       gotoCreateEvent()
                                                   }}>+ {lang['Activity_Create_Btn']}</div>
                                               </div>
                                           }
                                           <div className={'home-action-bar'}>
                                               <div className={'send-btn'} style={{minWidth: '200px'}} onClick={e => {
                                                   issueBadge()
                                               }}>{lang['Profile_User_MindBadge']}</div>

                                               {eventGroup && (user.id === (eventGroup as Group).creator?.id || isManager) &&
                                                   <div className={'setting-btn'} onClick={e => {
                                                       router.push(`/event/setting/${eventGroup!.username}`)
                                                   }}>{lang['Activity_Setting_Btn']}</div>
                                               }
                                           </div>
                                       </>
                                   }}/>
                </div>
            </div>
        </div>
    </>
}

export default PopupCity

export const getServerSideProps: any = (async (context: any) => {
    const popupcityid = context.params?.popupcityid
    const popupcity = await popupCityDetail(Number(popupcityid))
    if (!popupcity) {
        throw new Error('Not Found')
    }

    const targetGroup = popupcity.group
    const tab = context.query?.tab

    let res: any = []
    if (tab === 'past') {
        res = await queryEvent({
            page: 1,
            end_time_lte: new Date().toISOString(),
            event_order: 'desc',
            group_id: targetGroup?.id
        })
    } else {
        res = await queryEvent({
            page: 1,
            end_time_gte: new Date().toISOString(),
            event_order: 'asc',
            group_id: targetGroup?.id
        })
    }

    const membership = await getGroupMembership({
        group_id: targetGroup?.id!,
        role: 'all',
    })

    const badges = await queryBadge({group_id: targetGroup?.id!, page: 1})

    return {
        props: {
            popupcity: popupcity,
            badges: badges.data,
            initEvent: {
                ...targetGroup,
                creator: membership.find(m => m.role === 'owner'),
            }, initList: res, membership
        }
    }
})
