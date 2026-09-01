# Database Schema

## 1. user
- id
- email
- phone
- password_hash
- image
- nickname
- privacy
- likes (2many → user_likes)
- listened (2many → user_listened)

## 2. music
- id
- name
- genres (2many → music_genres)
- author (text)
- file_url
- image
- approved (boolean)
- comments (2many → comments)
- date

## 3. music_genre
- id
- name

## 4. playlist
- id
- name
- user_id (FK → user)
- music (2many → playlist_tracks)
- privacy
- description

## 5. user_likes
- user_id
- music_id
- created_at

## 6. user_listened
- id
- user_id
- music_id
- listened_at

## 7. music_genres
- music_id
- genre_id

## 8. playlist_tracks
- playlist_id
- music_id
- position

## 9. comments
- id
- music_id
- user_id
- text
- created_at
