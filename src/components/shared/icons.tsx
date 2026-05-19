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
