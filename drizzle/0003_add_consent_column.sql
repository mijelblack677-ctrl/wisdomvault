-- Add consent tracking to users table
-- Records when a user agreed to the consent/terms popup during registration.
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_given_at timestamp with time zone;