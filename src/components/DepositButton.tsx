import { Button } from "@/components/ui/button";
import { PasanakuABI } from "@/app/lib/pasanaku";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { useContext } from "react";
import CirclesSDKContext from "@/app/lib/circles";
import { useQueryClient } from "@tanstack/react-query";

interface DepositButtonProps {
  pasanakuAddress: string;
}

export function DepositButton({ pasanakuAddress }: DepositButtonProps) {
  const { adapter } = useContext(CirclesSDKContext)!;
  const hubAddress = "0xc12C1E50ABB450d6205Ea2C3Fa861b3B834d13e8";
  const queryClient = useQueryClient();

  const { data: hasContributed, isLoading: isCheckingContribution } =
    useReadContract({
      abi: PasanakuABI,
      address: pasanakuAddress as `0x${string}`,
      functionName: "hasContributed",
      args: [adapter?.address as `0x${string}`],
      query: {
        enabled: !!adapter?.address,
      },
    });

  const { data: isApproved, isLoading: isCheckingApproval } = useReadContract({
    abi: [
      {
        inputs: [
          { name: "account", type: "address" },
          { name: "operator", type: "address" },
        ],
        name: "isApprovedForAll",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
    ],
    address: hubAddress as `0x${string}`,
    functionName: "isApprovedForAll",
    args: [adapter?.address as `0x${string}`, pasanakuAddress as `0x${string}`],
    query: {
      enabled: !!adapter?.address,
    },
  });

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositing,
  } = useWriteContract();

  const { isLoading: isConfirmingApprove, isSuccess: isApprovedSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const { isLoading: isConfirmingDeposit, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({
      hash: depositHash,
    });

  // Invalidate queries after successful deposit
  if (isDepositSuccess) {
    queryClient.invalidateQueries({ queryKey: ["pasanaku"] });
  }

  const handleApprove = async () => {
    if (!adapter?.address) return;

    try {
      await writeApprove({
        abi: [
          {
            inputs: [
              { name: "operator", type: "address" },
              { name: "approved", type: "bool" },
            ],
            name: "setApprovalForAll",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
        address: hubAddress as `0x${string}`,
        functionName: "setApprovalForAll",
        args: [pasanakuAddress as `0x${string}`, true],
      });
    } catch (error) {
      console.error("Error approving token:", error);
    }
  };

  const handleDeposit = () => {
    writeDeposit({
      abi: PasanakuABI,
      address: pasanakuAddress as `0x${string}`,
      functionName: "contribute",
    });
  };

  if (isCheckingContribution || isCheckingApproval) {
    return (
      <Button
        className="w-full bg-blue-900 hover:bg-blue-800"
        size="lg"
        disabled
      >
        Checking status...
      </Button>
    );
  }

  // Don't show the button if user has already contributed
  if (hasContributed) {
    return null;
  }

  if (!isApproved) {
    return (
      <Button
        className="w-full bg-blue-900 hover:bg-blue-800"
        size="lg"
        onClick={handleApprove}
        disabled={isApproving || isConfirmingApprove}
      >
        {isApproving || isConfirmingApprove
          ? "Approving..."
          : isApprovedSuccess
          ? "Approved!"
          : "Approve token"}
      </Button>
    );
  }

  return (
    <Button
      className="w-full bg-blue-900 hover:bg-blue-800"
      size="lg"
      onClick={handleDeposit}
      disabled={isDepositing || isConfirmingDeposit}
    >
      {isDepositing || isConfirmingDeposit
        ? "Processing..."
        : isDepositSuccess
        ? "Deposited!"
        : "Deposit your part"}
    </Button>
  );
}
