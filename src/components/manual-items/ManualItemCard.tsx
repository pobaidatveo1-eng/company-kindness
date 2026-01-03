import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Calendar, 
  User,
  Camera,
  Users,
  MapPin,
  FileText,
  StickyNote,
  MoreHorizontal
} from 'lucide-react';
import { ManualItem } from '@/hooks/useManualItems';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ManualItemCardProps {
  item: ManualItem;
  onEdit: (item: ManualItem) => void;
  onDelete: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  photoshoot: <Camera className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  site_visit: <MapPin className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
  other: <MoreHorizontal className="h-4 w-4" />,
};

const typeLabels: Record<string, { en: string; ar: string }> = {
  photoshoot: { en: 'Photoshoot', ar: 'جلسة تصوير' },
  meeting: { en: 'Meeting', ar: 'اجتماع' },
  site_visit: { en: 'Site Visit', ar: 'زيارة موقع' },
  document: { en: 'Document', ar: 'وثيقة' },
  note: { en: 'Note', ar: 'ملاحظة' },
  other: { en: 'Other', ar: 'أخرى' },
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
};

const ManualItemCard: React.FC<ManualItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  canEdit = true,
  canDelete = true,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const title = isArabic && item.title_ar ? item.title_ar : item.title;
  const description = isArabic && item.description_ar ? item.description_ar : item.description;
  const typeLabel = typeLabels[item.type] || typeLabels.other;
  const assignedName = item.assigned_profile
    ? isArabic && item.assigned_profile.full_name_ar
      ? item.assigned_profile.full_name_ar
      : item.assigned_profile.full_name
    : null;

  const statusLabels: Record<string, { en: string; ar: string }> = {
    pending: { en: 'Pending', ar: 'معلق' },
    in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
    completed: { en: 'Completed', ar: 'مكتمل' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
  };

  const priorityLabels: Record<string, { en: string; ar: string }> = {
    low: { en: 'Low', ar: 'منخفض' },
    medium: { en: 'Medium', ar: 'متوسط' },
    high: { en: 'High', ar: 'عالي' },
    urgent: { en: 'Urgent', ar: 'عاجل' },
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary">
                {typeIcons[item.type] || typeIcons.other}
              </span>
              <span className="text-xs text-muted-foreground">
                {isArabic ? typeLabel.ar : typeLabel.en}
              </span>
            </div>

            <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>

            {description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusColors[item.status]}>
                {isArabic ? statusLabels[item.status]?.ar : statusLabels[item.status]?.en}
              </Badge>
              <Badge variant="outline" className={priorityColors[item.priority]}>
                {isArabic ? priorityLabels[item.priority]?.ar : priorityLabels[item.priority]?.en}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
              {item.date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(item.date), 'PP', { locale: isArabic ? ar : undefined })}
                  </span>
                </div>
              )}
              {assignedName && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{assignedName}</span>
                </div>
              )}
            </div>
          </div>

          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="h-4 w-4 me-2" />
                    {isArabic ? 'تعديل' : 'Edit'}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(item.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {isArabic ? 'حذف' : 'Delete'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualItemCard;
