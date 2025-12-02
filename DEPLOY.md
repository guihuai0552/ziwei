# Deployment Guide for Ziwei Astrologist

This guide explains how to deploy the **Ziwei Astrologist** application to **Vercel**, the recommended platform for Next.js apps.

## Prerequisites

1.  A [Vercel Account](https://vercel.com/signup).
2.  A GitHub, GitLab, or Bitbucket account where this repository is hosted.

## 1. Prepare Your Code

Ensure all your changes are committed and pushed to your git repository.

**Important:** Make sure the generated index file `src/lib/ziwei_index.json` is included in your commit. This file is required for the RAG functionality to work in production.

```bash
# Example commands (run from the root of your repo)
git add ziwei
git commit -m "feat: Ready for deployment"
git push origin <your-branch-name>
```

## 2. Deploy to Vercel

1.  **Log in** to Vercel.
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import** your git repository (`weblearning`).
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be detected automatically).
    *   **Root Directory**: Click "Edit" and select `ziwei`. **This is critical** because your app lives in a subdirectory.
5.  **Environment Variables**:
    *   Expand the "Environment Variables" section.
    *   Add the following keys (copy values from your `.env.local`):
        *   `DEEPSEEK_API_KEY`: `sk-xxxxxxxx`
        *   `GEMINI_API_KEY`: `AIzaSyD...`
6.  Click **"Deploy"**.

## 3. Verification

Once the deployment is complete, Vercel will provide a URL (e.g., `https://ziwei-astrologist.vercel.app`).

1.  Open the URL.
2.  Test the **Language Toggle**.
3.  Generate a chart and click a palace to test **AI Analysis**.
    *   The system will try to use Gemini first.
    *   If Gemini fails, it will fall back to DeepSeek.

## Troubleshooting

-   **Build Failures**: Check the "Build Logs" in Vercel. Common issues include missing dependencies or type errors (which we have fixed).
-   **RAG Not Working**: Ensure `src/lib/ziwei_index.json` was successfully committed and deployed.
-   **API Errors**: Verify that your Environment Variables are set correctly in the Vercel project settings.
