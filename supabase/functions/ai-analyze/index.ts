import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  type: 'performance' | 'workload' | 'risks' | 'recommendations';
  data: {
    tasks?: any[];
    employees?: any[];
    departments?: any[];
    completionRate?: number;
    delayedTasks?: number;
  };
  language: 'ar' | 'en';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { type, data, language }: AnalysisRequest = await req.json();

    const systemPrompts: Record<string, string> = {
      performance: language === 'ar' 
        ? `أنت محلل أداء ذكي. قم بتحليل بيانات المهام والفريق وقدم تقييماً شاملاً للأداء مع نقاط القوة والضعف. كن موجزاً ومحدداً. رد بالعربية.`
        : `You are a smart performance analyst. Analyze task and team data and provide a comprehensive performance evaluation with strengths and weaknesses. Be concise and specific.`,
      
      workload: language === 'ar'
        ? `أنت خبير في توازن أحمال العمل. حلل توزيع المهام على الموظفين والأقسام وحدد من يعاني من ضغط زائد ومن لديه طاقة إضافية. قدم توصيات محددة لإعادة التوزيع. رد بالعربية.`
        : `You are a workload balance expert. Analyze task distribution across employees and departments, identify overloaded and underloaded resources. Provide specific redistribution recommendations.`,
      
      risks: language === 'ar'
        ? `أنت محلل مخاطر. حدد المخاطر المحتملة من البيانات مثل المهام المتأخرة، الموظفين المثقلين، الأقسام المتعثرة. صنف المخاطر حسب الخطورة (عالية، متوسطة، منخفضة). رد بالعربية.`
        : `You are a risk analyst. Identify potential risks from data such as delayed tasks, overloaded employees, struggling departments. Classify risks by severity (high, medium, low).`,
      
      recommendations: language === 'ar'
        ? `أنت مستشار إداري ذكي. بناءً على البيانات، قدم 5 توصيات عملية وقابلة للتنفيذ لتحسين الأداء العام. ركز على الأولويات. رد بالعربية.`
        : `You are a smart management consultant. Based on the data, provide 5 practical and actionable recommendations to improve overall performance. Focus on priorities.`,
    };

    const userMessage = JSON.stringify({
      summary: {
        totalTasks: data.tasks?.length || 0,
        completedTasks: data.tasks?.filter((t: any) => t.status === 'completed').length || 0,
        delayedTasks: data.delayedTasks || 0,
        completionRate: data.completionRate || 0,
        totalEmployees: data.employees?.length || 0,
        departments: data.departments?.length || 0,
      },
      tasksByStatus: {
        pending: data.tasks?.filter((t: any) => t.status === 'pending').length || 0,
        inProgress: data.tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
        completed: data.tasks?.filter((t: any) => t.status === 'completed').length || 0,
      },
      tasksByPriority: {
        urgent: data.tasks?.filter((t: any) => t.priority === 'urgent').length || 0,
        high: data.tasks?.filter((t: any) => t.priority === 'high').length || 0,
        medium: data.tasks?.filter((t: any) => t.priority === 'medium').length || 0,
        low: data.tasks?.filter((t: any) => t.priority === 'low').length || 0,
      },
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompts[type] },
          { role: "user", content: userMessage }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: language === 'ar' 
            ? "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" 
            : "Rate limit exceeded, please try again later" 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: language === 'ar' 
            ? "يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي" 
            : "Please add credits to use AI features" 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({ analysis: content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("AI analyze error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});