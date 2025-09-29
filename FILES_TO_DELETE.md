# Files to Delete - Cleanup List

## 🧪 Test Files Created for Task 8 (Safe to Delete)

### Test Scripts and Reports

```
test-asteroid-integration.js          # Comprehensive test script for asteroid integration
test-integration.html                 # Browser-based test suite interface
validate-implementation.js            # Implementation validation script
TASK_8_TEST_REPORT.md                # Test report documentation
```

### Test Configuration Files

```
vitest.config.ts                     # Vitest configuration (if not using tests in production)
vitest.setup.ts                      # Vitest setup file (if not using tests in production)
```

## 🧪 Unit Test Directories (Safe to Delete if not needed)

### Calculation Tests

```
lib/calculations/__tests__/          # Entire test directory
├── comprehensive.test.ts
├── edge-cases.test.ts
├── end-to-end-functional.test.ts
├── end-to-end.test.ts
├── enhanced-impact.test.ts
├── performance-simple.test.ts
├── performance.test.ts
├── property-based.test.ts
└── regression.test.ts
```

### Data Processing Tests

```
lib/data/__tests__/                  # Entire test directory
├── composition-engine.test.ts
├── nasa-processor.test.ts
├── uncertainty-engine.test.ts
├── validation-system.test.ts
└── validation.test.ts
```

### Physics Tests

```
lib/physics/__tests__/               # Entire test directory
├── constants.test.ts
├── uncertainty.test.ts
├── units.test.ts
└── validation.test.ts
```

### Component Tests

```
components/ui/__tests__/             # Entire test directory
├── data-completeness-indicator.test.tsx
├── uncertainty-display.test.tsx
└── uncertainty-utils.test.ts
```

## 🗂️ Unused/Redundant Library Files (Review Before Deleting)

### Potentially Unused Data Processing Files

```
lib/data/composition-engine.ts       # ⚠️  Check if used - composition calculations
lib/data/nasa-processor.ts          # ⚠️  Check if used - NASA data processing
lib/data/uncertainty-engine.ts      # ⚠️  Check if used - uncertainty calculations
lib/data/validation-system.ts       # ⚠️  Check if used - advanced validation
```

### Potentially Unused Physics Files

```
lib/physics/uncertainty.ts          # ⚠️  Check if used - uncertainty calculations
lib/physics/units.ts               # ⚠️  Check if used - unit conversions
lib/physics/validation.ts          # ⚠️  Check if used - physics validation
lib/physics/constants.ts           # ⚠️  Check if used - physics constants
lib/physics/README.md              # Documentation file
```

### Potentially Unused Calculation Subdirectories

```
lib/calculations/deflection/        # ⚠️  Check if used - deflection calculations
lib/calculations/impact/            # ⚠️  Check if used - impact calculations
lib/calculations/orbital/           # ⚠️  Check if used - orbital calculations
lib/calculations/validation/        # ⚠️  Check if used - calculation validation
```

## 📁 Development/Build Files (Keep These)

### Essential Build Files (DO NOT DELETE)

```
.next/                              # Next.js build output
node_modules/                       # Dependencies
package.json                        # Package configuration
pnpm-lock.yaml                     # Lock file
tsconfig.json                      # TypeScript configuration
next.config.mjs                    # Next.js configuration
postcss.config.mjs                # PostCSS configuration
.eslintrc.json                     # ESLint configuration
```

### Essential Source Files (DO NOT DELETE)

```
app/                               # Main application pages
components/                        # React components (except test files)
lib/types.ts                      # Type definitions
lib/utils.ts                      # Utility functions
lib/data/asteroid-manager.ts      # Core asteroid data management
lib/calculations/impact.ts        # Core impact calculations
lib/calculations/enhanced-impact.ts # Enhanced calculations
data/                             # Data files
public/                           # Static assets
```

## 🔍 Files to Investigate Before Deleting

### Check Usage in Components

```bash
# Run these commands to check if files are actually used:

# Check composition-engine usage
grep -r "composition-engine" components/ app/

# Check nasa-processor usage
grep -r "nasa-processor" components/ app/

# Check uncertainty-engine usage
grep -r "uncertainty-engine" components/ app/

# Check physics files usage
grep -r "lib/physics" components/ app/

# Check calculation subdirectories usage
grep -r "lib/calculations/deflection" components/ app/
grep -r "lib/calculations/orbital" components/ app/
```

## 📋 Recommended Deletion Order

### Phase 1: Safe Test File Cleanup

1. Delete test scripts: `test-*.js`, `test-*.html`, `*TEST_REPORT.md`
2. Delete test configuration: `vitest.config.ts`, `vitest.setup.ts`
3. Delete all `__tests__/` directories

### Phase 2: Unused Library Cleanup (After Verification)

1. Check usage of each file in the "Files to Investigate" section
2. Delete unused physics files
3. Delete unused data processing files
4. Delete unused calculation subdirectories

### Phase 3: Final Cleanup

1. Remove any empty directories
2. Update imports if needed
3. Test the application to ensure nothing is broken

## 💾 Estimated Space Savings

- **Test files**: ~500KB
- **Test directories**: ~2-3MB
- **Unused library files**: ~1-2MB
- **Total potential savings**: ~3-5MB

## ⚠️ Important Notes

1. **Always backup before deleting** - Create a git commit or backup
2. **Test after each phase** - Ensure the application still works
3. **Check imports** - Some files might be imported but not obviously used
4. **Keep core functionality** - Don't delete files that are actually used in production

## 🚀 Production-Ready File Structure After Cleanup

```
├── app/                           # Next.js pages
├── components/                    # React components (no test files)
├── data/                         # JSON data files
├── lib/
│   ├── calculations/
│   │   ├── enhanced-impact.ts    # Enhanced calculations
│   │   └── impact.ts            # Basic calculations
│   ├── data/
│   │   ├── asteroid-manager.ts  # Core data management
│   │   └── validation.ts        # Basic validation
│   ├── types.ts                 # Type definitions
│   └── utils.ts                 # Utilities
├── public/                       # Static assets
└── [config files]               # Build configuration
```

This cleanup will result in a leaner, production-ready codebase focused on the core functionality.
