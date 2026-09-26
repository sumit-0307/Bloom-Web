# Test Credentials

## Password Gate (frontend-only, no backend auth)
- The entire experience is gated behind a single password.
- Password: `Sakshi` (case-insensitive — "sakshi", "SAKSHI" also work)
- Input: `data-testid="gate-input"`
- Submit button: `data-testid="gate-submit"`
- On success a ribbon-split animation plays (~2.1s) then the experience mounts.

## Notes
- Fully static site. Backend (FastAPI) exists but is UNUSED by the frontend.
- No login/user accounts, no database.
- Desktop-only (>900px, hover-capable). Mobile shows a fallback screen (`data-testid="mobile-fallback"`).
- After unlock, click `data-testid="plant-seed-btn"` (Ch.00) to plant the seed and reveal the growing sunflower.
