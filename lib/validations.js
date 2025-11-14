// GPS Validation using Haversine formula
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export function validateGPSLocation(userLat, userLng, officeLat, officeLng, radiusMeters = 100) {
  const distance = calculateDistance(userLat, userLng, officeLat, officeLng);
  return {
    isValid: distance <= radiusMeters,
    distance: Math.round(distance),
    radiusMeters,
  };
}

// Get current GPS location
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

// QR Code validation
export function validateQRCode(qrData, expiresAt) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  
  return {
    isValid: now < expiry,
    isExpired: now >= expiry,
  };
}

// Determine attendance status based on check-in time
export function determineAttendanceStatus(checkInTime) {
  const checkIn = new Date(checkInTime);
  const hours = checkIn.getHours();
  const minutes = checkIn.getMinutes();
  
  // 08:00 is the cutoff time for on-time
  if (hours < 8 || (hours === 8 && minutes === 0)) {
    return 'present';
  }
  return 'late';
}

// Check if check-out is allowed (after 16:00)
export function canCheckOut(now = new Date()) {
  const hours = now.getHours();
  return hours >= 16;
}
