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
    // Check environment variables
    const webSmsToken = Deno.env.get("WEBSMS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webSmsToken) {
      throw new Error("WEBSMS_TOKEN environment variable is not set");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Clone the request and parse the body once
    const requestBody = await req.clone().json();
    const { employeeId, templateId, monthsBeforeRetirement } = requestBody as RetirementReminderRequest;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log process start with timestamp
    console.log('\n=== SMS Sending Process Started ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Employee ID:', employeeId);
    console.log('Template ID:', templateId);
    console.log('Months before retirement:', monthsBeforeRetirement);

    // Get employee data
    const { data: employee, error: empError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", employeeId)
      .single();

    if (empError) {
      console.error("Employee fetch error:", empError);
      throw new Error(`Employee not found: ${empError.message}`);
    }

    if (!employee) {
      throw new Error("Employee not found");
    }

    console.log('\n[1/5] Employee Information:');
    console.log('Employee Name:', employee.nama);
    console.log('Employee ID:', employee.id);
    console.log('Original Phone:', employee.handphone);

    if (!employee.handphone) {
      throw new Error("Employee does not have a phone number");
    }

    // Normalize phone number for WebSMS (format: 0823456789)
    let phoneNumber = employee.handphone.replace(/\s+/g, "").replace(/-/g, "");
    if (phoneNumber.startsWith("+62")) {
      phoneNumber = "0" + phoneNumber.substring(3);
    } else if (!phoneNumber.startsWith("0")) {
      phoneNumber = "0" + phoneNumber;
    }

    console.log('\n[2/5] Phone Number Processing:');
    console.log('Original Phone:', employee.handphone);
    console.log('Normalized Phone:', phoneNumber);
    
    if (phoneNumber.length < 10 || phoneNumber.length > 14) {
      console.warn('Warning: Phone number length seems unusual');
    }

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

    console.log('\n[3/5] Template Information:');
    console.log('Template Name:', template.template_name);
    console.log('Template Type:', template.template_type);
    console.log('Template Content Length:', template.body_template?.length || 0);

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

    console.log('\n[4/5] Message Preparation:');
    console.log('Original Message Length:', smsBody.length);
    console.log('Message Preview (first 50 chars):', smsBody.substring(0, 50) + (smsBody.length > 50 ? '...' : ''));

    // Check for common issues in message content
    const restrictedWords = ['token', 'otp', 'verification', 'kode', 'validasi'];
    const foundRestrictedWords = restrictedWords.filter(word => 
      smsBody.toLowerCase().includes(word)
    );
    
    if (foundRestrictedWords.length > 0) {
      console.warn('Warning: Message contains potentially restricted words:', foundRestrictedWords);
    }

    // URL encode the message
    const encodedMessage = encodeURIComponent(smsBody);
    console.log('Encoded Message Length:', encodedMessage.length);

    // Prepare and send SMS
    console.log('\n[5/5] Sending SMS Request:');
    
    // WebSMS API endpoint - using the correct format
    const webSmsUrl = 'https://websms.co.id/api/send';
    
    // Prepare request body according to WebSMS API documentation
    const requestBody = {
      phone: phoneNumber,
      message: smsBody,
      token: webSmsToken
    };

    console.log('Sending SMS with details:', {
      to: phoneNumber,
      messageLength: smsBody.length,
      endpoint: webSmsUrl
    });

    let webSmsResponse;
    let responseText;
    let webSmsData;

    try {
      // Make the API request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const startTime = Date.now();
      webSmsResponse = await fetch(webSmsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = Date.now();
      
      console.log(`\n=== SMS API Response (${endTime - startTime}ms) ===`);
      console.log('Status:', webSmsResponse.status, webSmsResponse.statusText);
      
      responseText = await webSmsResponse.text();
      console.log('Raw Response:', responseText);

      try {
        webSmsData = JSON.parse(responseText);
        console.log('Parsed Response:', JSON.stringify(webSmsData, null, 2));
      } catch (e) {
        console.error("Failed to parse WebSMS response:", e);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 200)}`);
      }

      // Check if the response indicates success
      // WebSMS might return status code 200 even for errors, so check the response content
      if (!webSmsResponse.ok || (webSmsData.status && webSmsData.status !== 'success')) {
        console.error('WebSMS API Error:', {
          status: webSmsResponse.status,
          statusText: webSmsResponse.statusText,
          response: webSmsData
        });
        
        // Handle specific WebSMS error messages
        let errorMessage = webSmsData.message || 'Failed to send SMS';
        if (webSmsData.error) {
          errorMessage = webSmsData.error;
        } else if (typeof webSmsData === 'string' && webSmsData.includes('error')) {
          errorMessage = webSmsData;
        }
        
        throw new Error(`WebSMS error: ${errorMessage}`);
      }

      console.log('\n=== SMS Sent Successfully ===');
      console.log('Message ID:', webSmsData.message_id || 'Not provided');
      console.log('Status:', webSmsData.status);
      console.log('Timestamp:', new Date().toISOString());
      
      // Log reminder to Supabase
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
      console.error('\n=== SMS Sending Failed ===');
      console.error('Error:', error.message);
      console.error('Error Type:', error.name);
      console.error('Timestamp:', new Date().toISOString());
      
      if (error.response) {
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Data:', error.response.data);
      }
      
      if (error.config) {
        console.error('Request Config:', {
          url: error.config.url,
          method: error.config.method,
          headers: error.config.headers
        });
      }
      
      console.error('Stack Trace:', error.stack);

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
  } catch (error: any) {
    console.error('\n=== SMS Sending Failed ===');
    console.error('Error:', error.message);
    console.error('Error Type:', error.name);
    console.error('Timestamp:', new Date().toISOString());
    
    if (error.response) {
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Data:', error.response.data);
    }
    
    if (error.config) {
      console.error('Request Config:', {
        url: error.config.url,
        method: error.config.method,
        headers: error.config.headers
      });
    }
    
    console.error('Stack Trace:', error.stack);

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