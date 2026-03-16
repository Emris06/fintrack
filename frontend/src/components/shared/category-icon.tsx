import {
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  PlusCircle,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Zap,
  Heart,
  Book,
  Plane,
  ShoppingCart,
  Home,
  Shield,
  Repeat,
  Scissors,
  ArrowRight,
  MoreHorizontal,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  laptop: Laptop,
  'trending-up': TrendingUp,
  gift: Gift,
  'plus-circle': PlusCircle,
  utensils: Utensils,
  car: Car,
  'shopping-bag': ShoppingBag,
  film: Film,
  zap: Zap,
  heart: Heart,
  book: Book,
  plane: Plane,
  'shopping-cart': ShoppingCart,
  home: Home,
  shield: Shield,
  repeat: Repeat,
  scissors: Scissors,
  'arrow-right': ArrowRight,
  'more-horizontal': MoreHorizontal,
};

export function CategoryIcon({
  name,
  ...props
}: { name?: string } & React.ComponentProps<LucideIcon>) {
  const Icon = name ? iconMap[name] : undefined;
  if (!Icon) return <HelpCircle {...props} />;
  return <Icon {...props} />;
}
