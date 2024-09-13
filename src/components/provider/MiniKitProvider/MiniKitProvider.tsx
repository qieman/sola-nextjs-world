"use client";

import { ReactNode, useEffect } from "react";
const minkitLib = require('@worldcoin/minikit-js')

export default function MiniKitProvider({ children }: { children: ReactNode }) {
    useEffect(() => {
        minkitLib.MiniKit.install();
    }, []);

    return <>{children}</>;
}
