import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RetirementReminderRequest {
  employeeId: string;
  templateId?: string;
  monthsBeforeRetirement?: number;
}

const replaceTemplateVariables = (
  template: string,
  employee: any,
  retirementDate: string
): string => {
  return template
    .replace(/\{\{employee_name\}\}/g, employee.nama || "")
    .replace(/\{\{nip\}\}/g, employee.nip || "")
    .replace(/\{\{unit\}\}/g, employee.unit || "")
    .replace(/\{\{position\}\}/g, employee.jabatan || "")
    .replace(/\{\{retirement_date\}\}/g, retirementDate)
    .replace(/\{\{app_url\}\}/g, "https://tempo.lovable.app")
    .replace(/\{\{contact_phone\}\}/g, "+62-xxx-xxx-xxxx");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webSmsToken = Deno.env.get("WEBSMS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!webSmsToken) {
      throw new Error("WEBSMS_TOKEN environment variable is not set");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { employeeId, templateId, monthsBeforeRetirement } =
      (await req.json()) as RetirementReminderRequest;

    console.log("Processing SMS reminder for employee:", employeeId);

    // Get employee data
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (empError || !employee) {
      throw new Error(`Employee not found: ${empError?.message}`);
    }

    console.log("Employee found:", employee.nama);

    if (!employee.handphone) {
      throw new Error("Employee does not have a phone number");
    }

    // Normalize phone number for WebSMS (format: 0823456789)
    let phoneNumber = employee.handphone.replace(/\s+/g, "").replace(/-/g, "");
    if (phoneNumber.startsWith("+62")) {
      phoneNumber = "0" + phoneNumber.substring(3);
    } else if (phoneNumber.startsWith("62")) {
      phoneNumber = "0" + phoneNumber.substring(2);
    } else if (!phoneNumber.startsWith("0")) {
      phoneNumber = "0" + phoneNumber;
    }

    console.log("Normalized phone number:", phoneNumber);

    // Get template
    let template;
    if (templateId) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (error) {
        console.error("Template fetch error:", error);
        throw new Error(`Template not found: ${error.message}`);
      }
      template = data;
    } else if (monthsBeforeRetirement) {
      const { data, error } = await supabase
        .from("retirement_reminder_templates")
        .select("*")
        .eq("template_type", "sms")
        .eq("months_before_retirement", monthsBeforeRetirement)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (error) {
        console.error("Template fetch error:", error);
        throw new Error(`Template not found: ${error.message}`);
      }
      template = data;
    } else {
      throw new Error("Either templateId or monthsBeforeRetirement required");
    }

    if (!template) {
      throw new Error("Template not found");
    }

    console.log("Template found:", template.template_name);

    // Calculate retirement date
    const retirementDate = employee.tmt_pensiun
      ? new Date(employee.tmt_pensiun).toLocaleDateString("id-ID")
      : "Belum ditentukan";

    // Replace template variables
    let smsBody = replaceTemplateVariables(
      template.body_template,
      employee,
      retirementDate
    );

    console.log("SMS body prepared, length:", smsBody.length);

    // URL encode the message
    const encodedMessage = encodeURIComponent(smsBody);

    // Send SMS using WebSMS - menggunakan POST dengan query parameters
    console.log("Sending SMS to:", phoneNumber);
    const webSmsUrl = `https://websms.co.id/api/smsgateway`;

    const webSmsResponse = await fetch(webSmsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: `token=${webSmsToken}&to=${phoneNumber}&msg=${encodedMessage}`
    });

    const responseText = await webSmsResponse.text();
    console.log("WebSMS raw response:", responseText);

    let webSmsData;
    try {
      webSmsData = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse WebSMS response:", e);
      throw new Error(`WebSMS returned non-JSON response: ${responseText}`);
    }

    console.log("WebSMS parsed response:", webSmsData);

    if (webSmsData.status !== "success") {
      throw new Error(`WebSMS error: ${webSmsData.message || 'Failed to send SMS'}`);
    }

    console.log("SMS sent successfully:", webSmsData);

    // Log the sent reminder
    const { error: logError } = await supabase
      .from("retirement_reminders_sent")
      .insert({
        employee_id: employeeId,
        reminder_type: "sms",
        template_id: template.id,
        status: "sent",
        metadata: {
          phone: phoneNumber,
          websms_response: webSmsData,
        },
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Retirement reminder SMS sent successfully",
        response: webSmsData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-retirement-reminder-sms:", error);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});