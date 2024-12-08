export async function fetchRoomById(roomId, client) {
  const query = "SELECT * FROM rooms_v2 WHERE id = ?";
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
    throw error;
  } finally {
    // Optional: Close the connection
  }
}

export async function insertRoomData(data, roomId, client) {
  const query = `
    INSERT INTO rooms_v2 (id, created_at, updated_at, list_user_id, map_user_is_read, last_message)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Prepare the data
  const currentTime = new Date(); // Get the current timestamp
  let listUserId = [];
  let mapUserIsRead = {};
  if (data.deliveryStaff) {
    listUserId = [data.customer.id, data.shop.id, data.deliveryStaff?.id];
    mapUserIsRead = {
      [data.customer.id]: true,
      [data.shop.id]: false,
      [data.deliveryStaff?.id]: false,
    };
  } else {
    listUserId = [data.customer.id, data.shop.id];
    mapUserIsRead = {
      [data.customer.id]: true,
      [data.shop.id]: false,
    };
  }
  const lastMessage = "Room 4 message."; // Replace with appropriate message

  try {
    // Connect to the cluster (if not already connected)

    // Execute the query
    await client.execute(
      query,
      [
        roomId,
        currentTime,
        currentTime,
        listUserId,
        mapUserIsRead,
        lastMessage,
      ],
      { prepare: true }
    );

    console.log("Data inserted successfully!");
  } catch (error) {
    console.error("Error inserting data:", error);
    throw error;
  } finally {
    // Close the connection
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
    throw error;
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
    throw error;
  }
}

export async function updateRoomIsReadWithLassMessage(
  roomId,
  userIdsToUpdate,
  lastMessage,
  client
) {
  const query = `
    UPDATE rooms_v2 
    SET map_user_is_read = map_user_is_read + ? ,
        last_message = ? ,
        updated_at = ?
    WHERE id = ?
  `;

  try {
    // Convert userIdsToUpdate array to map structure
    // Example: [104, 105] becomes {104: true, 105: true}
    const userReadMap = userIdsToUpdate.reduce((acc, userId) => {
      acc[userId] = false;
      return acc;
    }, {});

    const currentTime = new Date();

    // Execute the update query
    await client.execute(
      query,
      [userReadMap, lastMessage, currentTime, roomId],
      { prepare: true }
    );

    console.log(`Successfully updated read status for room ${roomId}`);

    // Optionally fetch and return the updated room data
  } catch (error) {
    console.error("Error updating room read status:", error);
    throw error;
  }
}

export async function updateRoomIsRead(roomId, userIdsToUpdate, client) {
  const query = `
    UPDATE rooms_v2 
    SET map_user_is_read = map_user_is_read + ?
    WHERE id = ?
  `;

  try {
    // Convert userIdsToUpdate array to map structure
    // Example: [104, 105] becomes {104: true, 105: true}
    const userReadMap = userIdsToUpdate.reduce((acc, userId) => {
      acc[userId] = true;
      return acc;
    }, {});

    const currentTime = new Date();

    // Execute the update query
    await client.execute(query, [userReadMap, roomId], { prepare: true });

    console.log(`Successfully updated read status for room ${roomId}`);

    // Optionally fetch and return the updated room data
  } catch (error) {
    console.error("Error updating room read status:", error);
    throw error;
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
    return Number(result.rows[0].count) || 0;
  } catch (error) {
    console.error("Error getting unread count:", error);
    throw error;
  }
}
