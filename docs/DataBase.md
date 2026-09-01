1. user
- id
- email
- phone
- password
- image
- nickname
- privacy
- like(2many)
- listened(2many)

2. music
- id
- name
- ganres(2many)
- avtor
- fileName(text)
- image
- aproved(boolean)
- comments(2many)
- date

3. music_genre
- id
- name

4. playlist
- id
- name
- music(2many)
- privacy
- description

4. likes2manyuser
- user_id
- music_id

5. listened2manyuser
- user_id
- music_id

6. genre2manymusic
- music_id
- genre_id

7. playlist2manymusic
- playlist_id
- music_id

8. comments(2many)
- music_id
- user_id
- text
