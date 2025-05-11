"use client";

import CirclesSDKContext from "@/app/lib/circles";
import { PasanakuABI } from "@/app/lib/pasanaku";
import { ConnectButton } from "@/components/ConnectButton";
import { DepositButton } from "@/components/DepositButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { WithdrawButton } from "@/components/WithdrawButton";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { formatEther } from "viem";
import { useConfig, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";

export default function PasanakuPage() {
  const { pasanakuAddress } = useParams();
  const { sdk, isConnected } = useContext(CirclesSDKContext)!;
  const config = useConfig();
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [isRoundEnded, setIsRoundEnded] = useState(false);

  const { data: potAmount } = useReadContract({
    abi: PasanakuABI,
    address: pasanakuAddress as `0x${string}`,
    functionName: "pot",
  });

  const { data: depositAmount } = useReadContract({
    abi: PasanakuABI,
    address: pasanakuAddress as `0x${string}`,
    functionName: "depositAmount",
  });

  const { data: nextRecipient } = useReadContract({
    abi: PasanakuABI,
    address: pasanakuAddress as `0x${string}`,
    functionName: "nextRecipient",
  });

  const { data: roundStartedAt } = useReadContract({
    abi: PasanakuABI,
    address: pasanakuAddress as `0x${string}`,
    functionName: "roundStartedAt",
  });

  const { data: roundInterval } = useReadContract({
    abi: PasanakuABI,
    address: pasanakuAddress as `0x${string}`,
    functionName: "roundInterval",
  });

  const { data } = useQuery({
    queryKey: ["pasanaku", "memberships", isConnected, pasanakuAddress],
    queryFn: async () => {
      const members = await readContract(config, {
        abi: PasanakuABI,
        address: pasanakuAddress as `0x${string}`,
        functionName: "getParticipants",
      });

      const membersWithAvatar = await Promise.all(
        members.map(async (member) => {
          const avatar = await sdk?.getAvatar(member);
          const profile = await avatar?.getProfile();
          const hasContributed = await readContract(config, {
            abi: PasanakuABI,
            address: pasanakuAddress as `0x${string}`,
            functionName: "hasContributed",
            args: [member],
          });
          return {
            address: member,
            name: profile?.name ?? "Unknown",
            initials: profile?.name?.slice(0, 2) ?? "??",
            paid: hasContributed,
            picture: profile?.previewImageUrl,
          };
        })
      );

      return membersWithAvatar;
    },
  });

  const members =
    data?.map((avatar) => ({
      address: avatar.address,
      name: avatar?.name ?? "Unknown",
      initials: avatar?.initials ?? "??",
      paid: avatar?.paid ?? false,
      picture: avatar?.picture,
    })) ?? [];

  const currentBeneficiary =
    nextRecipient !== undefined ? members[Number(nextRecipient)] : undefined;

  const depositedMembers = members.filter((member) => member.paid).length;
  const totalMembers = members.length;

  useEffect(() => {
    if (roundStartedAt === undefined || roundInterval === undefined) return;

    const calculateRemainingTime = () => {
      const endTime = Number(roundStartedAt) + Number(roundInterval);
      const now = Math.floor(Date.now() / 1000);
      const remaining = endTime - now;

      if (remaining <= 0) {
        setRemainingTime("Round ended");
        setIsRoundEnded(true);
        return;
      }

      setIsRoundEnded(false);
      const days = Math.floor(remaining / (24 * 60 * 60));
      const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
      const minutes = Math.floor((remaining % (60 * 60)) / 60);
      const seconds = Math.floor(remaining % 60);

      if (days > 0) {
        setRemainingTime(`${days} days left`);
      } else if (hours > 0) {
        setRemainingTime(`${hours} hours left`);
      } else if (minutes > 0) {
        setRemainingTime(`${minutes} minutes left`);
      } else {
        setRemainingTime(`${seconds} seconds left`);
      }
    };

    calculateRemainingTime();
    const interval = setInterval(calculateRemainingTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [roundStartedAt, roundInterval]);

  if (!isConnected) {
    return (
      <div className="mx-auto max-w-md p-4">
        <div className="flex justify-center mb-6">
          <ConnectButton />
        </div>
        <div className="text-center text-gray-600">
          Please connect your wallet to view the Pasanaku details
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      {/* Connect Button */}
      <div className="flex justify-center mb-6">
        <ConnectButton />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold text-center mb-6 tracking-tight">
        Tim Tam Deluxe
      </h1>

      {/* Card: Total round value */}
      <Card className="mb-6 flex flex-col items-center">
        <CardHeader className="w-full flex flex-col items-center p-0 mb-2">
          <span className="text-sm font-medium text-gray-700 mb-1">
            Total round value
          </span>
          <CardTitle className="text-4xl font-bold text-gray-900 mb-1">
            {formatEther(potAmount ?? BigInt(0))} $CRC
          </CardTitle>
          <span className="text-sm text-red-500 mb-3">{remainingTime}</span>
        </CardHeader>
        <CardContent className="w-full flex flex-col items-center p-0 mb-3">
          <Progress
            value={(depositedMembers / totalMembers) * 100}
            className="w-full mb-1"
          />
          <span className="text-xs text-gray-600">
            {depositedMembers} out of {totalMembers} members deposited
          </span>
        </CardContent>
        <div className="w-full px-6 mb-1 flex flex-col gap-2">
          <DepositButton pasanakuAddress={pasanakuAddress as string} />
          {isRoundEnded && depositedMembers > 0 && (
            <WithdrawButton pasanakuAddress={pasanakuAddress as string} />
          )}
        </div>
        <span className="text-xs text-gray-500 mb-2">
          {formatEther(depositAmount ?? BigInt(0))} $CRC per member
        </span>
      </Card>

      {/* Card: Current beneficiary & Queue */}
      <Card className="mb-6">
        <CardContent className="p-0">
          <div className="mb-4 px-6">
            <span className="font-semibold text-sm text-gray-700 mb-1 block">
              Current beneficiary
            </span>
            <div className="flex items-center gap-3 mt-1">
              <Avatar>
                <AvatarImage
                  src={currentBeneficiary?.picture}
                  alt={currentBeneficiary?.name}
                />
                <AvatarFallback>
                  {currentBeneficiary?.initials ?? "??"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium text-gray-800">
                {currentBeneficiary?.name ?? "Unknown"}
              </span>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="px-6">
            <span className="font-semibold text-sm text-gray-700 mb-2 block">
              Queue
            </span>
            <div className="flex flex-col gap-2">
              {members.map((member, idx) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        idx === Number(nextRecipient)
                          ? "bg-blue-900"
                          : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <Avatar>
                      <AvatarImage src={member.picture} alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`text-gray-800 text-sm ${
                        idx === 0 ? "font-semibold" : ""
                      }`}
                    >
                      {member.name}
                    </span>
                  </div>
                  <div>
                    {member.paid ? (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-900 text-white text-base font-bold">
                        $
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-400 text-base font-bold">
                        $
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
