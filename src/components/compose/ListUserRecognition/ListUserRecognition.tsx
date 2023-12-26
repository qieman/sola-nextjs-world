import React, {useContext, useEffect, useRef, useState} from 'react'
import ListUserAssets, {ListUserAssetsMethods} from "../../base/ListUserAssets/ListUserAssets";
import solas, {Profile, Group} from "../../../service/solas";
import CardBadge from "../../base/Cards/CardBadge/CardBadge";
import UserContext from "../../provider/UserProvider/UserContext";
import CardBadgelet from "../../base/Cards/CardBadgelet/CardBadgelet";
import LangContext from "../../provider/LangProvider/LangContext";
import useEvent, {EVENT} from "../../../hooks/globalEvent";
import AppButton from "@/components/base/AppButton/AppButton";

interface ListUserRecognitionProps {
    profile: Profile
}

function ListUserRecognition(props: ListUserRecognitionProps) {
    const {user} = useContext(UserContext)
    const {lang} = useContext(LangContext)

    const [noBadge, setNoBadge] = useState(true)

    const getBadge = async (page: number) => {
        const queryProps = !!(props.profile as Group).creator
            ? {group_id: props.profile.id, page}
            : {sender_id: props.profile.id, page}

        return await solas.queryBadge(queryProps)
    }

    const getBadgelet = async (page: number) => {
        const publicBadgelet = await solas.queryBadgelet({owner_id: props.profile.id, page})

        return publicBadgelet
    }

    const [needUpdate, _] = useEvent(EVENT.badgeletListUpdate)
    const listWrapperRefBadge = React.createRef<ListUserAssetsMethods>()
    const listWrapperRefBadgeLet = React.createRef<ListUserAssetsMethods>()

    useEffect(() => {
        !!listWrapperRefBadge.current && listWrapperRefBadge.current!.refresh()
        !!listWrapperRefBadgeLet.current && listWrapperRefBadgeLet.current!.refresh()
    }, [props.profile, needUpdate])

    return (<div className={'list-user-recognition'}>
        { !(props.profile as Group).creator &&
            <>
                <div className={'list-title'}>{lang['Badgelet_List_Title']}</div>
                <ListUserAssets
                    queryFcn={getBadgelet}
                    onRef={listWrapperRefBadgeLet}
                    child={(item, key) => <CardBadgelet badgelet={item} key={key}/>}/>

            </>
        }
        <div className={`${noBadge ? 'hide-item' : ''}`}>
            <ListUserAssets
                queryFcn={getBadge}
                onListChange={(list: any) => {
                    setNoBadge(!list.length)
                }}
                onRef={listWrapperRefBadge}
                child={(item, key) => <CardBadge badge={item} key={key}/>}/>
        </div>
    </div>)
}

export default ListUserRecognition
