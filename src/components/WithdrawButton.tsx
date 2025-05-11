import { Button } from "@/components/ui/button";
import { PasanakuABI } from "@/app/lib/pasanaku";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";

interface WithdrawButtonProps {
  pasanakuAddress: string;
}

export function WithdrawButton({ pasanakuAddress }: WithdrawButtonProps) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const queryClient = useQueryClient();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Invalidate queries after successful withdraw
  if (isSuccess) {
    queryClient.invalidateQueries({ queryKey: ["pasanaku"] });
  }

  const handleWithdraw = () => {
    writeContract({
      abi: PasanakuABI,
      address: pasanakuAddress as `0x${string}`,
      functionName: "finalise",
    });
  };

  return (
    <Button
      className="w-full bg-green-600 hover:bg-green-700"
      size="lg"
      onClick={handleWithdraw}
      disabled={isPending || isConfirming}
    >
      {isPending || isConfirming
        ? "Processing..."
        : isSuccess
        ? "Withdrawn!"
        : "Withdraw funds"}
    </Button>
  );
}
