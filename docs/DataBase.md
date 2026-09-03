# Database Schema

## 1. user
- id
- email
- phone
- password_hash
- image
- nickname
- privacy
- role (guest / user / moderator / admin)
- is_blocked (boolean)
- likes (2many → user_likes)
- listened (2many → user_listened)
- following (2many → follows)

## 2. music
- id
- name
- genres (2many → music_genres)
- author (text)
- album_id (FK → album, nullable)
- file_url
- image
- status (pending / approved / rejected)
- rejection_reason
- comments (2many → comments)
- date

## 3. music_genre
- id
- name

## 4. album
- id
- name
- author (text)
- image
- date

## 5. playlist
- id
- name
- user_id (FK → user, владелец)
- music (2many → playlist_tracks)
- collaborators (2many → playlist_collaborators)
- privacy
- description

## 6. user_likes
- user_id
- music_id
- type (like / dislike)
- created_at

## 7. user_listened
- id
- user_id
- music_id
- listened_at

## 8. music_genres
- music_id
- genre_id

## 9. playlist_tracks
- playlist_id
- music_id
- position

## 10. playlist_collaborators
- playlist_id
- user_id
- role (editor / viewer)

## 11. follows
- follower_id (FK → user)
- following_id (FK → user)
- created_at

## 12. comments
- id
- music_id
- user_id
- text
- created_at

## 13. complaints
- id
- reporter_id (FK → user)
- target_type (music / user / comment)
- target_id
- reason
- status (pending / reviewed / resolved)
- created_at

## 14. password_reset_tokens
- id
- user_id (FK → user)
- token
- expires_at
- created_at
