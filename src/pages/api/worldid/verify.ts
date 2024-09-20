import {NextApiRequest, NextApiResponse} from "next/dist/shared/lib/utils";
import {solanaLogin} from "@/service/solas";

const MiniKitLib = require('@worldcoin/minikit-js')


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {payload, nonce} = req.body as {payload: any, nonce: string}

    console.log('payload', payload)
    console.log('nonce', nonce)

    try {
        const validMessage = await MiniKitLib.verifySiweMessage(payload, nonce);
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
            message: error.message,
            address: null,
            auth_token: null
        });
    }
}
