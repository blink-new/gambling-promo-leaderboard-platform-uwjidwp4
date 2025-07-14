# Real Referral Tracking System

## Overview

The leaderboard system is designed to show **ONLY real users** who are actually using your referral codes on the gambling websites. No fake or mock data is displayed.

## How It Works

### 1. Webhook Integration

Each gambling site can send real-time data to our webhook endpoint:

```
https://cyedbuosylzgoypmbdge.supabase.co/functions/v1/gambling-webhooks?site=SITE_NAME
```

### 2. Supported Sites

The system tracks users for these gambling sites with your referral codes:

- **Datdrop**: Code `cin`
- **CSGOGEM**: Code `20off` 
- **PackDraw**: Code `itscin`
- **CSGO LUCK**: Code `CIN5`
- **Rain.gg**: Code `cin`
- **Clash.gg**: Code `CIN`

### 3. Webhook Data Format

Gambling sites should send data in this format:

```json
{
  "event": "user_activity",
  "user": {
    "username": "player123",
    "steam_id": "76561198000000000"
  },
  "activity": {
    "games_played": 5,
    "wagered_amount": 100.50,
    "won_amount": 150.25,
    "lost_amount": 50.00,
    "referral_code": "cin",
    "win_streak": 3,
    "is_playing": true,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 4. Manual Tracking API

For testing or manual updates, you can use:

```
POST https://cyedbuosylzgoypmbdge.supabase.co/functions/v1/track-referral

{
  "site_name": "Datdrop",
  "username": "player123",
  "referral_code": "cin",
  "wagered_amount": 100.50,
  "games_played": 5,
  "win_streak": 3,
  "total_won": 150.25,
  "total_lost": 50.00
}
```

## Implementation for Gambling Sites

### Authentication
All webhook endpoints are public and don't require authentication, but they verify the referral code matches the site.

### Rate Limiting
The system handles real-time updates efficiently with built-in rate limiting.

### Error Handling
- Invalid referral codes are rejected
- Missing required fields return helpful error messages
- Database errors are logged and handled gracefully

## Data Privacy

- Only users who explicitly use your referral codes are tracked
- No personal information is stored beyond username and Steam ID
- All data is secured in Supabase with proper access controls

## Current Status

**The leaderboard is currently empty because no real users have been tracked yet.** 

To populate the leaderboard with real data:

1. **Contact the gambling sites** to set up webhook integration
2. **Use the manual tracking API** to test with real user data
3. **Ask users to use your referral codes** and ensure the sites report back to your system

## Testing

You can test the system by making a POST request to the track-referral endpoint with real user data. Once tested, the leaderboard will immediately reflect real users and their gambling activity.