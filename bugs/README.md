# Bug Documentation System

This directory contains the bug tracking system for the Food Manager application.

## Files

- `bug-template.md` - Template for creating new bug reports
- `README.md` - This file explaining the system

## How to Use

### 1. Creating a New Bug Report

1. Copy the template from `bug-template.md`
2. Paste it into the main `BUG_TRACKING.md` file
3. Fill in all the details
4. Use the next available bug number

### 2. Finding Bug Numbers

Check the main `BUG_TRACKING.md` file to see what the last bug number was and increment by 1.

### 3. Updating Bug Status

As you work on bugs, update their status in the main tracking file:
- Open → In Progress → Resolved → Closed

### 4. Learning from Bugs

Each bug report includes:
- **Root Cause Analysis**: Why did this happen?
- **Solution Applied**: How was it fixed?
- **Prevention Measures**: How to avoid it in the future?

This helps you understand common patterns and improve your development practices.

## Bug Categories

The system tracks bugs in these categories:

- **Authentication & Authorization**: Login, signup, session management
- **API & Data**: Supabase integration, data fetching, API routes  
- **UI/UX**: Component rendering, styling, user interactions
- **Scraping & External APIs**: Apify integration, recipe scraping
- **Performance**: Loading times, memory usage, optimization
- **Environment & Configuration**: Environment variables, build issues
- **Database**: Schema issues, queries, data integrity

## Best Practices

1. **Report bugs immediately** when you discover them
2. **Be specific** with error messages and steps to reproduce
3. **Include all relevant files** that are involved
4. **Analyze root causes** to learn from mistakes
5. **Document solutions** for future reference
6. **Think about prevention** to avoid similar issues

## Integration with Development

- Reference bug numbers in commit messages
- Use bug reports in code reviews
- Create tests based on bug scenarios
- Update documentation when bugs reveal gaps

This system will help you become a better developer by learning from every mistake and building a knowledge base of common issues and their solutions.
