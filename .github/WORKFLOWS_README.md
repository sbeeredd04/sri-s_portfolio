# GitHub Automation Quick Reference

## 🚀 Quick Start

Everything happens **automatically** on every push to `prod`:

```bash
git push origin prod
# Workflows trigger automatically ✅
```

**Wait for**:
- ✅ Code quality checks (5 min)
- ✅ Build verification (3 min)
- ✅ Performance audit (5 min)
- ✅ Screenshots (15 min)
- ✅ Health report (10 min)

**Total**: 15-20 minutes for full feedback

---

## 📋 What Gets Checked

### Code Quality
- ESLint (style rules)
- TypeScript (type safety)
- Prettier (formatting)
- Jest (unit tests: 49/49 passing)

### Performance
- FCP: < 1.0s ✅
- TTI: < 2.0s ✅
- Bundle: < 35 KB ✅

### Website
- Screenshots (Desktop, Tablet, Mobile)
- Accessibility audit
- SEO check
- Broken links

### Security
- npm audit
- Dependency scan
- Vulnerability alerts

---

## 🎬 Workflows

| Workflow | When | Duration |
|----------|------|----------|
| **CI/CD** | Every push | 15-20 min |
| **Code Review** | Every push | 10 min |
| **Performance** | Every 6h + push | 10 min |
| **Website Health** | Every push | 40-50 min |
| **Dependabot** | Weekly | Auto |

---

## 📊 View Results

**In GitHub**:
1. Go to repo → "Actions" tab
2. Click latest workflow run
3. See job logs and artifacts

**Artifacts include**:
- Website screenshots (3 devices)
- Performance reports
- Health reports
- Bundle analysis

---

## 🔄 Dependabot (Weekly Updates)

Automatic dependency updates:
- **Mondays 03:00 UTC** - npm packages
- **Mondays 04:00 UTC** - GitHub Actions

Creates PRs automatically (manual merge required).

---

## 📸 Screenshots

Captured **every push** (6 total):

**Desktop** (1920×1080):
- Full page
- Viewport

**Tablet** (768×1024):
- Full page
- Viewport

**Mobile** (375×667):
- Full page
- Viewport

View in "Artifacts" → `website-screenshots`

---

## ✅ Success Indicators

**Green checkmark**: All checks passed ✅
**Red X**: Some checks failed ⚠️

Click the status for details.

---

## 🆘 Troubleshooting

**Workflow didn't run?**
- Check files are in `.github/workflows/` on `prod` branch
- Verify branch name (prod/main)

**Build failed?**
- Run `npm run build` locally
- Check Node version
- Review error in logs

**Screenshots missing?**
- Check Playwright installed
- Verify server starts
- Check port 3000 free

---

## 📚 Full Documentation

See: `docs/GITHUB_AUTOMATION.md`

---

**Status**: ✅ Active & Monitoring  
**Last Checked**: Every push  
**All Systems**: Operational
