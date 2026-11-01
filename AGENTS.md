<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Technical decisions

- Metadata generation calls the Google Gemini API from the browser with user-provided API keys (multi-key rotation); do not move it server-side or onto the AI Gateway.
- The "AI এরর ডাক্তার" error diagnosis runs server-side (`src/lib/ai-doctor.functions.ts`) through the Lovable AI Gateway SDK (`@lovable.dev/ai-gateway`, model `openai/gpt-6-astra`); import the SDK inside the handler so it never ships to the client bundle.
