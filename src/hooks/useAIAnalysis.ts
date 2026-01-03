import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface AnalysisData {
  tasks?: any[];
  employees?: any[];
  departments?: any[];
  completionRate?: number;
  delayedTasks?: number;
}

export const useAIAnalysis = () => {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const analyze = async (
    type: 'performance' | 'workload' | 'risks' | 'recommendations',
    data: AnalysisData
  ) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data: result, error } = await supabase.functions.invoke('ai-analyze', {
        body: { type, data, language },
      });

      if (error) throw error;

      if (result?.error) {
        toast.error(result.error);
        return null;
      }

      setAnalysis(result?.analysis || null);
      return result?.analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error(
        language === 'ar' 
          ? 'حدث خطأ في التحليل' 
          : 'Analysis error occurred'
      );
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyze, isAnalyzing, analysis, setAnalysis };
};