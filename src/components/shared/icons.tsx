import {
  Handbag,
  Heart,
  List,
  MagnifyingGlass,
  X as PhosphorX,
  User,
} from "@phosphor-icons/react/dist/ssr";

interface IconProps {
  className?: string;
}

export function SearchIcon({ className }: IconProps) {
  return <MagnifyingGlass weight="duotone" className={className} />;
}

export function HeartIcon({ className }: IconProps) {
  return <Heart weight="duotone" className={className} />;
}

export function UserIcon({ className }: IconProps) {
  return <User weight="duotone" className={className} />;
}

export function HandbagIcon({ className }: IconProps) {
  return <Handbag weight="duotone" className={className} />;
}

export function MenuIcon({ className }: IconProps) {
  return <List weight="duotone" className={className} />;
}

export function CloseIcon({ className }: IconProps) {
  return <PhosphorX weight="bold" className={className} />;
}

export function InstagramGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.2c3.2 0 3.6 0 4.8.07 1.2.05 1.8.25 2.2.42.6.22 1 .5 1.5 1 .5.5.78.9 1 1.5.17.4.37 1 .42 2.2.07 1.2.08 1.6.08 4.8s0 3.6-.08 4.8c-.05 1.2-.25 1.8-.42 2.2-.22.6-.5 1-1 1.5-.5.5-.9.78-1.5 1-.4.17-1 .37-2.2.42-1.2.07-1.6.08-4.8.08s-3.6 0-4.8-.08c-1.2-.05-1.8-.25-2.2-.42-.6-.22-1-.5-1.5-1-.5-.5-.78-.9-1-1.5-.17-.4-.37-1-.42-2.2C2.21 15.6 2.2 15.2 2.2 12s0-3.6.08-4.8c.05-1.2.25-1.8.42-2.2.22-.6.5-1 1-1.5.5-.5.9-.78 1.5-1 .4-.17 1-.37 2.2-.42C8.4 2.21 8.8 2.2 12 2.2zm0 1.8c-3.14 0-3.51 0-4.74.07-1.14.05-1.76.24-2.17.4-.55.22-.94.47-1.36.89-.42.42-.67.81-.89 1.36-.16.41-.35 1.03-.4 2.17C2.37 8.49 2.36 8.86 2.36 12s0 3.51.07 4.74c.05 1.14.24 1.76.4 2.17.22.55.47.94.89 1.36.42.42.81.67 1.36.89.41.16 1.03.35 2.17.4 1.23.06 1.6.07 4.74.07s3.51 0 4.74-.07c1.14-.05 1.76-.24 2.17-.4.55-.22.94-.47 1.36-.89.42-.42.67-.81.89-1.36.16-.41.35-1.03.4-2.17.06-1.23.07-1.6.07-4.74s0-3.51-.07-4.74c-.05-1.14-.24-1.76-.4-2.17a3.68 3.68 0 0 0-.89-1.36 3.68 3.68 0 0 0-1.36-.89c-.41-.16-1.03-.35-2.17-.4C15.51 4 15.14 4 12 4zm0 3.13a4.87 4.87 0 1 1 0 9.74 4.87 4.87 0 0 1 0-9.74zm0 1.8a3.07 3.07 0 1 0 0 6.14 3.07 3.07 0 0 0 0-6.14zm5.08-2a1.14 1.14 0 1 1 0 2.28 1.14 1.14 0 0 1 0-2.28z" />
    </svg>
  );
}
