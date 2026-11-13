// Streams text from the Anthropic Messages API (no SDK needed).
import { env } from "./http.ts";

export type Msg = { role: "user" | "assistant"; content: string };

export async function* streamClaude(system: string, messages: Msg[], maxTokens: number): AsyncGenerator<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("ANTHROPIC_MODEL") ?? "claude-sonnet-5-5", max_tokens: maxTokens, system, messages, stream: true }),
  });
  if (res.status === 429 || res.status === 529) throw new Error("rate_limited");
  if (!res.ok || !res.body) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const evt = buf.slice(0, i); buf = buf.slice(i + 2);
      const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const msg = JSON.parse(dataLine.slice(5));
      if (msg.type === "content_block_delta" && msg.delta?.type === "text_delta") yield msg.delta.text as string;
      if (msg.type === "error") throw new Error(msg.error?.type === "overloaded_error" ? "rate_limited" : `anthropic: ${msg.error?.message}`);
    }
  }
}
