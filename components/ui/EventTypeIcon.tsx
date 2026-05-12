import React from 'react';
import {
  Wrench,
  Hammer,
  ClipboardCheck,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  StickyNote,
  LucideIcon,
} from 'lucide-react-native';
import { COLORS } from '../../constants/theme';

export const EVENT_TYPE_ICON_MAP: Record<string, LucideIcon> = {
  maintenance: Wrench,
  repair: Hammer,
  inspection: ClipboardCheck,
  cleaning: Sparkles,
  replacement: RefreshCw,
  incident: AlertTriangle,
  warranty: ShieldCheck,
  note: StickyNote,
};

interface EventTypeIconProps {
  eventType: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function EventTypeIcon({
  eventType,
  size = 16,
  color = COLORS.textSecondary,
  strokeWidth = 1.75,
}: EventTypeIconProps) {
  const Icon = EVENT_TYPE_ICON_MAP[eventType] ?? StickyNote;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

export default EventTypeIcon;
