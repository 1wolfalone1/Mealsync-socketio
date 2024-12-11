DROP TABLE IF EXISTS messages_by_room;
CREATE TABLE messages_by_room (
   room_id INT,
   updated_at TIMESTAMP,
   id UUID,
   account_id INT,
   role_id INT,
   is_read BOOLEAN,
   created_at TIMESTAMP,
   message TEXT,
   file_url TEXT,
   PRIMARY KEY (room_id, updated_at)
) WITH CLUSTERING ORDER BY (updated_at DESC);
---
DROP TABLE IF EXISTS rooms_v2;
CREATE TABLE rooms_v2 (
    id INT,                            
    created_at TIMESTAMP,              
    updated_at TIMESTAMP,              
    list_user_id LIST<INT>,
    map_user_is_read MAP<INT, BOOLEAN>,
    last_message TEXT,                 
    PRIMARY KEY (id)       
);

ALTER TABLE rooms_v2 ADD last_update_id INT;
ALTER TABLE rooms_v2 ADD isClose INT;

---
SELECT * FROM rooms_v2 WHERE map_user_is_read CONTAINS KEY 104 ALLOW FILTERING;

---
SELECT map_user_is_read[101] FROM rooms_v2 WHERE id = 1;

---
SELECT count(id) FROM rooms_v2 WHERE map_user_is_read[101] = false ALLOW FILTERING;

---
UPDATE rooms_v2
SET map_user_is_read = map_user_is_read + {104: true, 105: true}, last_message = 'fasdfas'
WHERE id = 11;

---
UPDATE rooms_v2
SET map_user_is_read = map_user_is_read + {104: true, 105: true}, last_message = 'fasdfas',
updated_at = ?
WHERE id = 11;
---
INSERT INTO messages (
    room_id, 
    id, 
    account_id, 
    role_id, 
    is_read, 
    created_at, 
    updated_at, 
    message, 
    file_url
) VALUES (
    1, 
    uuid(), 
    101, 
    1, 
    false, 
    toTimestamp(now()), 
    toTimestamp(now()), 
    'Hello, this is a message!', 
    'https://example.com/file.png'
);
---

select * from messages where room_id = 1 ALLOW FILTERING;

---



