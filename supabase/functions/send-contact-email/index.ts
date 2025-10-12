import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, phone, message }: ContactEmailRequest = await req.json();

    console.log("Sending contact email from:", email);

    // Send email to Phoenix Solutions
    const emailToCompany = await resend.emails.send({
      from: "Phoenix Solutions <onboarding@resend.dev>",
      to: ["hr@phoenixsolutionscareers.com"],
      subject: `New Contact from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    });

    // Send confirmation email to the candidate
    const emailToCandidate = await resend.emails.send({
      from: "Phoenix Solutions <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message!",
      html: `
        <h1>Thank you for contacting Phoenix Solutions, ${name}!</h1>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p>Our team is committed to helping you rise in your career journey.</p>
        <br>
        <p>Best regards,<br>The Phoenix Solutions Team</p>
        <p><em>Like the phoenix, we help you rise from the ashes and soar to new heights.</em></p>
      `,
    });

    console.log("Emails sent successfully:", { emailToCompany, emailToCandidate });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
