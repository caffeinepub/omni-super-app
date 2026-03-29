import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Transaction {
    id: bigint;
    to: Principal;
    from: Principal;
    timestamp: bigint;
    amount: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getBalance(): Promise<bigint>;
    getCallerUserRole(): Promise<UserRole>;
    getMyTransactions(): Promise<Array<Transaction>>;
    isCallerAdmin(): Promise<boolean>;
    mintInitialTokens(): Promise<bigint>;
    transferTokens(to: Principal, amount: bigint): Promise<bigint>;
    registerId777(id777: string): Promise<void>;
    getRegisteredId777(): Promise<string | null>;
    lookupPrincipalById777(id777: string): Promise<Principal | null>;
    lookupId777ByPrincipal(p: Principal): Promise<string | null>;
    transferById777(toId777: string, amount: bigint): Promise<bigint>;
}
