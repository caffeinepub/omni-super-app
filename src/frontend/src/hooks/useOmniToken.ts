import { Principal } from "@icp-sdk/core/principal";
import { useCallback, useEffect, useState } from "react";
import type { Transaction } from "../backend.d";
import { useActor } from "./useActor";

export interface UseOmniTokenResult {
  balance: bigint;
  transactions: Transaction[];
  transfer: (toPrincipalStr: string, amount: bigint) => Promise<void>;
  isLoading: boolean;
  isTransferring: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOmniToken(): UseOmniTokenResult {
  const { actor, isFetching } = useActor();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchCount, setFetchCount] = useState(0);
  const refetch = useCallback(() => {
    setFetchCount((c) => c + 1);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchCount used as manual refetch trigger
  useEffect(() => {
    if (!actor || isFetching) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [bal, txs] = await Promise.all([
          actor.getBalance(),
          actor.getMyTransactions(),
        ]);
        if (cancelled) return;

        // Mint initial tokens if balance is 0
        if (bal === BigInt(0)) {
          try {
            await actor.mintInitialTokens();
            const newBal = await actor.getBalance();
            if (!cancelled) setBalance(newBal);
          } catch {
            if (!cancelled) setBalance(bal);
          }
        } else {
          setBalance(bal);
        }

        if (!cancelled) setTransactions(txs);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Bakiye yüklenemedi");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, fetchCount]); // fetchCount triggers refetch

  const transfer = useCallback(
    async (toPrincipalStr: string, amount: bigint) => {
      if (!actor) throw new Error("Aktör hazır değil");
      setIsTransferring(true);
      try {
        const to = Principal.fromText(toPrincipalStr);
        await actor.transferTokens(to, amount);
        await Promise.all([
          actor.getBalance().then(setBalance),
          actor.getMyTransactions().then(setTransactions),
        ]);
      } finally {
        setIsTransferring(false);
      }
    },
    [actor],
  );

  return {
    balance,
    transactions,
    transfer,
    isLoading,
    isTransferring,
    error,
    refetch,
  };
}
