/**
 * Mock Data Generator for Hazard Reports
 * Run this script to populate Firestore with realistic hazard report data
 * 
 * Usage: npx tsx scripts/generate-mock-data.ts
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

// Firebase config - update with your actual config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Mock user names
const mockUsers = [
  { name: 'Juan Dela Cruz', id: 'user1' },
  { name: 'Maria Santos', id: 'user2' },
  { name: 'Pedro Garcia', id: 'user3' },
  { name: 'Ana Reyes', id: 'user4' },
  { name: 'Carlos Mendoza', id: 'user5' },
  { name: 'Sofia Martinez', id: 'user6' },
  { name: 'Miguel Rivera', id: 'user7' },
  { name: 'Isabella Torres', id: 'user8' },
]

// Categories and their weights for random selection
const categories = [
  'leaning-pole',
  'spaghetti-wires',
  'sparking-transformer',
  'vegetation',
] as const

const hazardIntensities = ['urgent', 'moderate', 'normal'] as const

// Metro Manila coordinates with specific barangays
const locations = [
  // Manila
  { lat: 14.5995, lng: 120.9842, address: 'Ermita, Manila' },
  { lat: 14.6091, lng: 120.9940, address: 'Quiapo, Manila' },
  { lat: 14.6042, lng: 121.0122, address: 'Santa Cruz, Manila' },
  { lat: 14.5764, lng: 121.0081, address: 'Paco, Manila' },
  
  // Quezon City
  { lat: 14.6760, lng: 121.0437, address: 'Diliman, Quezon City' },
  { lat: 14.6488, lng: 121.0509, address: 'Cubao, Quezon City' },
  { lat: 14.6231, lng: 121.0348, address: 'Project 4, Quezon City' },
  { lat: 14.6956, lng: 121.0789, address: 'Commonwealth, Quezon City' },
  
  // Makati
  { lat: 14.5547, lng: 121.0244, address: 'Poblacion, Makati' },
  { lat: 14.5639, lng: 121.0450, address: 'Bel-Air, Makati' },
  { lat: 14.5176, lng: 121.0199, address: 'San Lorenzo, Makati' },
  
  // Pasig
  { lat: 14.5764, lng: 121.0851, address: 'Kapitolyo, Pasig' },
  { lat: 14.5896, lng: 121.0621, address: 'Ortigas, Pasig' },
  { lat: 14.5547, lng: 121.0640, address: 'Santolan, Pasig' },
  
  // Mandaluyong
  { lat: 14.5794, lng: 121.0359, address: 'Highway Hills, Mandaluyong' },
  { lat: 14.5815, lng: 121.0529, address: 'Plainview, Mandaluyong' },
  
  // Taguig
  { lat: 14.5176, lng: 121.0509, address: 'Bonifacio Global City, Taguig' },
  { lat: 14.5378, lng: 121.0699, address: 'Fort Bonifacio, Taguig' },
  { lat: 14.4872, lng: 121.0435, address: 'Western Bicutan, Taguig' },
  
  // Parañaque
  { lat: 14.4793, lng: 121.0198, address: 'Baclaran, Parañaque' },
  { lat: 14.4618, lng: 121.0226, address: 'BF Homes, Parañaque' },
  
  // Las Piñas
  { lat: 14.4456, lng: 120.9822, address: 'Talon, Las Piñas' },
  { lat: 14.4246, lng: 121.0012, address: 'Almanza, Las Piñas' },
  
  // Muntinlupa
  { lat: 14.4089, lng: 121.0419, address: 'Alabang, Muntinlupa' },
  { lat: 14.3833, lng: 121.0494, address: 'Ayala Alabang, Muntinlupa' },
  
  // Caloocan
  { lat: 14.6569, lng: 120.9835, address: 'Monumento, Caloocan' },
  { lat: 14.7289, lng: 121.0419, address: 'North Caloocan' },
  
  // Malabon
  { lat: 14.6626, lng: 120.9573, address: 'Flores, Malabon' },
  
  // Navotas
  { lat: 14.6684, lng: 120.9403, address: 'Tangos, Navotas' },
  
  // Valenzuela
  { lat: 14.6760, lng: 120.9830, address: 'Malinta, Valenzuela' },
  { lat: 14.7099, lng: 121.0070, address: 'Karuhatan, Valenzuela' },
  
  // Marikina
  { lat: 14.6507, lng: 121.1029, address: 'Concepcion Uno, Marikina' },
  { lat: 14.6332, lng: 121.0956, address: 'Industrial Valley, Marikina' },
  
  // San Juan
  { lat: 14.6019, lng: 121.0355, address: 'Greenhills, San Juan' },
  { lat: 14.5995, lng: 121.0281, address: 'West Crame, San Juan' },
  
  // Pasay
  { lat: 14.5378, lng: 121.0014, address: 'Malibay, Pasay' },
  { lat: 14.5243, lng: 120.9950, address: 'EDSA Extension, Pasay' },
]

// Sample comments
const sampleComments = [
  'This is very dangerous! Please fix ASAP.',
  'I noticed this last week, glad someone reported it.',
  'The wires are getting worse during rainy days.',
  'Meralco should prioritize this area.',
  'Thank you for reporting! Stay safe everyone.',
  'I can confirm this hazard exists.',
  'This needs immediate attention from authorities.',
  'Has anyone contacted Meralco about this?',
  'The situation has worsened since yesterday.',
  'Kids play near this area. Very concerning!',
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getRandomDate(daysBack: number): Date {
  const now = new Date()
  const pastDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)
  const randomTime = Math.random() * (now.getTime() - pastDate.getTime())
  return new Date(pastDate.getTime() + randomTime)
}

async function generateMockData(numberOfReports: number = 50) {
  console.log(`🚀 Generating ${numberOfReports} mock hazard reports...`)

  try {
    const reports = []

    for (let i = 0; i < numberOfReports; i++) {
      const user = getRandomElement(mockUsers)
      const location = getRandomElement(locations)
      const category = getRandomElement(categories)
      const intensity = getRandomElement(hazardIntensities)
      const createdAt = getRandomDate(30) // Within last 30 days

      const report = {
        userId: user.id,
        userName: user.name,
        category,
        hazardIntensity: intensity,
        location: {
          lat: location.lat + (Math.random() - 0.5) * 0.01, // Add slight randomness
          lng: location.lng + (Math.random() - 0.5) * 0.01,
        },
      address: location.address,
      photoURL: '/logo.png',
      status: getRandomElement(['pending', 'in-progress', 'resolved'] as const),
        pointsAwarded: intensity === 'urgent' ? 100 : intensity === 'moderate' ? 75 : 50,
        createdAt: createdAt,
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'hazardReports'), report)
      reports.push({ id: docRef.id, ...report })

      // Add random comments (0-5 comments per report)
      const numComments = getRandomInt(0, 5)
      for (let j = 0; j < numComments; j++) {
        const commenter = getRandomElement(mockUsers)
        const commentDate = new Date(
          createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())
        )

        await addDoc(collection(db, `hazardReports/${docRef.id}/comments`), {
          userId: commenter.id,
          userName: commenter.name,
          comment: getRandomElement(sampleComments),
          createdAt: commentDate,
        })
      }

      console.log(`✅ Created report ${i + 1}/${numberOfReports}: ${category} in ${location.address}`)
    }

    console.log(`\n🎉 Successfully generated ${numberOfReports} hazard reports!`)
    console.log(`📊 Summary:`)
    console.log(`   - Urgent: ${reports.filter(r => r.hazardIntensity === 'urgent').length}`)
    console.log(`   - Moderate: ${reports.filter(r => r.hazardIntensity === 'moderate').length}`)
    console.log(`   - Normal: ${reports.filter(r => r.hazardIntensity === 'normal').length}`)
    console.log(`\n🗺️  Check your map to see all the new reports!`)

  } catch (error) {
    console.error('❌ Error generating mock data:', error)
    throw error
  }
}

// Run the script
const numberOfReports = parseInt(process.argv[2]) || 50
generateMockData(numberOfReports)
  .then(() => {
    console.log('\n✨ Mock data generation complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed to generate mock data:', error)
    process.exit(1)
  })
