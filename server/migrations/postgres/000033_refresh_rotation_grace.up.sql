-- Rotation grace: link a rotated refresh token to its successor so that a client
-- killed between the server-side rotation and its own persistence of the new token
-- can recover (within a short window) instead of tripping reuse-detection.
ALTER TABLE core.refresh_tokens ADD COLUMN IF NOT EXISTS rotated_to UUID;
