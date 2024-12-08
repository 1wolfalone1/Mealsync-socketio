USE chat;

-- Insert room 1 with two users (101 and 102) and their respective read status
-- Room 1
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (16, '2024-11-20 12:00:00', '2024-11-20 12:30:00', [101, 102], {101: false, 102: true},
        'Room 1 message.');

-- Room 2
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (17, '2024-11-20 13:00:00', '2024-11-20 13:15:00', [103, 104], {103: true, 104: false},
        'Room 2 message.');

-- Room 3
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (18, '2024-11-20 14:00:00', '2024-11-20 14:10:00', [101, 105], {101: false, 105: true},
        'Room 3 message.');

-- Room 4
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (4, '2024-11-20 15:00:00', '2024-11-20 15:20:00', [102, 105], {102: true, 105: false}, 'Room 4 message.');

-- Room 5
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (5, '2024-11-20 16:00:00', '2024-11-20 16:25:00', [103, 104, 101], {103: false, 104: false, 101: true}, 'Room 5 message.');

-- Room 6
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (6, '2024-11-20 17:00:00', '2024-11-20 17:30:00', [105, 102], {105: false, 102: false}, 'Room 6 message.');

-- Room 7
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (7, '2024-11-20 18:00:00', '2024-11-20 18:10:00', [101, 104], {101: false, 104: true}, 'Room 7 message.');

-- Room 8
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (8, '2024-11-20 19:00:00', '2024-11-20 19:40:00', [103, 105], {103: true, 105: false}, 'Room 8 message.');

-- Room 9
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (9, '2024-11-20 20:00:00', '2024-11-20 20:30:00', [102, 104], {102: false, 104: true}, 'Room 9 message.');

-- Room 10
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (10, '2024-11-20 21:00:00', '2024-11-20 21:10:00', [101, 102, 103], {101: true, 102: true, 103: false}, 'Room 10 message.');

-- Room 11
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (11, '2024-11-20 22:00:00', '2024-11-20 22:20:00', [104, 105], {104: false, 105: true}, 'Room 11 message.');

-- Room 12
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (12, '2024-11-20 23:00:00', '2024-11-20 23:15:00', [101, 103], {101: true, 103: false}, 'Room 12 message.');

-- Room 13
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (13, '2024-11-21 00:00:00', '2024-11-21 00:10:00', [105, 102, 101], {105: false, 102: true, 101: false}, 'Room 13 message.');

-- Room 14
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (14, '2024-11-21 01:00:00', '2024-11-21 01:20:00', [104, 101], {104: false, 101: true}, 'Room 14 message.');

-- Room 15
INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
VALUES (15, '2024-11-21 02:00:00', '2024-11-21 02:30:00', [102, 103], {102: true, 103: false}, 'Room 15 message.');
