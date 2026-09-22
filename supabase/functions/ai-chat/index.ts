import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ChatRequest {
  readonly message?: unknown;
  readonly conversationId?: unknown;
  readonly capability?: unknown;
  readonly language?: unknown;
  readonly attachments?: unknown;
  readonly requestId?: unknown;
}

interface AuthenticatedUser {
  readonly id: string;
}

interface ErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly requestId?: string;
}

interface SuccessResponse {
  readonly success: true;
  readonly conversationId: string;
  readonly message: {
    readonly id: string;
    readonly conversationId: string;
    readonly userId: string;
    readonly role: "assistant";
    readonly content: string;
    readonly status: "completed";
    readonly attachments: readonly [];
    readonly capabilityId?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function jsonResponse(
  body: ErrorResponse | SuccessResponse,
  status: number,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function getString(
  value: unknown,
): string | null {
  return typeof value === "string"
    ? value
    : null;
}

function getOptionalString(
  value: unknown,
): string | undefined {
  const stringValue =
    getString(value);

  if (
    stringValue === null ||
    stringValue.trim().length === 0
  ) {
    return undefined;
  }

  return stringValue;
}

function createRequestId(
  value: unknown,
): string {
  const requestId =
    getOptionalString(value);

  return (
    requestId ??
    crypto.randomUUID()
  );
}

function getBearerToken(
  request: Request,
): string | null {
  const authorization =
    request.headers.get(
      "Authorization",
    );

  if (!authorization) {
    return null;
  }

  const match =
    authorization.match(
      /^Bearer\s+(.+)$/i,
    );

  return match?.[1] ?? null;
}

async function getAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser | null> {
  const accessToken =
    getBearerToken(request);

  if (!accessToken) {
    return null;
  }

  const supabaseUrl =
    Deno.env.get(
      "SUPABASE_URL",
    );

  const supabaseAnonKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    );

  if (
    !supabaseUrl ||
    !supabaseAnonKey
  ) {
    throw new Error(
      "Supabase environment configuration is incomplete.",
    );
  }

  const supabase =
    createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        },
      },
    );

  const {
    data,
    error,
  } =
    await supabase.auth.getUser(
      accessToken,
    );

  if (error || !data.user) {
    return null;
  }

  return {
    id: data.user.id,
  };
}

function validateMessage(
  value: unknown,
): string | null {
  const message =
    getString(value);

  if (message === null) {
    return null;
  }

  const normalized =
    message.trim();

  if (
    normalized.length === 0 ||
    normalized.length > 32_000
  ) {
    return null;
  }

  return normalized;
}

function validateCapability(
  value: unknown,
): string | undefined {
  const capability =
    getOptionalString(value);

  if (!capability) {
    return undefined;
  }

  if (
    capability.length > 100
  ) {
    return undefined;
  }

  return capability;
}

async function parseRequest(
  request: Request,
): Promise<ChatRequest | null> {
  try {
    const body =
      await request.json();

    if (!isRecord(body)) {
      return null;
    }

    return body as ChatRequest;
  } catch {
    return null;
  }
}

async function handleRequest(
  request: Request,
): Promise<Response> {
  const requestBody =
    await parseRequest(request);

  if (!requestBody) {
    return jsonResponse(
      {
        success: false,
        error:
          "Invalid JSON request body.",
      },
      400,
    );
  }

  const requestId =
    createRequestId(
      requestBody.requestId,
    );

  const user =
    await getAuthenticatedUser(
      request,
    );

  if (!user) {
    return jsonResponse(
      {
        success: false,
        error:
          "Authentication is required.",
        requestId,
      },
      401,
    );
  }

  const message =
    validateMessage(
      requestBody.message,
    );

  if (!message) {
    return jsonResponse(
      {
        success: false,
        error:
          "Message is required and must contain between 1 and 32000 characters.",
        requestId,
      },
      400,
    );
  }

  const conversationId =
    getOptionalString(
      requestBody.conversationId,
    );

  const capability =
    validateCapability(
      requestBody.capability,
    );

  /*
   * Provider execution and trusted persistence
   * will be connected here after the AI provider
   * contract for this Clean Build is confirmed.
   */

  return jsonResponse(
    {
      success: false,
      error:
        "AI provider execution is not configured yet.",
      requestId,
    },
    503,
  );
}

Deno.serve(
  async (request) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders,
        },
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "Method not allowed.",
        },
        405,
      );
    }

    try {
      return await handleRequest(
        request,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Internal server error.";

      return jsonResponse(
        {
          success: false,
          error: message,
        },
        500,
      );
    }
  },
);
