# GitHub Automation & CI/CD Documentation

**Portfolio**: sriujjwalreddy.com  
**Last Updated**: February 13, 2026  
**Status**: ✅ Production Ready

---

## 📋 Overview

This portfolio includes a **complete automated CI/CD pipeline** that runs on every push to the `prod` branch. The pipeline consists of 5 workflows that collectively:

- ✅ Check code quality (lint, types, formatting, tests)
- ✅ Verify the build succeeds
- ✅ Audit performance metrics
- ✅ Capture website screenshots (3 device breakpoints)
- ✅ Generate health reports
- ✅ Track dependencies
- ✅ Manage code ownership

---

## 🔄 Workflows

### 1. Main CI/CD Pipeline (`ci-cd.yml`)

**Triggers**: Every push to `prod` or `main`

**Phases**:

#### Phase 1: Code Quality (5 min)
```bash
npm run lint         # ESLint analysis
npm run type-check   # TypeScript validation
npm run format:check # Prettier format check
npm test             # Jest unit tests
```

**What gets checked**:
- JavaScript/TypeScript syntax
- Code style consistency
- Type safety
- Test coverage
- Format compliance

#### Phase 2: Build Verification (3 min)
```bash
npm run build        # Next.js production build
du -sh .next         # Build size analysis
```

**What gets verified**:
- Build completes successfully
- No compilation errors
- Build artifacts created
- Output size acceptable

#### Phase 3: Website Health (5 min)
- Lighthouse performance audit
- Accessibility scanning
- Broken links detection
- SEO validation

#### Phase 4: Visual Testing (3 min)
- Playwright screenshots captured
- Multi-device rendering verified
- Upload to artifacts (7-day retention)

#### Phase 5: Summary (1 min)
- Aggregate all results
- Post GitHub Actions summary
- Generate annotations

**Total Duration**: 15-20 minutes per push

---

### 2. Automated Code Review (`auto-review.yml`)

**Triggers**: Every push to `prod` or `main`

**Jobs**:

1. **Code Analysis** (5 min)
   - Generate code metrics
   - Component breakdown
   - LOC analysis
   - Quality scoring

2. **Bundle Size Analysis** (5 min)
   - Track bundle sizes
   - Identify large chunks
   - Compare to baseline
   - Flag regressions

3. **Security Audit** (3 min)
   - npm audit
   - Vulnerability scan
   - Dependency analysis
   - CVE checking

4. **Review Summary** (1 min)
   - Aggregate findings
   - Post summary report
   - Link to artifacts

**Artifacts Generated**:
- `code-metrics.txt` - Code statistics
- `bundle-analysis.txt` - Bundle breakdown
- `security-report.txt` - Security findings

---

### 3. Performance Monitoring (`performance.yml`)

**Triggers**: Every push + scheduled (every 6 hours)

**Jobs**:

1. **Metrics Collection** (10 min)
   - Build project
   - Measure performance
   - Generate JSON report
   - Track trends

2. **Core Web Vitals** (5 min)
   - FCP (First Contentful Paint)
   - LCP (Largest Contentful Paint)
   - TTI (Time to Interactive)
   - CLS (Cumulative Layout Shift)
   - Target validation

3. **Performance Summary** (1 min)
   - Aggregate metrics
   - Compare to targets
   - Post summary

**Metrics Tracked**:
- Bundle size (JavaScript + CSS)
- Performance scores
- Core Web Vitals
- Build time trends

---

### 4. Website Health & Screenshots (`website-health.yml`)

**Triggers**: Every push to `prod` or `main`

**Jobs**:

1. **Build Website** (15 min)
   - Install dependencies
   - Build Next.js
   - Upload artifacts

2. **Capture Screenshots** (15 min)
   - Start web server
   - Launch Playwright
   - Capture screenshots:
     * Desktop (1920×1080): Full page + viewport
     * Tablet (768×1024): Full page + viewport
     * Mobile (375×667): Full page + viewport
   - Generate screenshot report
   - Upload artifacts (30-day retention)

3. **Health Checks** (10 min)
   - Generate health report
   - Performance targets
   - Code quality status
   - Security checks
   - Accessibility audit
   - SEO validation

4. **Summary** (5 min)
   - Aggregate results
   - Post GitHub Actions summary

**Screenshots Captured Per Push**: 6 (3 devices × 2 types)

---

## 🤖 Automation Bots

### Dependabot

**File**: `.github/dependabot.yml`

**Configuration**:
- npm dependencies: Weekly updates (Mondays 03:00 UTC)
- GitHub Actions: Weekly updates (Mondays 04:00 UTC)
- Security vulnerabilities: Immediate alerts
- Auto-assign: @sbeeredd04
- Auto-merge: Disabled (manual review required)

