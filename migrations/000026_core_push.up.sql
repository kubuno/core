-- Push notification delivery for native/desktop apps.
--
-- A user registers one or more devices. `provider` selects the transport:
--   - 'unifiedpush' : POST the payload to the distributor endpoint URL (de-googled
--     default, like Nextcloud). `device_token` holds the endpoint URL.
--   - 'apns' / 'fcm' : `device_token` holds the platform push token (delivery via
--     APNs/FCM is added later; the rows are accepted now).
--
-- A background worker consumes the EventBus, maps each AppEvent to a notification
-- and fans it out to the recipient's devices, honoring per-module/per-event
-- preferences.
CREATE TABLE core.push_devices (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    provider     VARCHAR(20) NOT NULL CHECK (provider IN ('apns', 'fcm', 'unifiedpush')),
    device_token TEXT NOT NULL,           -- endpoint URL (unifiedpush) or push token (apns/fcm)
    app_id       VARCHAR(100),            -- bundle id / package name
    locale       VARCHAR(10),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, device_token)
);
CREATE INDEX idx_core_push_user ON core.push_devices(user_id);

-- Opt-out preferences. Absence of a row = enabled (push on by default).
-- module_id / event_type may be '*' to match all.
CREATE TABLE core.push_preferences (
    user_id    UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    module_id  VARCHAR(100) NOT NULL,     -- '*' = all modules
    event_type VARCHAR(100) NOT NULL,     -- '*' = all event types
    enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (user_id, module_id, event_type)
);
