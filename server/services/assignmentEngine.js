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
 * Evenly distribute students across rooms.
 * 
 * Rules:
 * 1. Total capacity must be >= total students, else throw error
 * 2. Students from each class should be distributed evenly across rooms
 *    e.g. 22 students / 6 rooms = 4,4,4,4,3,3
 * 3. Rooms cannot exceed their individual capacity
 * 
 * @param {Array} students - Array of student objects {id, class_id}
 * @param {Array} rooms - Array of room objects {id, capacity}
 * @returns {Array} assignments - Array of {student_id, room_id, seat_row, seat_number}
 */
const generateAssignments = (students, rooms) => {
  if (students.length === 0) throw new Error("Taqsimlanadigan o'quvchilar topilmadi");
  if (rooms.length === 0) throw new Error("Imtihon uchun xonalar tanlanmagan");

  const totalCapacity = rooms.reduce((acc, room) => acc + room.capacity, 0);
  if (students.length > totalCapacity) {
    throw new Error(`Xonalar sig'imi yetarli emas! ${students.length} ta o'quvchi bor, lekin xonalarning umumiy sig'imi faqat ${totalCapacity} ta. Iltimos, qo'shimcha xonalar tanlang yoki o'quvchilar sonini kamaytiring.`);
  }

  // Shuffle all students randomly
  let shuffledStudents = shuffle([...students]);
  
  // Initialize room slots with tracking and shuffle room order for randomness
  const roomSlots = shuffle(rooms.map(r => ({
    id: r.id,
    capacity: r.capacity,
    assigned: 0,
    students: []
  })));

  // Evenly distribute: round-robin across shuffled rooms, respecting capacity
  let roomIndex = 0;
  for (const student of shuffledStudents) {
    // Find next room with available capacity (round-robin)
    let attempts = 0;
    while (roomSlots[roomIndex].assigned >= roomSlots[roomIndex].capacity) {
      roomIndex = (roomIndex + 1) % roomSlots.length;
      attempts++;
      if (attempts > roomSlots.length) {
        throw new Error("Xonalar sig'imi yetarli emas (ichki xatolik)");
      }
    }

    roomSlots[roomIndex].students.push(student);
    roomSlots[roomIndex].assigned++;
    roomIndex = (roomIndex + 1) % roomSlots.length;
  }

  // Convert to assignment records with seat positions
  const assignments = [];
  for (const room of roomSlots) {
    let seatNumber = 1;
    for (const student of room.students) {
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
