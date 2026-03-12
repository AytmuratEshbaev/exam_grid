// Fisher-Yates array shuffle algorithm
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

/**
 * Anti-Cheating Assignment Algorithm (Global Shuffle + Least-Class-Representation)
 * 
 * Goal: Distribute students across rooms so that students from the SAME CLASS
 * are spread as PROPORTIONALLY as possible across ALL rooms. This prevents cheating
 * because classmates who studied the same material sit in different rooms.
 * 
 * Algorithm:
 * 1. Shuffle ALL students globally (removes any ordering bias)
 * 2. For each student, assign to the room that has the FEWEST students 
 *    from that student's class, breaking ties by most remaining capacity
 * 3. Within each room, interleave students from different classes so 
 *    classmates don't sit next to each other
 * 
 * Why global shuffle instead of class-by-class?
 * - The old approach processed classes one-by-one (largest first). This caused
 *   later classes to be "squeezed" into rooms that were already filling up,
 *   resulting in uneven distribution (e.g., 25 students from one class in a room).
 * - Global shuffle ensures each student independently finds the best room,
 *   resulting in proportional distribution across all rooms regardless of room size.
 * 
 * Example: 5 classes × 30 students, rooms of capacity 60/40/30/20:
 *   Each room gets ~proportional share from EVERY class (e.g., 12/8/6/4 per class)
 * 
 * @param {Array} students - Array of {id, class_id}
 * @param {Array} rooms - Array of {id, capacity}
 * @returns {Array} assignments - Array of {student_id, room_id, seat_row, seat_number}
 */
const generateAssignments = (students, rooms) => {
  if (students.length === 0) throw new Error("No students found to assign");
  if (rooms.length === 0) throw new Error("No rooms selected for this exam");

  const totalCapacity = rooms.reduce((acc, room) => acc + room.capacity, 0);
  if (students.length > totalCapacity) {
    throw new Error(
      `Insufficient room capacity! There are ${students.length} students, ` +
      `but total room capacity is only ${totalCapacity}. ` +
      `Please add more rooms or reduce the number of students.`
    );
  }

  // Step 1: Randomize the overall list of students to avoid any ordering bias
  const shuffledStudents = shuffle([...students]);

  // Step 2: Initialize room tracking
  const roomSlots = shuffle(rooms.map(r => ({
    id: r.id,
    capacity: r.capacity,
    assigned: 0,
    students: [],
    classCount: {} // Track how many students from each class are in this room
  })));

  // Step 3: Distribute students across rooms
  // Use a "least class representation" strategy: for each student,
  // pick the room that has the fewest students from THAT student's class,
  // breaking ties by the room with the most remaining capacity
  for (const student of shuffledStudents) {
    let bestRoom = null;
    let bestClassCount = Infinity;
    let bestRemainingCapacity = -1;

    for (const room of roomSlots) {
      // Skip full rooms
      if (room.assigned >= room.capacity) continue;

      const classCountInRoom = room.classCount[student.class_id] || 0;
      const remainingCapacity = room.capacity - room.assigned;

      if (
        classCountInRoom < bestClassCount ||
        (classCountInRoom === bestClassCount && remainingCapacity > bestRemainingCapacity)
      ) {
        bestRoom = room;
        bestClassCount = classCountInRoom;
        bestRemainingCapacity = remainingCapacity;
      }
    }

    if (!bestRoom) {
      throw new Error("Insufficient room capacity (internal error)");
    }

    bestRoom.students.push(student);
    bestRoom.assigned++;
    bestRoom.classCount[student.class_id] = (bestRoom.classCount[student.class_id] || 0) + 1;
  }

  // Step 6: Within each room, shuffle the student order so classmates don't sit adjacent
  // Use interleaving: sort by class, then interleave different classes
  const assignments = [];
  for (const room of roomSlots) {
    // Group room students by class
    const roomClassGroups = {};
    for (const s of room.students) {
      if (!roomClassGroups[s.class_id]) roomClassGroups[s.class_id] = [];
      roomClassGroups[s.class_id].push(s);
    }

    // Interleave: take one student from each class in rotation
    const classQueues = Object.values(roomClassGroups);
    shuffle(classQueues); // Randomize class order
    const interleaved = [];
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const queue of classQueues) {
        if (queue.length > 0) {
          interleaved.push(queue.shift());
          hasMore = hasMore || queue.length > 0;
        }
      }
    }

    // Assign seats
    let seatNumber = 1;
    for (const student of interleaved) {
      assignments.push({
        student_id: student.id,
        room_id: room.id,
        seat_row: 1,
        seat_number: seatNumber++
      });
    }
  }

  return assignments;
};

module.exports = {
  shuffle,
  generateAssignments
};
