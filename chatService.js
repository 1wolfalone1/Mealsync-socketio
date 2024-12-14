export async function fetchRoomById(roomId, client) {
  const query = "SELECT * FROM rooms_v2 WHERE id = ? ALLOW FILTERING";
  try {
    // Connect to the cluster (if not already connected)

    // Execute the query
    const result = await client.execute(query, [roomId], { prepare: true });

    // Process and return the result
    if (result.rows.length === 0) {
      return null; // Return null if no rows found
    }
    return result.rows;
  } catch (error) {
    console.error("Error executing query:", error);
  } finally {
    // Optional: Close the connection
  }
}

export async function insertRoomData(roomId, client, userId, data2) {
  const query = `
    INSERT INTO rooms_v2 (id, created_at, updated_at, is_close, last_message, last_update_id, list_user_id, map_user_is_read, fix_partition)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const queryInsertUserRoom = `
    INSERT INTO user_rooms (user_id, room_id)
    VALUES (?, ?)
  `;
  let oldData = null;
  if (data2 && Array.isArray(data2) && data2.length > 0) {
    oldData = data2[0];
  } else {
    oldData = null;
  }

  try {
    const currentTime = oldData ? oldData.updated_at : new Date(); // Get the current timestamp
    console.log(currentTime, " current tim");
    let mapUserIsRead = {};
    let listUserId = [];
    if (oldData) {
      mapUserIsRead = {
        ...oldData.map_user_is_read,
        [userId]: true,
      };
      if (oldData.list_user_id && Array.isArray(oldData.list_user_id)) {
        let isHas = oldData.list_user_id.find((i) => i == userId);
        if (!isHas) {
          listUserId = [...oldData.list_user_id, userId];
        }
      }
    } else {
      listUserId = [userId];
      mapUserIsRead = {
        [userId]: true,
      };
    }

    const lastMessage = ""; // Replace with appropriate message
    const lastUpdateId = userId; // Assuming last_update_id is the userId; modify as needed
    const isClose = 1; // Assuming is_close is 1; modify as needed

    await client.execute(
      query,
      [
        roomId, // id
        currentTime, // created_at
        currentTime, // updated_at
        isClose, // is_close
        lastMessage, // last_message
        lastUpdateId, // last_update_id
        listUserId, // list_user_id
        mapUserIsRead, // map_user_is_read
      ],
      { prepare: true }
    );
    await client.execute(queryInsertUserRoom, [userId, roomId], {
      prepare: true,
    });
    console.log("Data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error);
  }
}
export async function fetchMessagesByRoomId(roomId, client) {
  const query = "SELECT * FROM messages_by_room WHERE room_id = ?";
  try {
    // Connect to the cluster (if not already connected)

    // Execute the query
    const result = await client.execute(query, [roomId], { prepare: true });

    // Return the rows directly
    return result.rows;
  } catch (error) {
    console.error("Error fetching messages:", error);
  } finally {
    // Optional: Close the connection
  }
}
export async function insertMessageIntoRoom(
  messageToSend,
  roleId,
  accountId,
  client
) {
  const insertQuery = `
    INSERT INTO messages_by_room (
      room_id, updated_at, id, account_id, role_id, is_read, created_at, message, file_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const selectQuery = `
    SELECT * FROM messages_by_room WHERE room_id = ? AND id = ? ALLOW FILTERING
  `;

  console.log(roleId, " role id");

  // Prepare the data
  const roomId = messageToSend.chatRoomId;
  const updatedAt = new Date(); // Current timestamp
  const id = messageToSend.id; // Unique ID for the message
  const isRead = false; // Default to false for new messages
  const createdAt = new Date(); // Current timestamp
  const messageText = messageToSend.text;
  const fileUrl = messageToSend.image || messageToSend.video || null;

  console.log(messageToSend, " messageToSend");

  try {
    // Execute the insert query
    await client.execute(
      insertQuery,
      [
        roomId,
        updatedAt,
        id,
        accountId,
        roleId,
        isRead,
        createdAt,
        messageText,
        fileUrl,
      ],
      { prepare: true }
    );

    console.log("Message inserted successfully!");

    // Query the database to retrieve the inserted data
    const result = await client.execute(selectQuery, [roomId, id], {
      prepare: true,
    });

    // Return the retrieved data if available
    if (result.rows.length > 0) {
      return result.rows[0];
    } else {
      console.error("No data found after insert.");
      return null;
    }
  } catch (error) {
    console.error("Error inserting or querying message:", error);
    return null;
  }
}

export async function fetchRoomsByUserReadKeyWithPaging(
  client,
  userKey,
  pageState = null,
  pageSize = 10
) {
  const roomIdsQuery = `
    SELECT room_id FROM user_rooms 
    WHERE user_id = ? 
  `;
  try {
    // Execute the query with pageState and pageSize
    const userRoomsResult = await client.execute(roomIdsQuery, [userKey], {
      prepare: true,
    });

    // Extract room_ids from the result
    const roomIds = userRoomsResult.rows.map((row) => row.room_id);

    if (roomIds.length === 0) {
      return {
        data: [],
        pageState: null,
        hasNext: false,
      };
    }

    // Fetch rooms from rooms_v2, ordered by updated_at with pagination support
    const roomsQuery = `
      SELECT * FROM rooms_v2 
      WHERE id IN ? and fix_partition = 1
      ALLOW FILTERING
    `;
    const params = [roomIds];
    const result = await client.execute(roomsQuery, params, {
      prepare: true,
      fetchSize: pageSize, // Ensure fetchSize for paging
      pageState, // Include pageState for correct paging
    }); // Extract rows and new pageState
    const { rows, pageState: nextPageState } = result;
    const result2 = await client.execute(roomsQuery, params, {
      prepare: true,
      fetchSize: pageSize, // Ensure fetchSize for paging
      pageState: nextPageState, // Include pageState for correct paging
    }); // Extract rows and new pageState
    const { rows: rows2, pageState: nextPageState2 } = result2;
    // Return rows, nextPageState, and hasNext
    console.log(rows2, nextPageState2, nextPageState, " rows2 returned");
    return {
      data: rows,
      pageState: nextPageState,
      hasNext: nextPageState != null ? true : false, // True if there's more data
    };
  } catch (error) {
    console.error("Error fetching rooms by user read key with paging:", error);
  }
}

export async function fetchRoomsByUserReadKey(client, userKey) {
  const query = `
    SELECT * FROM rooms_v2 
    WHERE map_user_is_read CONTAINS KEY ? 
    ALLOW FILTERING
  `;

  try {
    // Execute the query
    const result = await client.execute(query, [userKey], { prepare: true });

    // Return rows if found
    if (result.rows.length > 0) {
      console.log(result.rows, " rooms data");
      return result.rows;
    } else {
      console.log(
        `No rooms found containing key ${userKey} in map_user_is_read.`
      );
      return [];
    }
  } catch (error) {
    console.error("Error fetching rooms by user read key:", error);
  }
}
export async function updateRoomIsReadWithLassMessage(
  roomId,
  userIdsToUpdate,
  lastMessage,
  client,
  userId
) {
  const fetchQuery = `SELECT * FROM rooms_v2 WHERE id = ? ALLOW FILTERING`;
  const batchQuery = `
    BEGIN BATCH
      INSERT INTO rooms_v2 (
        id, created_at, updated_at, is_close, last_message, last_update_id, list_user_id, map_user_is_read, fix_partition
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1);
      DELETE FROM rooms_v2 WHERE updated_at = ? AND fix_partition = 1;
    APPLY BATCH;
  `;

  try {
    // Fetch the existing record
    const fetchResult = await client.execute(fetchQuery, [roomId], {
      prepare: true,
    });

    if (fetchResult.rows.length === 0) {
      console.log(`Room with id ${roomId} not found.`);
    }

    const oldRecord = fetchResult.rows[0];

    // Prepare new record data
    const newUpdatedAt = new Date();
    const userReadMap = userIdsToUpdate.reduce((acc, userId) => {
      acc[userId] = false;
      return acc;
    }, oldRecord.map_user_is_read);

    const newRecord = [
      oldRecord.id, // id
      oldRecord.created_at, // created_at
      newUpdatedAt, // updated_at
      oldRecord.is_close, // is_close
      lastMessage, // last_message
      userId, // last_update_id
      oldRecord.list_user_id, // list_user_id
      userReadMap, // map_user_is_read
      oldRecord.updated_at, // DELETE updated_at
    ];

    // Execute batch query
    await client.execute(batchQuery, newRecord, { prepare: true });

    console.log(`Room ${roomId} updated successfully with new last message.`);
  } catch (error) {
    console.error("Error updating room with last message:", error);
  }
}
export async function updateRoomIsRead(roomId, userIdsToUpdate, client) {
  const fetchQuery = `SELECT updated_at FROM rooms_v2 WHERE id = ? AND fix_partition = 1 ALLOW FILTERING`;

  const updateQuery = `
    UPDATE rooms_v2 
    SET map_user_is_read = map_user_is_read + ?
    WHERE updated_at = ? AND fix_partition = 1
  `;

  try {
    // Fetch current updated_at
    const fetchResult = await client.execute(fetchQuery, [roomId], {
      prepare: true,
    });
    if (fetchResult.rows.length === 0) {
      console.log(`Room with id ${roomId} not found.`);
    }
    const currentUpdatedAt = fetchResult.rows[0].updated_at;

    // Prepare new data
    const userReadMap = userIdsToUpdate.reduce((acc, userId) => {
      acc[userId] = true;
      return acc;
    }, {});

    const newUpdatedAt = new Date();

    // Execute the update query
    await client.execute(updateQuery, [userReadMap, currentUpdatedAt], {
      prepare: true,
    });

    console.log(`Successfully updated read status for room ${roomId}`);
  } catch (error) {
    console.error("Error updating room read status:", error);
  }
}

export async function getNumNotRead(userId, client) {
  const query =
    "SELECT count(id) FROM rooms_v2 WHERE map_user_is_read[?] = false ALLOW FILTERING";

  try {
    const result = await client.execute(query, [userId], { prepare: true });

    // Cassandra returns the count in a row with a column named 'count'
    console.log(result.rows[0], "dasfafasfd");
    const count = result.rows[0]["system.count(id)"].low;
    return count || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
  }
}
export async function closeChannel(id, client) {
  const fetchQuery = `SELECT updated_at FROM rooms_v2 WHERE id = ? ALLOW FILTERING`;

  const updateQuery = `
    UPDATE rooms_v2 
    SET is_close = 2
    WHERE updated_at = ? AND fix_partition = 1
  `;

  try {
    // Fetch current updated_at
    const fetchResult = await client.execute(fetchQuery, [id], {
      prepare: true,
    });
    if (fetchResult.rows.length === 0) {
      console.log(`Room with id ${id} not found.`);
    }
    const currentUpdatedAt = fetchResult.rows[0].updated_at;

    // Prepare new updated_at
    const newUpdatedAt = new Date();

    // Execute the update query
    await client.execute(updateQuery, [currentUpdatedAt], {
      prepare: true,
    });

    console.log(`Channel ${id} closed successfully.`);
  } catch (error) {
    console.error("Error closing channel:", error);
  }
}
