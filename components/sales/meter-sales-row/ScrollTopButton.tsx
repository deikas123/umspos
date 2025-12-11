import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ScrollTopButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollTopButton({ visible, onClick }: ScrollTopButtonProps) {
  if (!visible) {
    return null;
  }

  return (
    <Button
      size='icon'
      className='fixed bottom-6 right-6 rounded-full shadow-lg bg-[#E46020] hover:bg-[#d45518] text-white cursor-pointer h-10 w-10 transition-all hover:scale-105'
      onClick={onClick}>
      <ArrowUp className='h-4 w-4' />
    </Button>
  );
}
