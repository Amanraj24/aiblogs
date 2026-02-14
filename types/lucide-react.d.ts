declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';
    export interface IconProps extends SVGProps<SVGSVGElement> {
        size?: string | number;
        absoluteStrokeWidth?: boolean;
    }
    export type Icon = FC<IconProps>;

    export const ArrowLeft: Icon;
    export const ArrowRight: Icon;
    export const Book: Icon;
    export const BookOpen: Icon;
    export const BrainCircuit: Icon;
    export const Calendar: Icon;
    export const CalendarClock: Icon;
    export const CaseUpper: Icon;
    export const Check: Icon;
    export const CheckCircle: Icon;
    export const ChevronDown: Icon;
    export const ChevronRight: Icon;
    export const ChevronUp: Icon;
    export const Clock: Icon;
    export const Copy: Icon;
    export const Edit: Icon;
    export const Eye: Icon;
    export const FileText: Icon;
    export const Globe: Icon;
    export const GraduationCap: Icon;
    export const HelpCircle: Icon;
    export const Image: Icon;
    export const LayoutDashboard: Icon;
    export const Lightbulb: Icon;
    export const Loader: Icon;
    export const Lock: Icon;
    export const LogOut: Icon;
    export const Menu: Icon;
    export const PenTool: Icon;
    export const Plus: Icon;
    export const RefreshCw: Icon;
    export const Search: Icon;
    export const Settings: Icon;
    export const Share2: Icon;
    export const Sparkles: Icon;
    export const Star: Icon;
    export const Tag: Icon;
    export const Target: Icon;
    export const Trash2: Icon;
    export const TrendingUp: Icon;
    export const Upload: Icon;
    export const User: Icon;
    export const Wand2: Icon;
    export const Zap: Icon;
}
