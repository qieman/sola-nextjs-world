import {NextApiRequest, NextApiResponse} from "next/dist/shared/lib/utils";
import {verifySiweMessage} from "@/libs/minikit";
import {wordIdLogin} from "@/service/solas";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {payload, nonce} = req.body as {payload: any, nonce: string}

    console.info('payload', payload)
    console.info('nonce', nonce)

    try {
        const validMessage = await verifySiweMessage(payload, nonce);
        const auth_token = await wordIdLogin({
            address: payload.address,
            next_token: process.env.NEXT_TOKEN || '',
            host: req.headers.host || ''
        });

        res.status(200).send({
            address: payload.address,
            auth_token
        });

    } catch (error: any) {
        // Handle errors in validation or processing
        console.info(error);
        res.status(200).send({
            message: error.message,
            address: null,
            auth_token: null
        });
        throw new Error(error);
    }
}
