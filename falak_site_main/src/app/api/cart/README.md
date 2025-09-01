This directory previously contained database-backed cart API routes.

Removed endpoints (now deleted):
- add
- count
- merge
- validate_ownership

Only guest_passes remains to resolve stored ids (pass or event) -> Pass rows for the client-side localStorage cart.
