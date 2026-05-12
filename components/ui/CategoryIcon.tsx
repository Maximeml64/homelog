import React from 'react';
import {
  Home, Car, Bike, Flame, Wind, Thermometer, Droplet, Zap,
  Waves, WashingMachine, Trees, Tv, Lock, PawPrint, Box,
  LucideIcon,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  realestate: Home,
  car: Car,
  moto: Bike,
  bike: Bike,
  scooter: Bike,
  boiler: Flame,
  ac: Wind,
  heatpump: Thermometer,
  waterheater: Droplet,
  energy: Zap,
  pool: Waves,
  appliance: WashingMachine,
  garden: Trees,
  multimedia: Tv,
  security: Lock,
  pet: PawPrint,
  other: Box,
};

interface CategoryIconProps {
  categoryId: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function CategoryIcon({
  categoryId,
  size = 22,
  color = COLORS.primary,
  strokeWidth = 1.75,
}: CategoryIconProps) {
  const Icon = CATEGORY_ICON_MAP[categoryId] ?? Box;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

export default CategoryIcon;
