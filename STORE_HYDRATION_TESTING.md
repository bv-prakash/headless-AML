# Magento Store View Hydration - Testing & Verification Guide

## Overview
This system now uses Magento as the **source of truth** for active stores while preserving all frontend metadata (themes, languages, category roots).

## Architecture Summary

### Data Flow
```
Magento GraphQL stores endpoint
  ↓ (fetches active stores: code, name, is_active)
Hydration Function (src/config/storeViews.ts)
  ↓ (filters inactive, normalizes codes, merges metadata)
HYDRATED_STORE_OPTIONS (cached 5 minutes)
  ↓ (updates allowedStoreCodeSet for validation)
Components & Server Code
```

### Key Exports
- **`getHydratedStoreViewOptions()`** - returns currently hydrated options (safe pre- or post-hydration)
- **`hydrateStoreViewOptionsFromMagento()`** - fetches and merges with Magento
- **`normalizeStoreViewCode()`** - validates against active stores
- **`STORE_VIEW_OPTIONS`** - static metadata (fallback, reference)

### Updated Components
- `src/components/store-view/StoreViewToggle.tsx` - store switcher
- `src/components/auth/LoginForm.tsx` - login redirect hints
- All utility functions in `src/config/storeViews.ts`

---

## Test Suite

### Test 1: Verify Hydration Fetch
**Objective:** Confirm GraphQL fetch succeeds and returns active stores.

**Steps:**
1. Open browser DevTools → Network tab
2. Trigger store switcher or language switcher on first page load
3. Look for POST to `/api/graphql-proxy` with query containing `stores { code name is_active }`

**Expected Result:**
- Request succeeds with 200 status
- Response contains `"stores": [ { "code": "...", "name": "...", "is_active": true }, ... ]`
- Only active stores appear (no `is_active: false`)

**Verification Command (Browser Console):**
```javascript
// Check if hydration completed and returned active stores
console.log(
  'Hydrated stores:',
  (window.__storeOptions || []).map(s => ({ code: s.code, group: s.group }))
);
```

---

### Test 2: Verify Inactive Store Filtering
**Objective:** Confirm disabled stores are excluded from the switcher.

**Steps:**
1. In Magento Admin, disable a store (e.g., set `is_active = false` on Proluxe store)
2. Clear browser cache and cookies related to store selection
3. Reload the storefront
4. Open the store switcher component

**Expected Result:**
- Disabled store does NOT appear in the switcher dropdown
- Store list only shows active stores
- If the user's cookie points to the disabled store, they are redirected to the default

---

### Test 3: Verify Metadata Preservation
**Objective:** Confirm frontend metadata (themes, languages, etc.) survives hydration.

**Steps:**
1. Load Proluxe store (should have `homeThemeId: "proluxe"`)
2. Inspect `<html data-home-theme>` attribute in browser DevTools

**Expected Result:**
- `<html data-home-theme="proluxe">` is set
- Proluxe-specific CSS (`src/style/prizmTheme/` or similar) loads
- Theme switch works correctly

**Code Verification (Browser Console):**
```javascript
// Check theme attribute
document.documentElement.getAttribute('data-home-theme');
// Expected: "proluxe" (or "default" for American Lighting)
```

---

### Test 4: Verify Language Switcher Functionality
**Objective:** Language switcher shows correct languages for active stores.

**Steps:**
1. Navigate to American Lighting store (has English + Arabic)
2. Open language switcher
3. Switch to Arabic (`default_ar`)
4. Verify language changes + page refreshes with Arabic labels

**Expected Result:**
- Language switcher only shows languages for active stores
- Switching language preserves store view and cart
- Language code passed correctly to Magento

---

### Test 5: Verify Website/Cart Scoping
**Objective:** Confirm cart is properly scoped by website when switching stores.

**Steps:**
1. Add item to cart on American Lighting (website: `american_lighting`)
2. Switch to TINSL Lighting (website: `tinsl_lighting`)
3. Verify cart is empty (different website scope)
4. Switch back to American Lighting
5. Verify original item is still in cart

**Expected Result:**
- Cart clears when switching between websites
- Cart persists when switching between stores of the same website
- No "Can't assign cart to store in different website" errors in console

---

### Test 6: Verify Cookie Fallback (Old/Disabled Codes)
**Objective:** Users with cookies pointing to disabled stores are redirected gracefully.

**Steps:**
1. Set a cookie: `document.cookie = "magento_store_view=proluxelighting_store_view; path=/"`
2. Disable the Proluxe store in Magento Admin
3. Reload the page
4. Trigger a store-dependent action (e.g., visit PDP, add to cart)

**Expected Result:**
- `normalizeStoreViewCode('proluxelighting_store_view')` returns `null`
- User is silently fallback to default store
- No broken pages or 404s
- Console warning in dev mode: "Failed to hydrate..." (if error) or no warning (if successful)

---

### Test 7: Verify Caching & Deduplication
**Objective:** Confirm hydration results are cached and concurrent requests don't duplicate fetches.

**Steps:**
1. Open DevTools → Network tab
2. Hard refresh page (Cmd+Shift+R or Ctrl+Shift+R)
3. Trigger hydration multiple times within 5 seconds
4. Check Network tab for `/api/graphql-proxy` POST requests

**Expected Result:**
- First load: 1 POST request to `/api/graphql-proxy`
- Subsequent requests within 5 minutes: 0 additional POST requests (cached)
- After 5 minutes: new POST request (cache expired)
- Multiple simultaneous hydration calls: deduplicated to 1 request

