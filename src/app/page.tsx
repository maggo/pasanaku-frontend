"use client";

import CirclesSDKContext, { createGroup } from "@/app/lib/circles";
import { ConnectButton } from "@/components/ConnectButton";
import Image from "next/image";
import { useContext, useState } from "react";

export default function Home() {
  return (
    <div className={"pages"}>
      <Image src="/reown.svg" alt="Reown" width={150} height={150} priority />
      <h1>AppKit Wagmi Next.js App Router Example</h1>

      <ConnectButton />
      <CreateGroupForm />
    </div>
  );
}

function CreateGroupForm() {
  const { sdk } = useContext(CirclesSDKContext)!;
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Group</h2>
      <p className="text-gray-600 mb-6">
        Create a new group to start sharing your tokens.
      </p>

      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter group name"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter token symbol"
          />
        </div>

        <button
          onClick={() => {
            if (sdk) {
              createGroup(sdk, name, symbol);
            }
          }}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Create Group
        </button>
      </div>
    </div>
  );
}
