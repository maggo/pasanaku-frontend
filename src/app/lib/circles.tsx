import { BrowserProviderContractRunner } from "@circles-sdk/adapter-ethers";
import { GroupProfile } from "@circles-sdk/profiles";
import { Sdk } from "@circles-sdk/sdk";
import { useAppKitProvider } from "@reown/appkit/react";
import type { Provider } from "ethers";
import { BrowserProvider } from "ethers";
import React, { createContext, useCallback, useEffect, useState } from "react";

type CirclesSDKContextType = {
  sdk: Sdk | null;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
  adapter: BrowserProviderContractRunner | null;
  circlesProvider: Provider | null;
  circlesAddress: `0x${string}` | null;
  initSdk: () => Promise<void>;
};

// Create a context for the Circles SDK
const CirclesSDKContext = createContext<CirclesSDKContextType | null>(null);

// Provider component to wrap around your application
export const CirclesSDK = ({ children }: { children: React.ReactNode }) => {
  const [sdk, setSdk] = useState<Sdk | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [adapter, setAdapter] = useState<BrowserProviderContractRunner | null>(
    null
  );
  const [circlesProvider, setCirclesProvider] = useState<Provider | null>(null);
  const [circlesAddress, setCirclesAddress] = useState<`0x${string}` | null>(
    null
  );

  // Configuration for the Circles SDK on Gnosis Chain
  const circlesConfig = {
    circlesRpcUrl: "https://rpc.aboutcircles.com/",
    pathfinderUrl: "https://pathfinder.aboutcircles.com",
    v1HubAddress: "0x29b9a7fbb8995b2423a71cc17cf9810798f6c543",
    v2HubAddress: "0xc12C1E50ABB450d6205Ea2C3Fa861b3B834d13e8",
    nameRegistryAddress: "0xA27566fD89162cC3D40Cb59c87AAaA49B85F3474",
    migrationAddress: "0xD44B8dcFBaDfC78EA64c55B705BFc68199B56376",
    profileServiceUrl: "https://rpc.aboutcircles.com/profiles/",
    baseGroupFactory: "0xD0B5Bd9962197BEaC4cbA24244ec3587f19Bd06d",
    coreMembersGroupDeployer: "0xFEca40Eb02FB1f4F5F795fC7a03c1A27819B1Ded",
  } as const;

  const { walletProvider } = useAppKitProvider("eip155");

  // Function to initialize the SDK
  const initSdk = useCallback(async () => {
    if (!walletProvider) {
      setIsConnected(false);
      return;
    }
    try {
      // Create and initialize the adapter
      const adapter = new BrowserProviderContractRunner();
      const ethersProvider = new BrowserProvider(walletProvider as any);
      adapter.provider = ethersProvider;
      await adapter.init(); // Initialize the adapter before using it

      setAdapter(adapter);

      // Get the provider and address
      const provider = adapter.provider;
      setCirclesProvider(provider);

      const address = adapter.address;
      setCirclesAddress(address ?? null);

      // Create the SDK instance with the config and adapter
      const sdk = new Sdk(adapter, circlesConfig);
      setSdk(sdk);
      setIsConnected(true);
    } catch (error) {
      console.error("Error initializing SDK:", error);
      setIsConnected(false);
    }
  }, [walletProvider]);

  useEffect(() => {
    initSdk();
  }, [initSdk, walletProvider]);

  return (
    <CirclesSDKContext.Provider
      value={{
        sdk,
        isConnected,
        setIsConnected,
        adapter,
        circlesProvider,
        circlesAddress,
        initSdk,
      }}
    >
      {children}
    </CirclesSDKContext.Provider>
  );
};

export default CirclesSDKContext;

export async function createGroup(sdk: Sdk, name: string, symbol: string) {
  const mintPolicy = "0x5Ea08c967C69255d82a4d26e36823a720E7D0317";
  const groupProfile: GroupProfile = {
    name: name,
    symbol: symbol,
  };
  const GroupAvatar = await sdk.registerGroupV2(mintPolicy, groupProfile);

  // Log the newly created group avatar details
  console.log("New Group Avatar:", GroupAvatar);
}