**Cache Verification (Browser Console):**
```javascript
// Manually call hydration twice quickly
Promise.all([
  hydrateStoreViewOptionsFromMagento(),
  hydrateStoreViewOptionsFromMagento()
]).then(() => console.log('Both completed'));
// Check Network tab: should see only 1 POST, not 2
```

---

### Test 8: Verify Server-Side Validation
**Objective:** Server requests with invalid store codes reject or fallback correctly.

**Steps:**
1. Make a request with invalid store header:
   ```bash
   curl "http://localhost:3000/api/some-endpoint" \
     -H "Store: invalid_store_code_xyz"
   ```
2. Check server logs and response

**Expected Result:**
- Server rejects the request or falls back to default store
- No 500 errors
- GraphQL queries to Magento include the fallback store in headers

---

### Test 9: Verify Store Switcher UI
**Objective:** Store switcher reflects hydrated, active-only stores.

**Steps:**
1. Navigate to header/footer store switcher
2. Count visible store options
3. In Magento Admin, disable one store
4. Return to storefront and refresh
5. Count visible store options again

**Expected Result:**
- First count: N stores
- After disabling in admin: N-1 stores
- Disabled store button is gone from switcher

**Browser Console (List Active Stores):**
```javascript
// Get all store options from hydration
const storeViews = (window.__storeOptions || []);
console.table(
  storeViews.map(s => ({
    code: s.code,
    group: s.group,
    websiteCode: s.websiteCode,
    languageCode: s.languageCode
  }))
);
```

---

### Test 10: Verify Fallback Behavior (GraphQL Error)
**Objective:** If Magento GraphQL fails, app still works with static options.

**Steps:**
1. In a terminal, simulate network failure:
   ```bash
   # Block DDEV Magento endpoint temporarily
   sudo iptables -A OUTPUT -d americanlighting.ddev.site -j DROP
   ```
2. Reload storefront
3. Verify store switcher and other features still work
4. Restore network: `sudo iptables -F`

**Expected Result:**
- Storefront loads normally
- Store switcher appears with static options
- DevTools console (dev mode): warning "Failed to hydrate store view options from Magento GraphQL"
- No broken UI or 500 errors

---

## Integration Test Checklist

- [ ] All three companies (American Lighting, TINSL, Proluxe) show correctly
- [ ] Each company has correct languages (American: en+ar, others: en)
- [ ] Theme switching works (Proluxe → proluxe theme)
- [ ] Cart clears when switching websites
- [ ] Language switcher updates URL and translation
- [ ] Navigation breadcrumbs update correctly per store
- [ ] PDP/PLP loads correct catalog for selected store
- [ ] Sign-in component shows correct company name
- [ ] Sign-out and re-login works across store switches
- [ ] Mobile view shows store/language switcher correctly
- [ ] Search results respect selected store
- [ ] Checkout respects selected store
- [ ] Order history shows orders for current store only

---

## Debugging & Troubleshooting

### Symptom: Store switcher not showing options
**Debug:**
```javascript
// In browser console
import { getHydratedStoreViewOptions } from '@/src/config/storeViews';
console.log('Hydrated options:', await getHydratedStoreViewOptions());
```
**Check:** Are options empty? Is `/api/graphql-proxy` endpoint returning data?

### Symptom: Old cookies break the site
**Debug:**
```javascript
// Check what code is in the cookie
document.cookie.split(';').find(c => c.includes('magento_store_view'));
// Check if code is valid
const code = 'proluxelighting_store_view'; // example
fetch('/api/graphql-proxy', {
  method: 'POST',
  body: JSON.stringify({
    query: 'query { storeConfig { code } }',
    // Include Store header
  })
});
```

### Symptom: Theme not switching
**Debug:**
```javascript
// Check HTML attribute
document.documentElement.getAttribute('data-home-theme');
// Check computed styles
window.getComputedStyle(document.documentElement).getPropertyValue('--primary-color');
```

### Symptom: Language switcher empty
**Debug:**
```javascript
// Check store code and available languages
const storeCode = 'default'; // or other code
const opts = getHydratedStoreViewOptions();
const store = opts.find(o => o.code === storeCode);
console.log('Hydrated store:', store);
console.log('Language:', store?.languageCode);
```

---

## Post-Launch Validation

After deploying to production:

1. **Monitor for hydration failures:**
   - Check error logs for "Failed to hydrate store view options"
   - Confirm `/api/graphql-proxy` endpoint is accessible

2. **Verify all stores are active:**
   - In Magento Admin, Stores → All Stores
   - Confirm all expected stores have Status: Enabled

3. **Test with real customer data:**
   - Sign in and verify store/language switching works
   - Check cart/wishlist behavior across websites

4. **Analytics:**
   - Track store switcher clicks
   - Confirm no unusual fallback-to-default patterns

---

## Rollback Plan

If issues arise:

1. **Disable hydration (revert to static):**
   - Edit `hydrateStoreViewOptionsFromMagento()` to return `STORE_VIEW_OPTIONS`
   - Components will still work (use static options)

2. **Revert specific changes:**
   - Git: `git revert <commit>`
   - Redeploy

3. **Partial rollback:**
   - Keep hydration but fall back if errors exceed threshold
   - Implement circuit breaker pattern in future

---

## Next Steps

1. **Run full test suite** above
2. **Deploy to staging** and have QA verify
3. **Monitor production** for 24 hours post-launch
4. **Gather user feedback** on store/language switching
5. **Optimize caching strategy** if needed (adjust TTL, add tags)
6. **Consider adding telemetry** for hydration success/failure rates
