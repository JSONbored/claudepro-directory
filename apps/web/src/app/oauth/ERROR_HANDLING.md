# OAuth Error Handling Documentation

This document explains how the OAuth consent flow handles various error scenarios.

## Error Scenarios

### 1. Failed Sign-In / Not Authenticated

**What happens:**
- User is redirected to `/login?redirect=/oauth/consent?authorization_id=...`
- After successful login, user is redirected back to the consent page
- The authorization_id is preserved in the redirect parameter

**Implementation:**
- Checked in `apps/web/src/app/oauth/consent/page.tsx` (lines 103-115)
- Uses `getAuthenticatedUser()` to check authentication
- If not authenticated, redirects to login with return URL

**User experience:**
- User sees login page
- After login, automatically returns to consent page
- Authorization request continues normally

---

### 2. Cancel / Deny Authorization

**What happens:**
- User clicks "Cancel" button
- `handleDeny()` calls `supabase.auth.oauth.denyAuthorization(authorizationId)`
- Supabase returns a `redirect_url` with `error=access_denied` parameter (OAuth 2.1 spec)
- User is redirected to client's `redirect_uri` with error parameter
- Client receives: `redirect_uri?error=access_denied&error_description=...`

**Implementation:**
- Handled in `apps/web/src/app/oauth/consent/oauth-consent-client.tsx` (lines 127-171)
- Supabase automatically includes `error=access_denied` in redirect URL per OAuth 2.1 spec

**User experience:**
- User clicks Cancel → immediately redirected to client
- Client can display error message and handle accordingly
- If no redirect_uri, shows message: "Authorization denied. You can close this tab."

---

### 3. Timeout / Expired Authorization

**What happens:**
- If `authorization_id` expires or becomes invalid
- `getAuthorizationDetails()` returns an error
- Error page is displayed with clear message

**Implementation:**
- Checked in `apps/web/src/app/oauth/consent/page.tsx` (lines 125-147)
- Detects expired/invalid authorization by checking error message
- Shows user-friendly error message

**User experience:**
- User sees: "This authorization request has expired or is no longer valid. Please try again from the application requesting access."
- User must restart OAuth flow from the client application

---

### 4. User Closes Tab / Abandons Flow

**What happens:**
- User closes browser tab without approving or denying
- Authorization request remains pending but will eventually expire
- When client tries to exchange authorization code, it will fail (code was never issued)

**Implementation:**
- No explicit handling needed - Supabase handles expiration
- Client must handle missing/invalid authorization code when exchanging

**User experience:**
- User simply closes tab
- Client will receive error when trying to exchange code
- Client should prompt user to restart OAuth flow

---

### 5. Invalid/Missing Authorization ID

**What happens:**
- User accesses `/oauth/consent` without `authorization_id` parameter
- Error page is displayed immediately

**Implementation:**
- Checked in `apps/web/src/app/oauth/consent/page.tsx` (lines 80-94)
- Shows error message if `authorization_id` is missing

**User experience:**
- User sees: "Missing authorization ID. Please try again from the application requesting access."

---

### 6. Authorization Details Fetch Error

**What happens:**
- `getAuthorizationDetails()` fails for any reason (network, invalid ID, expired, etc.)
- Error page is displayed with appropriate message

**Implementation:**
- Checked in `apps/web/src/app/oauth/consent/page.tsx` (lines 125-147)
- Detects expired vs other errors and shows appropriate message

**User experience:**
- Expired: "This authorization request has expired or is no longer valid..."
- Other errors: "Invalid authorization request. Please try again..."

---

## Error Response Format (OAuth 2.1)

When user denies authorization, Supabase automatically includes error parameters in redirect URL:

```
redirect_uri?error=access_denied&error_description=User+denied+the+request&state=...
```

**Error codes:**
- `access_denied` - User explicitly denied authorization
- `invalid_request` - Invalid authorization request
- `server_error` - Internal server error
- `temporarily_unavailable` - Service temporarily unavailable

**Client handling:**
- Client should check for `error` parameter in redirect URL
- Display appropriate error message to user
- Optionally prompt user to retry OAuth flow

---

## Summary

All error scenarios are properly handled:

✅ **Failed signin** → Redirect to login, return after auth  
✅ **Cancel/Deny** → Redirect to client with `error=access_denied`  
✅ **Timeout/Expired** → Show error message, prompt to retry  
✅ **User closes tab** → Authorization expires, client handles on code exchange  
✅ **Invalid authorization** → Show error message immediately  
✅ **Fetch errors** → Show appropriate error message

The implementation follows OAuth 2.1 specification and provides clear user feedback for all error scenarios.

