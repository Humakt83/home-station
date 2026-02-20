# Agent Instructions

## Quality Checks

Run these commands in order:

1. **Lint the code**

   ```bash
   npm run lint
   ```

   Fix any linting or formatting issues.

2. **Run tests**

   ```bash
   npm run test
   ```

   This runs both unit tests and E2E tests.

3. **Ensure all tests pass**
   - If tests fail, debug and fix the issues
   - Re-run `npm run test` until all tests pass

## Summary

Always follow this workflow:

- Lint → Fix issues → Tests → Verify passing
