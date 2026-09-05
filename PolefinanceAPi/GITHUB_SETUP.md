# GitHub + Vercel setup

## 1. Create the GitHub repository

Create a private repository named `polefinance`, then from this folder run:

```bash
git init
git add .
git commit -m "Initialize PoleFinance quant core"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/polefinance.git
git push -u origin main
```

## 2. Merge with the existing PoleFinance frontend

This package contains only functionality specified by the supplied Backtesting/Quant documents. If your current Vercel app has the full Next.js frontend, database/authentication, Portfolio, Markets or AI Analyzer code, merge this quant core into that actual source repository rather than deploying this folder as the whole site.

Core target files:

- `src/calculations/shared.ts`
- `src/calculations/covariance.ts`
- `src/calculations/optimize.ts`
- `src/utils/backtesting.ts`
- `src/utils/quantLab.ts`

## 3. Connect Vercel

In Vercel: Project Settings -> Git -> connect the new GitHub repository. Use `main` as the production branch. First deploy as a Preview and validate the regression values before promoting to production.

## 4. Secrets

Copy variable names from `.env.example` into Vercel Environment Variables. Never commit actual secret values.
