import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface AnalysisData {
  tasks?: any[];
  employees?: any[];
  departments?: any[];
  leads?: any[];
  meetings?: any[];
  completionRate?: number;
  delayedTasks?: number;
}

type AnalysisType = 'performance' | 'workload' | 'risks' | 'recommendations' | 'executive_summary' | 'daily_priorities';

interface AnalysisResult {
  content: string;
  loading: boolean;
  error: string | null;
}

export const useAIAnalysis = () => {
  const { language } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [results, setResults] = useState<Record<AnalysisType, AnalysisResult>>({
    performance: { content: '', loading: false, error: null },
    workload: { content: '', loading: false, error: null },
    risks: { content: '', loading: false, error: null },
    recommendations: { content: '', loading: false, error: null },
    executive_summary: { content: '', loading: false, error: null },
    daily_priorities: { content: '', loading: false, error: null },
  });

  const analyze = async (
    type: AnalysisType,
    data: AnalysisData
  ) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setResults(prev => ({
      ...prev,
      [type]: { ...prev[type], loading: true, error: null },
    }));

    try {
      const { data: result, error } = await supabase.functions.invoke('ai-analyze', {
        body: { type, data, language },
      });

      if (error) throw error;

      if (result?.error) {
        toast.error(result.error);
        setResults(prev => ({
          ...prev,
          [type]: { content: '', loading: false, error: result.error },
        }));
        return null;
      }

      setAnalysis(result?.analysis || null);
      setResults(prev => ({
        ...prev,
        [type]: { content: result?.analysis || '', loading: false, error: null },
      }));
      return result?.analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      const errorMsg = language === 'ar' ? 'حدث خطأ في التحليل' : 'Analysis error occurred';
      toast.error(errorMsg);
      setResults(prev => ({
        ...prev,
        [type]: { content: '', loading: false, error: errorMsg },
      }));
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyze, isAnalyzing, analysis, setAnalysis, results };
};