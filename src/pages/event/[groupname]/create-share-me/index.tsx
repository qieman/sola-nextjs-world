import {useContext, useEffect, useRef, useState} from 'react'
import PageBack from "@/components/base/PageBack";
import LangContext from "@/components/provider/LangProvider/LangContext";
import SelectorMarkerType, {markerTypeList} from "@/components/base/SelectorMarkerType/SelectorMarkerType";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import AppInput from "@/components/base/AppInput";
import UploadImage from "@/components/compose/UploadImage/UploadImage";
import ReasonInput from "@/components/base/ReasonInput/ReasonInput";
import {
    Badge,
    createMarker,
    createPresend,
    getProfile,
    Group,
    Marker,
    markerDetail,
    Presend,
    Profile,
    queryBadge,
    queryBadgeDetail,
    queryPresendDetail,
    removeMarker,
    saveMarker
} from "@/service/solas";
import DialogIssuePrefill from "@/components/eventSpecial/DialogIssuePrefill/DialogIssuePrefill";
import {OpenDialogProps} from "@/components/provider/DialogProvider/DialogProvider";
import DialogsContext from "@/components/provider/DialogProvider/DialogsContext";
import userContext from "@/components/provider/UserProvider/UserContext";
import AppButton, {BTN_KIND} from "@/components/base/AppButton/AppButton";
import LocationInput from "@/components/compose/LocationInput/LocationInput";
import EventHomeContext from "@/components/provider/EventHomeProvider/EventHomeContext";
import AppFlexTextArea from "@/components/base/AppFlexTextArea/AppFlexTextArea";
import {Delete} from "baseui/icon";

