# Claude Chrome Reference

> Official documentation and capabilities of Claude's Chrome integration.

## Overview

Claude Code integrates with Google Chrome through the **Claude in Chrome browser extension**. This enables browser automation directly from the terminal - build in your terminal, test and debug in your browser without context switching.

## Requirements

| Requirement | Version |
|-------------|---------|
| Google Chrome | Latest |
| Claude in Chrome extension | v1.0.36+ |
| Claude Code CLI | v2.0.73+ |
| Claude plan | Pro, Team, or Enterprise |

**Limitations:**
- Chrome only (not Brave, Arc, or other Chromium browsers)
- WSL (Windows Subsystem for Linux) **not supported**
- Requires visible browser window (no headless mode)
- Currently in **beta**

## Setup

```bash
# Update Claude Code
claude update

# Start with Chrome enabled
claude --chrome

# Verify connection
/chrome
```

## How It Works

1. **Native Messaging API** - Extension uses Chrome's Native Messaging API to receive commands from Claude Code
2. **Real Browser** - Uses your actual browser session with login state (not headless)
3. **New Tabs** - Creates new tabs for browser tasks rather than taking over existing ones
4. **Blocker Handling** - Pauses at login pages/CAPTCHAs; you handle them manually, then Claude resumes

## Capabilities

### Navigation & Interaction
- Navigate to URLs
- Click elements
- Type text
- Fill forms
- Scroll pages
- Manage tabs (open/close/switch)
- Resize windows

### Debugging & Monitoring
- Read console logs and errors
- Monitor network requests
- Access DOM state
- Record GIFs of interactions

### What Claude Can Access
- Any site you're logged into (uses your session)
- Console output
- Network requests/responses
- Page content and structure

## Example Commands

### Test Local Web App
```
Open localhost:3000, try submitting the form with invalid data,
and check if the error messages appear correctly.
```

### Debug with Console Logs
```
Open the dashboard page and check the console for any errors
when the page loads.
```

### Automate Form Filling
```
I have a spreadsheet of contacts in contacts.csv. For each row,
go to our CRM, click "Add Contact", and fill in name, email, phone.
```

### Extract Data
```
Go to the product listings page and extract name, price, availability
for each item. Save as CSV.
```

### Draft in Google Docs
```
Draft a project update based on our recent commits and add it
to my Google Doc at docs.google.com/document/d/abc123
```

## Chrome Extension Features

### Scheduled Tasks
- Set recurring browser tasks (daily, weekly, monthly, annually)
- Click the clock icon in the extension panel
- Claude handles it automatically on schedule

### Multi-Tab Workflows
- Drag tabs into Claude's tab group
- Claude works across all tabs simultaneously
- Great for cross-referencing data from multiple sites

### Shortcuts (/slash commands)
- Save prompts as reusable workflows
- Access via typing "/" in the extension
- Can be scheduled for automation

### Workflow Recording
- Record steps to teach Claude your workflow
- Claude learns to repeat them
- Useful for delegating repetitive tasks

## Admin Controls (Team/Enterprise)

- Enable/disable org-wide
- Configure site allowlists and blocklists
- Manage via Admin settings

## Best Practices

1. **Modal Dialogs** - JavaScript alerts/confirms/prompts block events; dismiss manually and tell Claude to continue

2. **Fresh Tabs** - Create new tabs if one becomes unresponsive

3. **Filter Console** - Tell Claude what patterns to look for rather than all console output

4. **Visible Window** - Keep browser window visible (required)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Extension not detected | Update extension to v1.0.36+, update Claude Code to v2.0.73+, check Chrome is running, run `/chrome` and reconnect |
| Browser not responding | Check for modal dialogs, ask Claude to create new tab, restart extension |
| First-time setup | Restart Chrome after native messaging host installation |

## Sources

- [Claude Code Chrome Docs](https://code.claude.com/docs/en/chrome)
- [Claude in Chrome Release Notes](https://support.claude.com/en/articles/12306336-claude-in-chrome-release-notes)
- [Getting Started with Claude in Chrome](https://support.claude.com/en/articles/12012173-getting-started-with-claude-in-chrome)
- [Claude for Chrome Blog](https://claude.com/blog/claude-for-chrome)
