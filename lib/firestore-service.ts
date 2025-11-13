import { 
  collection, 
  addDoc, 
  updateDoc,
  doc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { HazardReport, HazardComment } from './store'

// Collection references
const HAZARD_REPORTS_COLLECTION = 'hazardReports'
const COMMENTS_COLLECTION = 'comments'

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate()
  }
  return new Date(timestamp)
}

// Save a new hazard report to Firestore
export const saveHazardReport = async (report: Omit<HazardReport, 'id'>) => {
  try {
    // Remove undefined values (Firestore doesn't accept them)
    const cleanedReport = Object.fromEntries(
      Object.entries(report).filter(([_, value]) => value !== undefined)
    )
    
    const docRef = await addDoc(collection(db, HAZARD_REPORTS_COLLECTION), {
      ...cleanedReport,
      createdAt: serverTimestamp(),
      comments: [] // Initialize empty comments array
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving hazard report:', error)
    throw error
  }
}

// Get all hazard reports
export const getAllHazardReports = async (): Promise<HazardReport[]> => {
  try {
    const q = query(
      collection(db, HAZARD_REPORTS_COLLECTION),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const reports: HazardReport[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      reports.push({
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt),
        comments: data.comments || []
      } as HazardReport)
    })
    
    return reports
  } catch (error) {
    console.error('Error getting hazard reports:', error)
    return []
  }
}

// Subscribe to real-time hazard reports updates
export const subscribeToHazardReports = (
  callback: (reports: HazardReport[]) => void
) => {
  const q = query(
    collection(db, HAZARD_REPORTS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const reports: HazardReport[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      reports.push({
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt),
        comments: data.comments || []
      } as HazardReport)
    })
    callback(reports)
  }, (error) => {
    console.error('Error in hazard reports subscription:', error)
  })
}

// Add a comment to a hazard report
export const addCommentToReport = async (
  reportId: string, 
  comment: Omit<HazardComment, 'id' | 'createdAt'>
) => {
  try {
    const reportRef = doc(db, HAZARD_REPORTS_COLLECTION, reportId)
    
    // Remove undefined values (Firestore doesn't accept them)
    const cleanedComment = Object.fromEntries(
      Object.entries(comment).filter(([_, value]) => value !== undefined)
    )
    
    // Create comment with ID and timestamp
    const newComment: HazardComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date()
    }
    
    // Get current report to update comments array
    const commentsCollectionRef = collection(db, HAZARD_REPORTS_COLLECTION, reportId, COMMENTS_COLLECTION)
    await addDoc(commentsCollectionRef, {
      ...cleanedComment,
      createdAt: serverTimestamp()
    })
    
    return newComment
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

// Subscribe to comments for a specific report
export const subscribeToReportComments = (
  reportId: string,
  callback: (comments: HazardComment[]) => void
) => {
  const q = query(
    collection(db, HAZARD_REPORTS_COLLECTION, reportId, COMMENTS_COLLECTION),
    orderBy('createdAt', 'asc')
  )
  
  return onSnapshot(q, (querySnapshot) => {
    const comments: HazardComment[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      comments.push({
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt)
      } as HazardComment)
    })
    callback(comments)
  }, (error) => {
    console.error('Error in comments subscription:', error)
  })
}

// Update report status
export const updateReportStatus = async (
  reportId: string,
  status: 'pending' | 'in-progress' | 'resolved'
) => {
  try {
    const reportRef = doc(db, HAZARD_REPORTS_COLLECTION, reportId)
    await updateDoc(reportRef, { status })
  } catch (error) {
    console.error('Error updating report status:', error)
    throw error
  }
}

// Get reports by user
export const getUserReports = async (userId: string): Promise<HazardReport[]> => {
  try {
    const q = query(
      collection(db, HAZARD_REPORTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const reports: HazardReport[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      reports.push({
        id: doc.id,
        ...data,
        createdAt: timestampToDate(data.createdAt),
        comments: data.comments || []
      } as HazardReport)
    })
    
    return reports
  } catch (error) {
    console.error('Error getting user reports:', error)
    return []
  }
}
