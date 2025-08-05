-- Fix OTP expiry time to recommended threshold (24 hours)
UPDATE auth.config 
SET value = '86400' 
WHERE parameter = 'OTP_EXPIRY';