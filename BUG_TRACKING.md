# Bug Tracking Documentation

## Overview
This document serves as a comprehensive bug tracking system for the Food Manager application. It helps developers learn from mistakes, understand the codebase structure, and maintain a record of issues encountered during development.

## Bug Categories
- **Authentication & Authorization** - Login, signup, session management
- **API & Data** - Supabase integration, data fetching, API routes
- **UI/UX** - Component rendering, styling, user interactions
- **Scraping & External APIs** - Apify integration, recipe scraping
- **Performance** - Loading times, memory usage, optimization
- **Environment & Configuration** - Environment variables, build issues
- **Database** - Schema issues, queries, data integrity

## Bug Report Template

### Bug Report #XXX
**Date**: [YYYY-MM-DD]  
**Reporter**: [Your Name]  
**Severity**: [Critical/High/Medium/Low]  
**Status**: [Open/In Progress/Resolved/Closed]  

#### Title
[Brief, descriptive title of the bug]

#### Description
[Detailed description of what the bug is, what should happen vs what actually happens]

#### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Continue as needed]

#### Expected Behavior
[What should happen]

#### Actual Behavior
[What actually happens]

#### Affected Files
- `path/to/file1.tsx` - [Brief description of role in bug]
- `path/to/file2.ts` - [Brief description of role in bug]
- `path/to/file3.js` - [Brief description of role in bug]

#### Root Cause Analysis
[Analysis of why this bug occurred]

#### Solution Applied
[Description of how the bug was fixed]

#### Prevention Measures
[How to prevent similar bugs in the future]

#### Related Issues
- [Link to related bugs or issues]

---

## Bug Reports

### Bug Report #001
**Date**: 2024-12-19  
**Reporter**: Ann-Christina Kuang  
**Severity**: Medium  
**Status**: Open  

#### Title
Apify API integration fails silently when environment variables are missing

#### Description
The `startApifyActor` function in `src/lib/apify.ts` returns `null` when `APIFY_API_TOKEN` or `APIFY_ACTOR_ID` environment variables are not set, but this failure is not logged or communicated to the user. The scraping functionality appears broken without clear indication of why.

#### Steps to Reproduce
1. Remove or comment out `APIFY_API_TOKEN` from `.env.local`
2. Navigate to the scrape page (`/dashboard/scrape`)
3. Attempt to start a scraping job
4. Observe that nothing happens, no error message is shown

#### Expected Behavior
- Clear error message indicating missing API credentials
- Graceful degradation with instructions for setup
- Proper error handling in the UI

#### Actual Behavior
- Silent failure with no user feedback
- Scraping appears completely broken
- No indication of configuration issues

#### Affected Files
- `src/lib/apify.ts` - Main Apify integration logic
- `src/app/api/scrape/route.ts` - API endpoint that calls Apify functions
- `src/app/dashboard/(routes)/scrape/page.tsx` - UI component that triggers scraping
- `env.template` - Environment variable template

#### Root Cause Analysis
The function has early returns for missing environment variables but doesn't provide any feedback mechanism. The calling code doesn't handle the `null` return value appropriately.

#### Solution Applied
*[To be filled when bug is resolved]*

#### Prevention Measures
*[To be filled when bug is resolved]*

#### Related Issues
- Need to implement proper error handling throughout the application
- Environment variable validation should be done at startup

---

### Bug Report #002
**Date**: 2024-12-19  
**Reporter**: Ann-Christina Kuang  
**Severity**: Low  
**Status**: Open  

#### Title
Missing error boundaries in React components

#### Description
The application lacks error boundaries, which means if any component throws an error, the entire page crashes with a white screen instead of showing a helpful error message.

#### Steps to Reproduce
1. Introduce a runtime error in any React component (e.g., access undefined property)
2. Navigate to the page containing that component
3. Observe complete page crash with white screen

#### Expected Behavior
- Error boundary catches the error
- User sees a helpful error message
- Application continues to function for other parts

#### Actual Behavior
- White screen of death
- No error information for debugging
- Poor user experience

#### Affected Files
- `src/app/layout.tsx` - Root layout where error boundary should be added
- `src/app/dashboard/layout.tsx` - Dashboard layout
- `src/components/providers.tsx` - Component providers
- All React components that could potentially throw errors

