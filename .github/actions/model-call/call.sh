#!/usr/bin/env bash
# .github/actions/model-call/call.sh - the only way storybook calls a model.
# Reads: PURPOSE PROVIDER MODEL PROMPT_FILE INPUT_FILE SHAPE OUT
#        MAX_CHARS (default 24000) GEMINI_KEY GH_MODELS_TOKEN
# Writes: $OUT (the answer) and $OUT.meta.json (provider, model, prompt hash, tokens)
set -euo pipefail
MAX_CHARS=${MAX_CHARS:-24000}
case "$PROVIDER" in
  gemini) URL=https://generativelanguage.googleapis.com/v1beta/openai/chat/completions; KEY=${GEMINI_KEY:-} ;;
  github) URL=https://models.github.ai/inference/chat/completions; KEY=${GH_MODELS_TOKEN:-} ;;
  *) echo "::error::Unknown provider '$PROVIDER' (use gemini or github)"; exit 1 ;;
esac
[ -n "$MODEL" ] || { echo "::error::$PURPOSE: no model set"; exit 1; }
[ -n "$KEY" ]   || { echo "::error::$PURPOSE: no credential for $PROVIDER"; exit 1; }
[ -s "$PROMPT_FILE" ] || { echo "::error::$PURPOSE: prompt $PROMPT_FILE missing or empty"; exit 1; }
CHARS=$(wc -c < "$INPUT_FILE")
if [ "$CHARS" -gt "$MAX_CHARS" ]; then
  echo "::error::$PURPOSE: input is $CHARS characters, over the $MAX_CHARS limit; trim it before calling"; exit 1
fi
PROMPT_SHA=$(sha256sum "$PROMPT_FILE" | cut -c1-12)
jq -n --arg model "$MODEL" --rawfile system "$PROMPT_FILE" --rawfile user "$INPUT_FILE" '{
  model: $model, temperature: 0, response_format: {type: "json_object"},
  messages: [{role: "system", content: $system}, {role: "user", content: $user}]
}' > mc_request.json
HTTP=$(curl --silent --show-error --retry 4 --retry-delay 15 \
  --header "Authorization: Bearer $KEY" --header "Content-Type: application/json" \
  --data @mc_request.json --output mc_response.json --write-out "%{http_code}" "$URL")
IN_TOK=$(jq -r '.usage.prompt_tokens // "?"' mc_response.json 2>/dev/null || echo "?")
OUT_TOK=$(jq -r '.usage.completion_tokens // "?"' mc_response.json 2>/dev/null || echo "?")
echo "Model call | $PURPOSE | $PROVIDER | $MODEL | prompt $PROMPT_SHA | HTTP $HTTP | tokens $IN_TOK in, $OUT_TOK out"
{
  echo "**Model call: $PURPOSE**"; echo
  echo "| Provider | Model | Prompt | HTTP | Tokens in | Tokens out |"
  echo "| --- | --- | --- | --- | --- | --- |"
  echo "| $PROVIDER | $MODEL | $PROMPT_SHA | $HTTP | $IN_TOK | $OUT_TOK |"; echo
} >> "$GITHUB_STEP_SUMMARY"
jq -n --arg p "$PROVIDER" --arg m "$MODEL" --arg s "$PROMPT_SHA" --arg i "$IN_TOK" --arg o "$OUT_TOK" \
  '{provider: $p, model: $m, prompt_sha: $s, tokens_in: $i, tokens_out: $o}' > "$OUT.meta.json"
if [ "$HTTP" != "200" ]; then
  echo "::error::$PURPOSE: $PROVIDER returned HTTP $HTTP"; head -c 1000 mc_response.json; echo; exit 1
fi
jq -r '.choices[0].message.content' mc_response.json | sed -e '1{/^```/d}' -e '${/^```/d}' > "$OUT"
jq -e "$SHAPE" "$OUT" > /dev/null \
  || { echo "::error::$PURPOSE: the answer is not JSON in the allowed shape"; cat "$OUT"; exit 1; }