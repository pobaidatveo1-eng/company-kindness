import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  type: 'performance' | 'workload' | 'risks' | 'recommendations' | 'executive_summary' | 'daily_priorities';
  data: {
    tasks?: any[];
    employees?: any[];
    departments?: any[];
    leads?: any[];
    meetings?: any[];
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
    // 1. Extract and verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify user with Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Verify user has a company (is properly set up)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      console.error('User not associated with a company:', user.id);
      return new Response(
        JSON.stringify({ error: 'User not associated with a company' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Check API key configuration
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      throw new Error('AI service not configured');
    }

    // 5. Parse and process request
    const { type, data, language }: AnalysisRequest = await req.json();
    
    console.log('AI analysis requested:', { type, userId: user.id, companyId: profile.company_id });

    const systemPrompts: Record<string, string> = {
      performance: language === 'ar' 
        ? `أنت محلل أداء ذكي لوكالة تسويق. قم بتحليل بيانات المهام والفريق وقدم تقييماً شاملاً للأداء:
- نسبة الإنجاز والمقارنة بالأهداف
- أداء الأقسام المختلفة
- الموظفين الأكثر إنتاجية
- نقاط القوة والضعف
كن موجزاً ومحدداً. قدم النتائج بتنسيق واضح.`
        : `You are a smart performance analyst for a marketing agency. Analyze task and team data and provide a comprehensive performance evaluation:
- Completion rate and comparison to goals
- Department performance
- Top performing employees
- Strengths and weaknesses
Be concise and specific. Present results in a clear format.`,
      
      workload: language === 'ar'
        ? `أنت خبير في توازن أحمال العمل. حلل توزيع المهام على الموظفين والأقسام:
- من يعاني من ضغط زائد (أكثر من المتوسط)
- من لديه طاقة إضافية
- توصيات محددة لإعادة التوزيع
- تحذيرات من الاحتراق الوظيفي
قدم التوصيات بشكل عملي ومباشر.`
        : `You are a workload balance expert. Analyze task distribution across employees and departments:
- Who is overloaded (above average)
- Who has extra capacity
- Specific redistribution recommendations
- Burnout warnings
Provide practical and direct recommendations.`,
      
      risks: language === 'ar'
        ? `أنت محلل مخاطر متخصص. حدد المخاطر المحتملة:
🔴 مخاطر عالية: المهام المتأخرة بشكل كبير، عملاء معرضين للخطر
🟡 مخاطر متوسطة: مهام قريبة من الموعد، ضغط متزايد
🟢 مخاطر منخفضة: مؤشرات تحتاج مراقبة
لكل خطر، قدم التأثير المتوقع وخطوات التخفيف.`
        : `You are a specialized risk analyst. Identify potential risks:
🔴 High risks: Significantly delayed tasks, at-risk clients
🟡 Medium risks: Tasks nearing deadlines, increasing pressure
🟢 Low risks: Indicators that need monitoring
For each risk, provide expected impact and mitigation steps.`,
      
      recommendations: language === 'ar'
        ? `أنت مستشار إداري ذكي. بناءً على البيانات، قدم 5 توصيات عملية:
1. التوصية ونوعها (عاجلة/هامة/تحسينية)
2. الفائدة المتوقعة
3. خطوات التنفيذ
4. المسؤول المقترح
رتب التوصيات حسب الأولوية والتأثير.`
        : `You are a smart management consultant. Based on the data, provide 5 practical recommendations:
1. Recommendation and type (urgent/important/improvement)
2. Expected benefit
3. Implementation steps
4. Suggested responsible party
Rank recommendations by priority and impact.`,

      executive_summary: language === 'ar'
        ? `أنت كاتب تقارير تنفيذية محترف. اكتب ملخصاً تنفيذياً شاملاً للإدارة العليا:

📊 نظرة عامة على صحة الشركة
✅ أهم الإنجازات هذه الفترة
⚠️ أهم التحديات والمخاطر
📈 المؤشرات الرئيسية (KPIs)
🎯 التوقعات والتوصيات للفترة القادمة

اكتب بأسلوب احترافي ومختصر مناسب للمدراء التنفيذيين.`
        : `You are a professional executive report writer. Write a comprehensive executive summary for senior management:

📊 Company Health Overview
✅ Key Achievements This Period
⚠️ Key Challenges and Risks
📈 Key Performance Indicators (KPIs)
🎯 Outlook and Recommendations for Next Period

Write in a professional and concise style suitable for executives.`,

      daily_priorities: language === 'ar'
        ? `أنت مساعد إنتاجية ذكي. بناءً على المهام والبيانات، حدد أولويات اليوم:

🔥 المهام العاجلة (يجب إنجازها اليوم)
⚡ المهام الهامة (تحتاج اهتمام)
📋 المهام الروتينية (يمكن تأجيلها إذا لزم)

لكل مهمة، اذكر:
- سبب الأولوية
- الوقت المقترح للإنجاز
- تحذيرات إن وجدت

قدم نصائح عملية لإدارة الوقت بفعالية.`
        : `You are an intelligent productivity assistant. Based on tasks and data, set today's priorities:

🔥 Urgent Tasks (must be done today)
⚡ Important Tasks (need attention)
📋 Routine Tasks (can be postponed if needed)

For each task, mention:
- Reason for priority
- Suggested time for completion
- Warnings if any

Provide practical tips for effective time management.`,
    };

    const userMessage = JSON.stringify({
      summary: {
        totalTasks: data.tasks?.length || 0,
        completedTasks: data.tasks?.filter((t: any) => t.status === 'completed').length || 0,
        delayedTasks: data.delayedTasks || 0,
        completionRate: data.completionRate || 0,
        totalEmployees: data.employees?.length || 0,
        departments: data.departments?.length || 0,
        totalLeads: data.leads?.length || 0,
        upcomingMeetings: data.meetings?.filter((m: any) => m.status === 'scheduled').length || 0,
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
      leadsByStatus: data.leads ? {
        new: data.leads?.filter((l: any) => l.status === 'new').length || 0,
        interested: data.leads?.filter((l: any) => l.status === 'interested').length || 0,
        closedWon: data.leads?.filter((l: any) => l.status === 'closed_won').length || 0,
        closedLost: data.leads?.filter((l: any) => l.status === 'closed_lost').length || 0,
      } : undefined,
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
        max_tokens: 1500,
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

    console.log('AI analysis completed successfully for user:', user.id);

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