#### Root Cause Analysis
React applications without error boundaries will crash entirely when any component throws an unhandled error. This is a common oversight in React applications.

#### Solution Applied
*[To be filled when bug is resolved]*

#### Prevention Measures
*[To be filled when bug is resolved]*

#### Related Issues
- Need to implement comprehensive error handling strategy
- Consider adding error reporting service (Sentry, etc.)

---

### Bug Report #003
**Date**: 2024-12-19  
**Reporter**: Ann-Christina Kuang  
**Severity**: High  
**Status**: Open  
**Category**: API & Data  

#### Title
Scraping job fails silently when Apify actor returns null due to missing environment variables

#### Description
When `APIFY_API_TOKEN` or `APIFY_ACTOR_ID` environment variables are missing, the `startApifyActor` function returns `null`, but the scraping job is still created in the database with status 'pending'. The job never gets updated to 'processing' or 'failed', leaving it in a permanent pending state. Users see no indication that the scraping failed.

#### Steps to Reproduce
1. Remove `APIFY_API_TOKEN` from `.env.local` (or set it to empty string)
2. Navigate to `/dashboard/scrape`
3. Enter a valid YouTube/Instagram/TikTok URL
4. Click "Add" button
5. Observe that job is created but never progresses from 'pending' status
6. Click "Check" button - status remains 'pending'

#### Expected Behavior
- Clear error message indicating missing API configuration
- Job should be marked as 'failed' with appropriate error message
- User should be informed about the configuration issue

#### Actual Behavior
- Job is created successfully in database
- Job status remains 'pending' indefinitely
- No error message shown to user
- Silent failure with no indication of the problem

#### Environment Details
- **Browser**: Any
- **OS**: Any
- **Build Mode**: Development/Production
- **Missing**: APIFY_API_TOKEN environment variable

#### Affected Files
- `src/lib/apify.ts` - `startApifyActor` function returns null without error handling
- `src/app/api/scrape/route.ts` - Lines 45-51: Doesn't handle null return from `startApifyActor`
- `src/app/dashboard/(routes)/scrape/page.tsx` - UI shows job as 'pending' without error feedback
- `env.template` - Should document required environment variables

#### Error Messages/Logs
No error messages are logged or shown to the user. The issue is completely silent.

#### Root Cause Analysis
The `startApifyActor` function has early returns for missing environment variables but doesn't throw errors or provide feedback. The calling code in the API route assumes the function will either return a valid result or throw an error, but doesn't handle the null case. This creates a disconnect between the Apify integration failure and the job status in the database.

#### Solution Applied
*[To be filled when bug is resolved]*

#### Prevention Measures
*[To be filled when bug is resolved]*

#### Related Issues
- Bug #001: Related to same Apify integration issue
- Need comprehensive environment variable validation at application startup
- Need better error handling throughout the scraping pipeline

#### Additional Notes
This bug makes the entire scraping feature appear broken to users without any clear indication of what's wrong. It's a critical user experience issue that should be prioritized.

---

## How to Add New Bug Reports

1. Copy the bug report template above
2. Fill in all sections with as much detail as possible
3. Use the next available bug number
4. Update the date and reporter information
5. Include all relevant file paths with brief descriptions
6. Add the bug to the appropriate category section if needed

## Bug Tracking Best Practices

1. **Be Specific**: Include exact error messages, console logs, and stack traces
2. **Include Context**: Describe what you were trying to accomplish
3. **Document Everything**: Even small bugs can teach valuable lessons
4. **Link Files**: Always include the file paths that are involved
5. **Analyze Root Cause**: Understanding why a bug happened helps prevent similar issues
6. **Track Solutions**: Document how bugs were fixed for future reference
7. **Prevention**: Think about how to prevent similar bugs in the future

## Learning Objectives

This bug tracking system helps you learn:
- Common patterns in React/Next.js applications
- API integration best practices
- Error handling strategies
- Environment configuration management
- Database interaction patterns
- Performance optimization techniques
- Security considerations

## Integration with Development Workflow

- Add bug reports immediately when issues are discovered
- Update bug status as work progresses
- Reference bug reports in commit messages
- Use bug reports for code review discussions
- Create tests based on bug scenarios to prevent regression