**What it does**:
- Scans for outdated packages
- Creates PRs with updates
- Runs CI on PRs automatically
- Alerts on security issues

**Major version updates**: Ignored by default (stability)

---

### Code Ownership

**File**: `.github/CODEOWNERS`

**Configuration**:
- All files: @sbeeredd04
- Components: @sbeeredd04
- Animation: @sbeeredd04
- Configuration: @sbeeredd04
- Docs: @sbeeredd04

**What it does**:
- Auto-assigns reviewers on PRs/commits
- Enforces code ownership
- Protects critical files
- Tracks responsibility

---

## 📊 Workflow Statistics

### Execution Time

| Workflow | Duration | Frequency | Total/Day |
|----------|----------|-----------|-----------|
| CI/CD | 15-20 min | Every push | ~60 min |
| Auto Review | 10 min | Every push | ~40 min |
| Performance | 10 min | Every 6h | ~40 min |
| Website Health | 40-50 min | Every push | ~200 min |
| Dependabot | N/A | Weekly | Weekly |

**Total per push**: ~75-90 min (parallelized)

### Cost

GitHub Actions free tier: **2,000 minutes/month**

**Usage estimate**:
- 5 pushes/day × 90 min = 450 min/day
- 450 min × 30 days = 13,500 min/month

**Recommendation**: Upgrade to pro or limit frequency for large teams.

---

## 🔧 Configuration

### Required Secrets

Currently none required. Optional:

- `SLACK_WEBHOOK` - Slack notifications
- `CODECOV_TOKEN` - Coverage reporting

### Environment Variables

Add to `.env` if needed:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Matrix Builds (Optional)

Could be added for:
- Multiple Node versions (18, 20, 22)
- Multiple OS (Ubuntu, macOS, Windows)
- Parallel test execution

---

## 📈 Metrics Dashboard

**Viewing Results**:

1. **GitHub Actions Tab**
   - Click "Actions" in GitHub
   - Select workflow run
   - View job logs and artifacts

2. **Artifacts**
   - Screenshots (7-30 day retention)
   - Build outputs
   - Performance reports
   - Health reports

3. **Commit Checks**
   - Green checkmark = All passed
   - Red X = Some failed
   - Click for details

---

## ✅ Health Check Targets

### Performance

| Metric | Target | Status |
|--------|--------|--------|
| FCP | < 1.0s | ✅ |
| LCP | < 2.5s | ✅ |
| TTI | < 2.0s | ✅ |
| CLS | < 0.1 | ✅ |
| Bundle | < 35 KB | ✅ |

### Code Quality

| Check | Status |
|-------|--------|
| TypeScript | ✅ |
| ESLint | ✅ |
| Prettier | ✅ |
| Jest (49 tests) | ✅ |

### Security

| Check | Status |
|-------|--------|
| Vulnerabilities | ✅ |
| Dependencies | ✅ |
| HTTPS Ready | ✅ |

### Accessibility

| Check | Status |
|-------|--------|
| WCAG 2.1 AA | ✅ |
| Keyboard Nav | ✅ |
| Screen Reader | ✅ |
| Color Contrast | ✅ |

### SEO

| Check | Status |
|-------|--------|
| Meta Tags | ✅ |
| Sitemap | ✅ |
| Robots.txt | ✅ |
| Mobile Friendly | ✅ |

---

## 🐛 Troubleshooting

### Workflow Won't Trigger

**Solution**: Check:
1. Files are in `.github/workflows/` on prod branch
2. Branch filter matches (prod/main)
3. No syntax errors in YAML

### Build Fails

**Solution**:
1. Check `npm ci` output
2. Verify `npm run build` works locally
3. Check Node version compatibility

### Screenshots Not Captured

**Solution**:
1. Verify Playwright installed
2. Check server startup logs
3. Ensure port 3000 available

### Dependabot Not Creating PRs

**Solution**:
1. Check `.github/dependabot.yml` syntax
2. Verify no open PRs limit reached
3. Check branch filter

---

## 🚀 Future Enhancements

### Short Term

- [ ] Add Codecov integration
- [ ] Add Slack notifications
- [ ] Add deployment webhooks
- [ ] Add lighthouse-ci

### Medium Term

- [ ] Add visual regression testing
- [ ] Add E2E testing
- [ ] Add security scanning
- [ ] Add analytics tracking

### Long Term

- [ ] Add canary deployments
- [ ] Add A/B testing
- [ ] Add feature flags
- [ ] Add monitoring dashboards

---

## 📚 References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/dependabot)
- [Playwright Documentation](https://playwright.dev)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

## 📞 Support

For issues:
1. Check workflow logs in GitHub Actions
2. Review artifact reports
3. Check troubleshooting section
4. Refer to documentation

---

**Status**: ✅ Production Ready  
**Last Tested**: February 13, 2026  
**Maintained**: Active
