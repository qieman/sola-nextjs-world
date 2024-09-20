import {NextApiRequest, NextApiResponse} from "next/dist/shared/lib/utils";
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from "@worldcoin/minikit-js";
import {solanaLogin} from "@/service/solas";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {payload, nonce} = req.body as {payload: MiniAppWalletAuthSuccessPayload, nonce: string}

    console.log('payload', payload)
    console.log('nonce', nonce)

    try {
        const validMessage = await verifySiweMessage(payload, nonce);
        const auth_token = solanaLogin({
            sol_address: payload.address,
            next_token: process.env.NEXT_TOKEN || '',
            host: req.headers.host || ''
        });

        res.status(200).send({
            address: payload.address,
            auth_token
        });

    } catch (error: any) {
        // Handle errors in validation or processing
        console.error(error);
        res.status(200).send({
            address: null,
            auth_token: null
        });
    }
}
