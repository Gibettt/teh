import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AlertTriangle, ChevronDown, Wallet } from "lucide-react";

export default function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        authenticationStatus,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {!connected ? (
              <button className="wallet-chip" onClick={openConnectModal} type="button">
                <Wallet size={16} />
                <span>Connect Wallet</span>
              </button>
            ) : chain.unsupported ? (
              <button className="wallet-chip wallet-chip-warning" onClick={openChainModal} type="button">
                <AlertTriangle size={16} />
                <span>Wrong Network</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="wallet-chip hidden sm:inline-flex" onClick={openChainModal} type="button">
                  {chain.hasIcon && chain.iconUrl ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white/70 bg-white">
                      <img alt={chain.name ?? "Chain icon"} className="h-5 w-5" src={chain.iconUrl} />
                    </span>
                  ) : (
                    <Wallet size={15} />
                  )}
                  <span>{chain.name}</span>
                </button>
                <button className="wallet-chip wallet-chip-strong" onClick={openAccountModal} type="button">
                  <Wallet size={16} />
                  <span>{account.displayName}</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
