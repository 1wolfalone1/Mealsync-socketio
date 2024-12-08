-- Message 1
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (1, uuid(), 101, 1, false, '2024-11-21 10:00:00', '2024-11-21 10:30:00', 'Hello, Room 1!', NULL);

-- Message 2
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (1, uuid(), 102, 2, true, '2024-11-21 10:05:00', '2024-11-21 10:35:00', 'Good morning, everyone!', 'https://example.com/image1.png');

-- Message 3
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (2, uuid(), 103, 1, false, '2024-11-21 11:00:00', '2024-11-21 11:10:00', 'This is Room 2', NULL);

-- Message 4
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (1, uuid(), 101, 1, true, '2024-11-21 10:10:00', '2024-11-21 10:40:00', 'Another message in Room 1', NULL);

-- Message 5
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (3, uuid(), 104, 2, false, '2024-11-21 12:00:00', '2024-11-21 12:30:00', 'Hello, Room 3!', NULL);

-- Message 6
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (1, uuid(), 105, 3, true, '2024-11-21 10:15:00', '2024-11-21 10:45:00', 'Message with a file in Room 1', 'https://example.com/file1.docx');

-- Message 7
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (2, uuid(), 103, 1, true, '2024-11-21 11:15:00', '2024-11-21 11:20:00', 'A follow-up in Room 2', NULL);

-- Message 8
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (3, uuid(), 104, 2, false, '2024-11-21 12:10:00', '2024-11-21 12:35:00', 'Another message in Room 3', NULL);

-- Message 9
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (1, uuid(), 102, 2, true, '2024-11-21 10:20:00', '2024-11-21 10:50:00', 'Yet another message in Room 1', NULL);

-- Message 10
INSERT INTO messages (room_id, id, account_id, role_id, is_read, created_at, updated_at, message, file_url)
VALUES (2, uuid(), 101, 1, false, '2024-11-21 11:30:00', '2024-11-21 11:45:00', 'Last message for Room 2', NULL);