function ComponentName() {
    const {lang} = useContext(LangContext)
    const {showLoading, openDialog, showToast, openConfirmDialog} = useContext(DialogsContext)
    const searchParams = useSearchParams()
    const params = useParams()
    const {user} = useContext(userContext)
    const router = useRouter()
    const {eventGroup, isManager} = useContext(EventHomeContext)

    const [busy, setBusy] = useState(false)

    const [title, setTitle] = useState('')
    const [titleError, setTitleError] = useState('')
    const [link, setLink] = useState('')
    const [cover, setCover] = useState('')
    const [icon, setIcon] = useState<string | null>((markerTypeList as any)[Object.keys(markerTypeList)[1]])
    const [category, setCategory] = useState<string>(Object.keys(markerTypeList)[1])
    const [content, setContent] = useState('')
    const [creator, setCreator] = useState<Profile | null>(null)
    const [badgeId, setBadgeId] = useState<number | null>(null)
    const [location, setLocation] = useState<string>('')
    const [locationError, setLocationError] = useState<string>('')
    const [badgeDetail, setBadgeDetail] = useState<Badge | null>(null)

    const [markerId, setMarkerId] = useState<number | null>(null)

    const badgeIdRef = useRef<number | null>(null)
    const markerInfoRef = useRef<Marker | null>(null)

    const [canUserGroupBadge, setCanUserGroupBadge] = useState(false)

    useEffect(() => {
        // owner 和 manager 可以使用 group badge
        // 1516 playgroup2
        // 1984 istanbul2023
        setCanUserGroupBadge((isManager || (eventGroup as Group)?.creator.id == user?.id)
            && (eventGroup?.id === 1516 || eventGroup?.id === 1984))
    }, [isManager, eventGroup, user?.id])

    const showBadges = async (withGroup?: Group[]) => {
        const props = (creator as Group)?.creator ? {
                group_id: creator!.id,
                page: 1
            } :
            {
                sender_id: creator!.id,
                page: 1
            }

        const unload = showLoading()
        const badges = await queryBadge(props)
        let groupBadges: any[] = []
        if (withGroup) {
            const tasks = withGroup.map(group => queryBadge({group_id: group.id, page: 1}))
            const groupBadgesList = await Promise.all(tasks)
            groupBadges = groupBadgesList.map((badges, index) => {
                return {
                    groupName: (withGroup as any)[index].nickname || (withGroup as any)[index].username,
                    badges
                }
            })
        }

        unload()
        openDialog({
            content: (close: any) => <DialogIssuePrefill
                groupBadges={groupBadges.length ? groupBadges : undefined}
                badges={badges}
                profileId={user.id!}
                onSelect={(res) => {
                    if (res.badgeId) {
                        setBadgeId(res.badgeId)
                    }
                }}
                handleClose={close} />,
            position: 'bottom',
            size: [360, 'auto']
        } as OpenDialogProps)
    }

    const handleCreate = async () => {
        setTitleError('')
        setLocationError('')

        if (!title) {
            setTitleError(lang['Form_Marker_Title_Error'])
            showToast(lang['Form_Marker_Title_Error'], 500)
            return
        }

        if (!location) {
            setLocationError(lang['Form_Marker_Location_Error'])
            showToast(lang['Form_Marker_Location_Error'], 500)
            return
        }

        const unload = showLoading()
        setBusy(true)
        try {
            let voucher: null | Presend = null
            if (badgeId) {
                voucher = await createPresend({
                    message: badgeDetail?.content || '',
                    auth_token: user.authToken || '',
                    badge_id: badgeId || 990,
                    counter: null
                })
            }

            const create = await createMarker({
                auth_token: user.authToken || '',
                group_id: eventGroup?.id,
                owner_id: creator?.id,
                pin_image_url: icon!,
                cover_image_url: cover,
                title,
                category: 'share',
                about: content,
                link,
                location: 'Custom location',
                formatted_address: location,
                geo_lat: location ? JSON.parse(location).geometry.location.lat : null,
                geo_lng: location ? JSON.parse(location).geometry.location.lng : null,
                marker_type: 'zugame',
                voucher_id: voucher ? voucher.id : undefined
            })
            unload()
            showToast('Create Success', 500)
            router.push(`/event/${eventGroup?.username}/map?type=Share`)
        } catch (e: any) {
            setBusy(false)
            console.error(e)
            unload()
            showToast('Create fail', 1000)
        }
    }

    const handleSave = async () => {
        setTitleError('')
        setLocationError('')

        if (!title) {
            setTitleError(lang['Form_Marker_Title_Error'])
            showToast(lang['Form_Marker_Title_Error'], 500)
            return
        }

        if (!location) {
            setLocationError(lang['Form_Marker_Location_Error'])
            showToast(lang['Form_Marker_Location_Error'], 500)
            return
        }

        const unload = showLoading()
        setBusy(true)
        try {
            let newVoucherId: number = 0
            if (badgeId && badgeId !== badgeIdRef.current) {
                const voucher = await createPresend({
                    message: badgeDetail?.content || '',
                    auth_token: user.authToken || '',
                    badge_id: badgeId || 990,
                    counter: null
                })
                newVoucherId = voucher.id
            }

            const save = await saveMarker({
                auth_token: user.authToken || '',
                group_id: eventGroup?.id,
                owner_id: creator?.id,
                pin_image_url: icon!,
                cover_image_url: cover,
                title,
                category,
                about: content,
                link,
                location: JSON.parse(location).name,
                formatted_address: location,
                geo_lat: location ? JSON.parse(location).geometry.location.lat : null,
                geo_lng: location ? JSON.parse(location).geometry.location.lng : null,
                marker_type: 'site',
                id: markerId!,
                voucher_id: badgeId ? (newVoucherId || markerInfoRef.current?.voucher_id) : null
            })
            unload()
            showToast('Save Success', 500)
            router.push(`/event/${eventGroup?.username}/map?type=Share`)
        } catch (e: any) {
            console.error(e)
            unload()
            showToast('Save fail', 1000)
            setBusy(false)
        }
    }

    const handleRemove = () => {
        const dialog = openConfirmDialog({
            confirmLabel: 'Remove',
            cancelLabel: 'Cancel',
            title: `Do you want to remove marker 「${markerInfoRef.current!.title}」`,
            onConfirm: async (close: any) => {
                const unload = showLoading()
                try {
                    await removeMarker({
                        auth_token: user.authToken || '',
                        id: markerId!
                    })
                    unload()
                    showToast('Remove Success', 500)
                    close()
                    router.push(`/event/${eventGroup?.username}/map?type=${markerInfoRef.current!.category}`)
                } catch (e: any) {
                    console.error(e)
                    unload()
                    showToast('Remove fail', 500)
                }
            }
        })
    }

    const getLocation = () => {
        if (typeof  navigator !== 'undefined') {
            navigator.geolocation.getCurrentPosition((data) => {
                const location = {
                    geometry: {
                        location: {
                            lat: data.coords.latitude,
                            lng: data.coords.longitude
                        }
                    },
                    formatted_address: 'Custom location',
                    name: 'Custom location'
                }
                setLocation(JSON.stringify(location))
            })
        }
    }

    useEffect(() => {
        getLocation()
    }, [])

    useEffect(() => {
        async function fetchBadgeDetail() {
            if (badgeId) {
                const badge = await queryBadgeDetail({id: badgeId})
                setBadgeDetail(badge)
            }
        }

        fetchBadgeDetail()
    }, [badgeId])

    useEffect(() => {
        if (user?.id && !markerId) {
            const profile = getProfile({id: user.id}).then(res => {
                setCreator(res!)
            })
        }
    }, [user.id])

    const prefill = async (markerid: string, merkerDetail?: Marker) => {
        const detail = merkerDetail || await markerDetail(Number(markerid))
        setMarkerId(Number(markerid))
        setTitle(detail.title)
        setLink(detail.link || '')
        setCover(detail.cover_image_url || '')
        setIcon(detail.pin_image_url || '')
        setCategory(detail.category)
        setContent(detail.about || '')
        markerInfoRef.current = detail

        const creator = await getProfile({id: detail.owner.id})
        setCreator(creator!)

        // if (detail.voucher_id) {
        //     const voucher = await queryPresendDetail({
        //         id: detail.voucher_id,
        //         auth_token: user.authToken || ''
        //     })
        //     setBadgeId(voucher.badge_id)
        //     badgeIdRef.current = voucher.badge_id
        // } else {
        //     setBadgeId(990)
        // }


        setLocation(detail.formatted_address)
    }

    useEffect(() => {
        if (params?.markerid) {
            prefill(params?.markerid as string)
        } else {
            if (canUserGroupBadge) {
                setBadgeId(990)
            }
            if (searchParams?.get('type')) {
                const key = searchParams.get('type') as string
                if ((markerTypeList as any)[key]) {
                    setIcon((markerTypeList as any)[key])
                    setCategory(key)
                }
            } else {
                setIcon((markerTypeList as any)[Object.keys(markerTypeList)[1]])
                setCategory(Object.keys(markerTypeList)[1])
            }
        }
    }, [searchParams, params, canUserGroupBadge])

    useEffect(() => {
        async function fetchBadgeDetail() {
            if (badgeId) {
                const badge = await queryBadgeDetail({id: badgeId})
                setBadgeDetail(badge)
            }
        }

        fetchBadgeDetail()
    }, [badgeId])

    return (<div className='create-event-page'>
            <div className='create-badge-page-wrapper'>
                <PageBack title={'Share me'}/>

                <div className='create-badge-page-form'>
                    <div className='input-area'>
                        <div className='input-area-title'>{lang['Form_Marker_Title_Label']}</div>
                        <AppInput
                            clearable
                            maxLength={30}
                            value={title}
                            errorMsg={titleError}
                            placeholder={lang['Form_Marker_Title_Label']}
                            onChange={(e) => {
                                setTitle(e.target.value)
                            }}/>
                    </div>

                    <div className='input-area'>
                        <div className='input-area-title'>{lang['Form_Marker_Des_Label']}</div>
                        <ReasonInput unlimited value={content} onChange={(value) => {
                            setContent(value)
                        }}/>
                    </div>

                    <div className='input-area'>
                        <div className='input-area-title'>
                            {'Custom location'}
                            <span className={'get-location-btn'} onClick={getLocation}>Get location</span>
                        </div>
                        <AppInput
                            readOnly
                            value={location? `lat: ${JSON.parse(location).geometry.location.lat} lng: ${JSON.parse(location).geometry.location.lng}` : ''}/>
                    </div>

                    {!markerId ?
                        <>
                            <AppButton kind={BTN_KIND.primary}
                                       disabled={busy}
                                       special
                                       onClick={() => {
                                           handleCreate()
                                       }}>
                                {lang['Form_Marker_Create_Btn']}
                            </AppButton>
                        </>
                        : <>
                            <AppButton kind={BTN_KIND.primary}
                                       disabled={busy}
                                       special
                                       onClick={() => {
                                           handleSave()
                                       }}>
                                {lang['Profile_Edit_Save']}
                            </AppButton>
                            {
                                <div style={{marginTop: '12px'}}>
                                    <AppButton style={{color: 'red'}} onClick={e => {
                                        handleRemove()
                                    }}>{lang['Marker_Edit_Remove']}</AppButton>
                                </div>
                            }
                        </>
                    }
                </div>
            </div>
        </div>
    )
}

export default ComponentName
