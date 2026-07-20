import {
  Home, Star, Trash2, Clock, Cloud, Image, Calendar,
  MessageSquare, FileText, CheckSquare, BookOpen,
  FolderOpen, Share2, Inbox, Send, ShieldAlert,
  StickyNote, ClipboardList, Sparkles, BookImage, Box, Palette,
  Archive, Film, Network, PenTool, TableProperties, Heart,
  Tv, Music, Code2, Users, Clapperboard, MailIcon as Mail, Bot,
  Contact, LayoutTemplate, FolderKanban, Briefcase,
  Layers, BarChart3, Zap, Workflow, Sigma,
  Activity, HardDrive, KeyRound, UserCircle, ShieldCheck, Gauge,
  type LucideIcon,
} from 'lucide-react'

export const ICON_MAP: Record<string, LucideIcon> = {
  Home, Star, Trash2, Clock, Cloud, Image, Calendar,
  MessageSquare, FileText, CheckSquare, BookOpen,
  FolderOpen, Share2, Inbox, Send, ShieldAlert,
  StickyNote, ClipboardList, Sparkles, BookImage, Box, Palette,
  Archive, Film, Network, PenTool, TableProperties, Heart,
  Tv, Music, Code2, Users, Clapperboard, Mail, Bot,
  Contact, LayoutTemplate, FolderKanban, Briefcase,
  Layers, BarChart3, Zap, Workflow, Sigma,
  Activity, HardDrive, KeyRound, UserCircle, ShieldCheck, Gauge,
}

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? Cloud
}
