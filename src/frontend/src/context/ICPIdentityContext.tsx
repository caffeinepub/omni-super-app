import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

function generateId777(): string {
  const rand4 = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `+777 ${rand4()} ${rand4()}`;
}

type ICPIdentityContextType = {
  isAuthenticated: boolean;
  principal: string | null;
  activeId777: string | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
};

const ICPIdentityContext = createContext<ICPIdentityContextType | undefined>(
  undefined,
);

export function ICPIdentityProvider({ children }: { children: ReactNode }) {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const [activeId777, setActiveId777] = useState<string | null>(null);

  const principal = useMemo(() => {
    if (!identity) return null;
    const p = identity.getPrincipal();
    if (p.isAnonymous()) return null;
    return p.toString();
  }, [identity]);

  const isAuthenticated = principal !== null;

  useEffect(() => {
    if (!principal) {
      setActiveId777(null);
      return;
    }
    const storageKey = `omni_id_${principal}`;
    let id = localStorage.getItem(storageKey);
    if (!id) {
      id = generateId777();
      localStorage.setItem(storageKey, id);
    }
    setActiveId777(id);
  }, [principal]);

  const value = useMemo<ICPIdentityContextType>(
    () => ({
      isAuthenticated,
      principal,
      activeId777,
      login,
      logout: clear,
      isLoading: isInitializing || isLoggingIn,
    }),
    [
      isAuthenticated,
      principal,
      activeId777,
      login,
      clear,
      isInitializing,
      isLoggingIn,
    ],
  );

  return (
    <ICPIdentityContext.Provider value={value}>
      {children}
    </ICPIdentityContext.Provider>
  );
}

export function useICPIdentity(): ICPIdentityContextType {
  const ctx = useContext(ICPIdentityContext);
  if (!ctx)
    throw new Error("useICPIdentity must be used within ICPIdentityProvider");
  return ctx;
}
