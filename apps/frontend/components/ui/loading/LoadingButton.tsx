import { ButtonHTMLAttributes } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  children?: React.ReactNode;
};

export default function LoadingButton({ loading, children, ...props }: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex items-center justify-center ${props.className || ""}`}
    >
      {loading ? (
        <AiOutlineLoading3Quarters className="animate-spin h-5 w-5" />
      ) : (
        children
      )}
    </button>
  );
}