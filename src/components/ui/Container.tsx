import { clsx } from "@/lib/utils/clsx";

export interface ContainerProps {
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  className?: string;
}

const sizeClass = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function Container({ size = "lg", children, className }: ContainerProps) {
  return (
    <div className={clsx("mx-auto w-full px-6 md:px-8", sizeClass[size], className)}>
      {children}
    </div>
  );
}
